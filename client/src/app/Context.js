// Fichier: client/src/app/Context.js
// Description: Ce fichier définit le contexte React principal de l'application (ConfigContext).
// Il gère l'état global de l'application frontend, y compris la connexion à la base de données,
// les données des "lands", expressions, domaines, tags, et les interactions utilisateur associées.
// Toutes les opérations de récupération et de modification de données transitent par ce contexte.

import React, {Component} from 'react'
import axios from 'axios'
import qs from 'qs'
import {delay} from "./Util"

export const DEFAULT_RELEVANCE = 0
export const DEFAULT_DEPTH = 2

// Crée un contexte React qui sera utilisé par les composants pour accéder à l'état et aux fonctions.
export const Context = React.createContext()

/**
 * ConfigContext est un composant React de type Provider qui enveloppe l'application
 * et fournit l'état global et les fonctions pour interagir avec cet état.
 * Il gère la logique de récupération des données depuis l'API backend et met à jour l'état
 * en conséquence, rendant ces données accessibles à tous les composants enfants.
 */
export class ConfigContext extends Component {
    constructor(props) {
        super(props)
        this.initialState = {
            isConnected: false,
            connecting: false,
            connectionError: false,
            isLoadingExpressions: false,
            lands: [],
            currentDomain: null,
            currentDomainTS: null,
            currentLand: null,
            expressions: [],
            currentExpression: null,
            currentExpressionTS: null,
            currentRelevance: DEFAULT_RELEVANCE,
            minRelevance: 0,
            maxRelevance: 0,
            currentDepth: DEFAULT_DEPTH,
            minDepth: 0,
            maxDepth: 0,
            resultCount: 0,
            pageCount: 0,
            currentPage: 1,
            resultsPerPage: 50,
            sortColumn: 'e.id',
            sortOrder: 1,
            tags: [],
            taggedContent: [],
            allTaggedContent: null,
            allTaggedContentTS: null,
            currentTagFilter: null
        }
        this.state = this.initialState
    }

    // Retourne un timestamp basé sur window.performance.now().
    ts = _ => Math.round(window.performance.now())

    /**
     * Configure la base de données à utiliser.
     * Stocke le chemin de la base de données dans localStorage et tente de se connecter via l'API.
     * Met à jour l'état de connexion et charge les "lands" initiales si la connexion réussit.
     * @param {string} dbPath - Le chemin vers le fichier de la base de données SQLite.
     */
    setDb = dbPath => {
        let state = this.initialState
        state.connecting = true
        this.setState(state)

        if (dbPath) {
            localStorage.setItem('dbFile', dbPath.toString())
            axios.get('/api/connect?db=' + encodeURI(dbPath)).then(res => {
                if (res.data === true) {
                    axios.get(`/api/lands`).then(res => {
                        this.setState({
                            connecting: false,
                            lands: res.data,
                            land: null,
                            expressions: [],
                            currentExpression: null,
                            tags: [],
                            taggedContent: [],
                            allTaggedContent: null,
                        })
                        this.getLand(res.data[0].id)
                    })
                } else {
                    this.setState({
                        isConnected: false,
                        connecting: false,
                        connectionError: true,
                    })
                }

                this.setState({
                    isConnected: res.data,
                })
            })
        } else {
            localStorage.removeItem('dbFile')
            this.setState(this.initialState)
        }
    }

    /**
     * Récupère les informations d'un "land" spécifique par son ID.
     * Met à jour l'état avec les détails du "land" courant, y compris les comptes d'expressions
     * et les plages de pertinence/profondeur.
     * Si le "land" change, réinitialise les filtres et recharge les expressions et tags.
     * @param {number} id - L'ID du "land" à charger.
     */
    getLand = id => {
        if (id === null) {
            this.setState({
                currentDomain: null,
                currentLand: null,
                expressions: [],
                currentExpression: null,
                currentRelevance: DEFAULT_RELEVANCE,
                currentDepth: DEFAULT_DEPTH,
                resultCount: 0,
                pageCount: 0,
                currentPage: 1,
                tags: [],
                taggedContent: [],
                allTaggedContent: null,
            })
        } else {
            const switchingLand = !(this.state.currentLand && (this.state.currentLand.id === id))
            const relevance = switchingLand ? DEFAULT_RELEVANCE : this.state.currentRelevance
            const depth = switchingLand ? DEFAULT_DEPTH : this.state.currentDepth
            const currentPage = switchingLand ? 1 : this.state.currentPage

            const params = {
                id: id,
                minRelevance: relevance,
                maxDepth: depth,
            }

            axios.get(`/api/land?${qs.stringify(params)}`).then(res => {
                console.log(`Loaded land #${id}`)
                this.setState({
                    currentDomain: null,
                    currentLand: res.data,
                    currentExpression: null,
                    resultCount: res.data.expressionCount,
                    pageCount: Math.ceil(res.data.expressionCount / this.state.resultsPerPage),
                    currentPage: currentPage,
                })

                if (switchingLand) {
                    const land = this.state.lands.find(land => land.id === id)
                    this.setState({
                        currentRelevance: DEFAULT_RELEVANCE,
                        minRelevance: land.minRelevance,
                        maxRelevance: land.maxRelevance,
                        currentDepth: DEFAULT_DEPTH,
                        minDepth: land.minDepth,
                        maxDepth: land.maxDepth,
                        taggedContent: [],
                        allTaggedContent: null,
                    })
                    this.getExpressions(land.id)
                    this.getTags(land.id)
                }
            })
        }
    }

    /**
     * Récupère une page d'expressions pour un "land" donné, en fonction des filtres actuels
     * (pertinence, profondeur, tri, pagination).
     * Met à jour l'état avec la liste des expressions chargées.
     * @param {number} landId - L'ID du "land" pour lequel charger les expressions.
     */
    getExpressions = landId => {
        const params = {
            landId: landId,
            minRelevance: this.state.currentRelevance,
            maxDepth: this.state.currentDepth,
            offset: (this.state.currentPage - 1) * this.state.resultsPerPage,
            limit: this.state.resultsPerPage,
            sortColumn: this.state.sortColumn,
            sortOrder: this.state.sortOrder,
        }
        axios.get(`/api/expressions?${qs.stringify(params)}`).then(res => {
            console.log(`Loaded expressions from land #${landId}`)
            this.setState({
                isLoadingExpressions: false,
                expressions: res.data
            })
        })
    }

    /**
     * Récupère les informations d'un domaine spécifique par son ID.
     * Met à jour l'état avec les détails du domaine courant.
     * @param {number} id - L'ID du domaine à charger.
     */
    getDomain = id => {
        if (id === null) {
            this.setState({currentDomain: null})
        } else {
            axios.get(`/api/domain?id=${id}`).then(res => {
                console.log(`Loaded domain #${id}`)
                this.setState({currentDomain: res.data, currentDomainTS: this.ts()})
            })
        }
    }

    /**
     * Récupère les détails d'une expression spécifique par son ID.
     * Met à jour l'état avec l'expression courante et charge le contenu taggé associé.
     * @param {number} id - L'ID de l'expression à charger.
     */
    getExpression = id => {
        if (id === null) {
            this.setState({
                currentExpression: null,
                taggedContent: []
            })
        } else {
            axios.get(`/api/expression?id=${id}`).then(res => {
                console.log(`Loaded expression #${id}`)
                this.setState({currentExpression: res.data, currentExpressionTS: this.ts()})
                this.getTaggedContent({expressionId: id})
            })
        }
    }

    /**
     * Supprime une expression par son ID.
     * Met à jour l'état pour indiquer le chargement pendant la suppression.
     * @param {number} id - L'ID de l'expression à supprimer.
     */
    deleteExpression = id => {
        this.setState({isLoadingExpressions: true})
        const ids = {id: id}
        axios.get(`/api/deleteExpression?${qs.stringify(ids, {encode: false, arrayFormat: 'brackets'})}`).then(_ => {
            console.log(`Loaded expression #${id}`)
        })
    }

    /**
     * Récupère l'expression précédente dans la liste triée et filtrée actuelle.
     * @param {number} id - L'ID de l'expression actuelle.
     * @param {number} landId - L'ID du "land" actuel.
     */
    getPrevExpression = (id, landId) => {
        const params = {
            id: id,
            landId: landId,
            minRelevance: this.state.currentRelevance,
            maxDepth: this.state.currentDepth,
            sortColumn: this.state.sortColumn,
            sortOrder: this.state.sortOrder,
        }
        axios.get(`/api/prev?${qs.stringify(params)}`).then(res => {
            if (res.data !== null) {
                console.log(`Prev expression is #${res.data}`)
            }
            this.getExpression(res.data)
        })
    }

    /**
     * Récupère l'expression suivante dans la liste triée et filtrée actuelle.
     * @param {number} id - L'ID de l'expression actuelle.
     * @param {number} landId - L'ID du "land" actuel.
     */
    getNextExpression = (id, landId) => {
        const params = {
            id: id,
            landId: landId,
            minRelevance: this.state.currentRelevance,
            maxDepth: this.state.currentDepth,
            sortColumn: this.state.sortColumn,
            sortOrder: this.state.sortOrder,
        }
        axios.get(`/api/next?${qs.stringify(params)}`).then(res => {
            if (res.data !== null) {
                console.log(`Next expression is #${res.data}`)
            }
            this.getExpression(res.data)
        })
    }

    /**
     * Met à jour la valeur du filtre de pertinence.
     * Réinitialise la page courante à 1 et recharge le "land" avec le nouveau filtre.
     * @param {number} value - La nouvelle valeur de pertinence.
     */
    setCurrentRelevance = value => {
        this.setState({currentRelevance: value}, () => {
            this.setCurrentPage(1)
            this.getLand(this.state.currentLand.id)
        })
    }

    /**
     * Met à jour la valeur du filtre de profondeur.
     * Recharge le "land" avec le nouveau filtre.
     * @param {number} value - La nouvelle valeur de profondeur.
     */
    setCurrentDepth = value => {
        this.setState({currentDepth: value}, () => {
            this.getLand(this.state.currentLand.id)
        })
    }

    /**
     * Met à jour la page courante pour la pagination des expressions.
     * Recharge les expressions pour la nouvelle page après un court délai.
     * @param {number} value - Le nouveau numéro de page.
     */
    setCurrentPage = value => {
        this.setState({
            isLoadingExpressions: true,
            currentPage: value
        }, () => {
            delay(400, this.getExpressions, this.state.currentLand.id)
        })
    }

    /**
     * Met à jour le nombre de résultats par page.
     * Recharge les expressions avec la nouvelle limite.
     * @param {number} value - Le nouveau nombre de résultats par page.
     */
    setResultsPerPage = value => {
        this.setState({resultsPerPage: value}, () => {
            this.getExpressions(this.state.currentLand.id)
        })
    }

    /**
     * Récupère la version "lisible" (markdown converti) d'une expression.
     * Met à jour l'état de l'expression courante avec ce contenu.
     * @param {number} expressionId - L'ID de l'expression.
     */
    getReadable = expressionId => {
        axios.get(`/api/readable?id=${expressionId}&includeLinks=true&includeMedia=true`).then(res => {
            this.setState(state => {
                const expression = state.currentExpression
                expression.readable = res.data
                return {
                    currentExpression: expression,
                    currentExpressionTS: this.ts(),
                }
            })
            return res.data
        })
    }

    /**
     * Sauvegarde la version "lisible" (markdown) d'une expression.
     * @param {number} expressionId - L'ID de l'expression.
     * @param {string} content - Le contenu markdown à sauvegarder.
     */
    saveReadable = (expressionId, content) => {
        axios.post(`/api/readable`, {
            id: expressionId,
            content: content
        }).then(res => res.data)
    }

    /**
     * Définit la colonne de tri pour la liste des expressions.
     * Si la colonne est la même que l'actuelle, inverse l'ordre de tri.
     * Recharge les expressions avec les nouveaux paramètres de tri.
     * @param {string} column - Le nom de la colonne sur laquelle trier.
     */
    setSortColumn = column => {
        if (this.state.sortColumn === column) {
            this.setState(currentState => {
                return {sortOrder: currentState.sortOrder * -1}
            }, () => {
                this.getExpressions(this.state.currentLand.id)
            })
        } else {
            this.setState({sortColumn: column}, () => {
                this.getExpressions(this.state.currentLand.id)
            })
        }
    }

    /**
     * Définit l'ordre de tri (ascendant ou descendant).
     * Recharge les expressions avec le nouvel ordre.
     * @param {number} order - L'ordre de tri (1 pour ascendant, -1 pour descendant).
     */
    setSortOrder = order => {
        this.setState({sortOrder: parseInt(order)}, () => {
            this.getExpressions(this.state.currentLand.id)
        })
    }

    /**
     * Récupère la liste des tags pour un "land" spécifique.
     * Met à jour l'état avec les tags chargés.
     * @param {number} landId - L'ID du "land".
     */
    getTags = landId => {
        if (landId === null) {
            this.setState({tags: []})
        } else {
            axios.get(`/api/tags?${qs.stringify({landId: landId})}`).then(res => {
                console.log(`Loaded tags from land #${landId}`)
                this.setState({tags: res.data})
            })
        }
    }

    /**
     * Met à jour la structure des tags pour le "land" courant.
     * Détecte si des changements ont eu lieu avant d'envoyer une requête à l'API.
     * Si des changements sont détectés, sauvegarde les tags via l'API et recharge les tags et le contenu taggé.
     * @param {Array} tags - La nouvelle structure hiérarchique des tags.
     */
    setTags = tags => {
        const tagsHaveChanged = (a, b, d) => {
            if (a.length !== b.length) {
                console.log(`Size changed from ${a.length} to ${b.length}`)
                return true
            }

            return a.some((tag, i) => {
                if (!(i in b)) {
                    console.log(`Tag removed from tree`)
                    return true
                }

                if (tag.id !== b[i].id) {
                    console.log(`Sort changed from ${tag.id} to ${b[i].id}`)
                    return true
                }

                if (tag.name !== b[i].name) {
                    console.log(`Name changed from ${tag.name} to ${b[i].name}`)
                    return true
                }

                return tagsHaveChanged(tag.children, b[i].children, d + 1)
            })
        }

        if (tagsHaveChanged(this.state.tags, tags, 0)) {
            axios.post(`/api/tags`, {
                landId: this.state.currentLand.id,
                tags: tags
            }).then(_ => {
                console.log("Tags saved")
                this.getTags(this.state.currentLand.id)
                if (this.state.currentExpression !== null) {
                    this.getTaggedContent({expressionId: this.state.currentExpression.id})
                }
            })
        }

        this.setState({tags: tags})
    }

    /**
     * Met à jour les informations d'un tag spécifique (nom, couleur).
     * Recharge la liste des tags après la mise à jour.
     * @param {object} tag - L'objet tag contenant id, name, et color.
     */
    updateTag = tag => {
        axios.post('/api/updateTag', {
            id: tag.id,
            name: tag.name,
            color: tag.color,
        }).then(res => {
            console.log(`Updated tag #${tag.id}`)
            this.getTags(this.state.currentLand.id)
            return res.data
        })
    }

    /**
     * Récupère le contenu taggé pour des paramètres donnés (ex: par expressionId ou tagId).
     * Met à jour l'état `taggedContent`.
     * @param {object} params - Objet de paramètres pour la requête API (ex: {expressionId: 1}).
     */
    getTaggedContent = params => {
        if (params === null) {
            this.setState({taggedContent: []})
        } else {
            const param = qs.stringify(params)
            axios.get(`/api/taggedContent?${param}`).then(res => {
                console.log(`Loaded tagged content for ${param}`)
                this.setState({taggedContent: res.data})
            })
        }
    }

    /**
     * Récupère tout le contenu taggé pour des paramètres donnés (ex: par landId).
     * Utilisé pour des vues agrégées de contenu taggé. Met à jour l'état `allTaggedContent`.
     * @param {object} params - Objet de paramètres pour la requête API (ex: {landId: 1}).
     */
    getAllTaggedContent = params => {
        if (params === null) {
            this.setState({allTaggedContent: null})
        } else {
            const param = qs.stringify(params)
            axios.get(`/api/taggedContent?${param}`).then(res => {
                console.log(`Loaded tagged content for ${param}`)
                this.setState({allTaggedContent: res.data, allTaggedContentTS: this.ts()})
            })
        }
    }

    /**
     * Supprime une instance de contenu taggé.
     * Peut recharger soit tout le contenu taggé du "land", soit seulement celui de l'expression courante.
     * @param {number} taggedContentId - L'ID du contenu taggé à supprimer.
     * @param {boolean} [reloadAll=false] - Si vrai, recharge tout le contenu taggé du "land".
     */
    deleteTaggedContent = (taggedContentId, reloadAll = false) => {
        axios.get(`/api/deleteTaggedContent?id=${taggedContentId}`).then(_ => {
            if (reloadAll === true) {
                this.getAllTaggedContent({landId: this.state.currentLand.id})
            } else {
                this.getTaggedContent({expressionId: this.state.currentExpression.id})
            }
        })
    }

    // Aplatit la structure hiérarchique des tags en une liste simple, ajoutant une propriété de profondeur.
    flatTags = (tags, depth) => {
        let out = []
        tags.forEach(tag => {
            tag.depth = depth
            out.push(tag)
            out = out.concat(this.flatTags(tag.children, depth + 1))
        })
        return out
    }

    // Catégorise le contenu taggé fourni en fonction de la structure de tags actuelle.
    // Retourne une liste de tags, chacun avec une propriété `contents` contenant les éléments taggés associés.
    categorizeTaggedContent = tags => {
        let data = []
        this.flatTags(this.state.tags).forEach(tag => {
            let tagContent = {...tag, contents: []}
            tags.forEach(taggedContent => {
                if (taggedContent.tag_id === tag.id) {
                    tagContent.contents.push(taggedContent)
                }
            })
            if (tagContent.contents.length > 0) {
                data.push(tagContent)
            }
        })
        return data
    }

    /**
     * Crée un nouveau tag sur un segment de texte d'une expression.
     * @param {number} tagId - L'ID du tag à appliquer.
     * @param {number} expressionId - L'ID de l'expression contenant le texte.
     * @param {string} text - Le segment de texte sélectionné.
     * @param {number} start - L'index de début de la sélection.
     * @param {number} end - L'index de fin de la sélection.
     */
    tagContent = (tagId, expressionId, text, start, end) => {
        axios.post('/api/tagContent', {
            tagId: tagId,
            expressionId: expressionId,
            text: text,
            start: start,
            end: end,
        }).then(res => {
            if (res.data && (res.data === true || res.data.id || res.data.message)) {
                console.log(`Saved tagged content`);
                // On force le rafraîchissement en réinitialisant taggedContent à [] avant de recharger
                this.setState({taggedContent: []}, () => {
                    this.getTaggedContent({expressionId: expressionId});
                    // Forcer le rechargement de l'expression pour que TaggedContent se rafraîchisse
                    this.getExpression(expressionId);
                });
            }
        })
    }

    /**
     * Met à jour un tag existant sur un segment de texte.
     * @param {number} contentId - L'ID du contenu taggé à mettre à jour.
     * @param {number} tagId - Le nouvel ID de tag (si changé).
     * @param {string} text - Le nouveau texte (si modifié).
     * @param {boolean} [reloadAll=false] - Si vrai, recharge tout le contenu taggé du "land".
     */
    updateTagContent = (contentId, tagId, text, reloadAll = false) => {
        axios.post('/api/updateTagContent', {
            contentId: contentId,
            tagId: tagId,
            text: text,
        }).then(res => {
            console.log(`Updated tag content #${contentId}`)

            let params = {}
            if (this.state.currentTagFilter !== null) {
                params.tagId = this.state.currentTagFilter
            }

            if (reloadAll === true) {
                this.getAllTaggedContent({landId: this.state.currentLand.id, ...params})
            } else {
                this.getTaggedContent({expressionId: this.state.currentExpression.id, ...params})
            }
            return res.data
        })
    }

    // Définit un filtre de tag courant pour afficher uniquement le contenu associé à ce tag.
    setTagFilter = tagId => {
        this.setState({currentTagFilter: tagId})
    }

    // Vérifie si aucun champ input ou textarea n'a le focus.
    notFocused = _ => document.querySelectorAll('input:focus, textarea:focus').length === 0

    /**
     * Supprime un média (image) associé à l'expression courante.
     * @param {string} image - L'URL du média à supprimer.
     */
    deleteMedia = (image) => {
        axios.post('/api/deleteMedia', {
            expressionId: this.state.currentExpression.id,
            url: image,
        }).then(res => {
            console.log(`Deleted expression #${this.state.currentExpression.id} media ${image}`)
            return res
        })
    }

    render() {
        const state = {
            ...this.state,
            setDb: this.setDb,
            getLand: this.getLand,
            getExpressions: this.getExpressions,
            getDomain: this.getDomain,
            getExpression: this.getExpression,
            deleteExpression: this.deleteExpression,
            getPrevExpression: this.getPrevExpression,
            getNextExpression: this.getNextExpression,
            setCurrentRelevance: this.setCurrentRelevance,
            setCurrentDepth: this.setCurrentDepth,
            setCurrentPage: this.setCurrentPage,
            setResultsPerPage: this.setResultsPerPage,
            getReadable: this.getReadable,
            saveReadable: this.saveReadable,
            setSortColumn: this.setSortColumn,
            setSortOrder: this.setSortOrder,
            getTags: this.getTags,
            setTags: this.setTags,
            updateTag: this.updateTag,
            getTaggedContent: this.getTaggedContent,
            getAllTaggedContent: this.getAllTaggedContent,
            tagContent: this.tagContent,
            updateTagContent: this.updateTagContent,
            flatTags: this.flatTags,
            deleteTaggedContent: this.deleteTaggedContent,
            categorizeTaggedContent: this.categorizeTaggedContent,
            notFocused: this.notFocused,
            setTagFilter: this.setTagFilter,
            deleteMedia: this.deleteMedia,
        }
        return (
            <Context.Provider value={state}>
                {this.props.children}
            </Context.Provider>
        )
    }
}
