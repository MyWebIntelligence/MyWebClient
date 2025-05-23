// Fichier: client/src/components/ExpressionExplorer/ExpressionExplorer.js
// Description: Composant React principal pour l'exploration des "expressions".
// Affiche une liste paginée et triable d'expressions pour le "land" actuellement sélectionné.
// Permet la sélection multiple, la suppression d'expressions, et la navigation entre les pages.
// Gère également l'affichage conditionnel des composants Expression (détail), Domain (détail),
// et TaggedContent (contenu taggué pour le land).

import React, {useCallback, useContext, useEffect, useState} from 'react'
import {Context} from '../../app/Context'
import {Row, Col, Badge, Button, Table} from 'react-bootstrap'
import './ExpressionExplorer.css'
import Expression from './Expression'
import Domain from '../Domain/Domain'
import TaggedContent from '../TagExplorer/TaggedContent';

/**
 * Composant ExpressionExplorer.
 * Affiche la liste des expressions pour le "land" courant, avec pagination, tri,
 * et fonctionnalités de sélection/suppression.
 * Gère également l'affichage des vues détaillées (Expression, Domain, TaggedContent).
 */
function ExpressionExplorer() {
    const context = useContext(Context)
    const [selected, setSelected] = useState(false) // État pour la case à cocher "tout sélectionner"

    /**
     * Supprime toutes les expressions actuellement sélectionnées dans la liste.
     * Demande confirmation à l'utilisateur. Si confirmé, récupère les IDs des expressions
     * sélectionnées et appelle la fonction de suppression du contexte.
     * Met ensuite à jour les données du "land" et la liste des expressions.
     */
    const dropSelected = useCallback(_ => {
        if (selected && window.confirm("Are you sure to drop selected expressions?")) {
            const cbs = document.querySelectorAll(".expressionSelect:checked")
            let ids = []
            cbs.forEach(cb => {
                ids.push(parseInt(cb.dataset.expressionid))
            })
            context.deleteExpression(ids)
            context.getLand(context.currentLand.id)
            context.getExpressions(context.currentLand.id)
        }
    }, [context, selected]) // Ajout de context et selected comme dépendances

    /**
     * Navigue vers la page précédente de la liste des expressions.
     * Vérifie si ce n'est pas déjà la première page.
     */
    const setPrevPage = useCallback(_ => {
        if (context.currentPage > 1) {
            context.setCurrentPage(context.currentPage - 1)
        }
    }, [context])

    /**
     * Navigue vers la page suivante de la liste des expressions.
     * Vérifie si ce n'est pas déjà la dernière page.
     */
    const setNextPage = useCallback(_ => {
        if (context.currentPage < context.pageCount) {
            context.setCurrentPage(context.currentPage + 1)
        }
    }, [context])

    /**
     * Gère les raccourcis clavier pour la liste des expressions.
     * Flèche Gauche: Page précédente.
     * Flèche Droite: Page suivante.
     * D: Supprime les expressions sélectionnées (après confirmation).
     * S'applique uniquement si aucun champ n'a le focus et si aucune vue de détail (expression/domaine) n'est ouverte.
     * @param {KeyboardEvent} event - L'événement clavier.
     */
    const keyboardControl = useCallback(event => {
        const unloadedExpression = context.currentExpression === null
        const unloadedDomain = context.currentDomain === null
        if (context.notFocused() && unloadedExpression && unloadedDomain) {
            switch (event.keyCode) {
                case 37: setPrevPage()
                    break
                case 39: setNextPage()
                    break
                case 68: dropSelected()
                    break
                default:
                    break
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context, setPrevPage, setNextPage, dropSelected]) // Suppression de 'selected' des dépendances car dropSelected est maintenant mémorisé avec selected

    useEffect(() => {
        document.addEventListener("keydown", keyboardControl, false)
        return () => {
            document.removeEventListener("keydown", keyboardControl, false)
        }
    }, [keyboardControl])

    /**
     * Gère le clic sur la case à cocher "tout sélectionner/désélectionner".
     * Met à jour l'état `selected` et coche/décoche toutes les cases individuelles des expressions.
     * @param {React.ChangeEvent<HTMLInputElement>} event - L'événement de changement de la case à cocher.
     */
    const groupSelect = event => {
        setSelected(event.target.checked)
        const cbs = document.querySelectorAll(".expressionSelect")
        cbs.forEach(cb => {
            cb.checked = event.target.checked
        })
    }

    /**
     * Vérifie si au moins une expression est sélectionnée dans la liste.
     * Met à jour l'état `selected` (pour la case "tout sélectionner") en conséquence.
     */
    const checkSelected = _ => {
        let isChecked = false
        const cbs = document.querySelectorAll(".expressionSelect")
        for (let cb of cbs) {
            if (cb.checked) {
                isChecked = true
                break
            }
        }
        setSelected(isChecked)
    }

    /**
     * Supprime toutes les expressions actuellement sélectionnées dans la liste.
     * Demande confirmation à l'utilisateur. Si confirmé, récupère les IDs des expressions
     * Génère l'indicateur de tri (flèche haut/bas) pour les en-têtes de colonnes du tableau.
     * Affiche l'indicateur et met en évidence le label si la colonne est la colonne de tri active.
     * @param {string} column - Le nom de la colonne (identifiant technique).
     * @param {string} label - Le label lisible de la colonne.
     * @returns {JSX.Element} Le label avec ou sans indicateur de tri.
     */
    const sortHint = (column, label) => {
        const sortHint = context.sortOrder === 1 ? <i className="fas fa-caret-up"/> :
            <i className="fas fa-caret-down"/>
        return (column === context.sortColumn) ? <span className="text-primary">{label} {sortHint}</span> : label
    }

    const spinner = <div className="py-5">
        <span className="spinner-border text-muted" role="status">
            <span className="sr-only">Loading...</span>
        </span>
    </div>


    const noResult = <div className="d-flex flex-column align-items-center justify-content-center h-100">
        {context.connecting && <>{spinner}<h2 className="text-muted">Connecting database</h2></>}
        {!(context.connecting && context.connectionError) || <>{spinner}<h2 className="text-muted">Setting up application</h2></>}
        {context.connectionError && <h2 className="text-muted">Can't connect to database, please check path</h2>}
    </div>

    return (
        <div className="ExpressionExplorer">
            {!context.currentLand && noResult}
            {context.currentLand &&
            <section className="ExpressionExplorer-list">
                <Row>
                    <Col md="6">
                        <h6 className="App-objtype">Land</h6>
                        <h2>
                            <span className="pr-2">{context.currentLand.name}</span>
                            <Badge pill variant="primary">{context.currentLand.expressionCount}</Badge>
                            <Button variant="outline-danger" className="btn-sm mx-2" disabled={!selected}
                                    onClick={dropSelected}><u>D</u>rop selection</Button>
                        </h2>
                    </Col>
                    <Col md="6" className="d-flex align-items-center justify-content-end paginator">
                        <span className="mx-2 text-primary" onClick={setPrevPage}>
                            <i className="fas fa-arrow-left"/>
                        </span>

                        <span className="h5 mb-1">{context.currentPage}/{context.pageCount}</span>

                        <span className="mx-2 text-primary" onClick={setNextPage}>
                            <i className="fas fa-arrow-right"/>
                        </span>
                    </Col>
                </Row>

                <Table borderless>
                    <thead>
                    <tr>
                        <th style={{width: "40px"}} className="text-center">
                            <input type="checkbox" onClick={event => { groupSelect(event); event.target.blur() }}/>
                        </th>
                        <th style={{width: "75px"}} className="text-center">
                            <span onClick={_ => {
                                context.setSortColumn('e.id')
                            }}>{sortHint('e.id', '#')}</span>
                        </th>
                        <th>
                            <span onClick={_ => {
                                context.setSortColumn('e.title')
                            }}>{sortHint('e.title', 'Title')}</span>
                        </th>
                        <th className="text-center">
                            <span onClick={_ => {
                                context.setSortColumn('d.name')
                            }}>{sortHint('d.name', 'Domain')}</span>
                        </th>
                        <th style={{width: "100px"}} className="text-center">
                            <span onClick={_ => {
                                context.setSortColumn('e.relevance')
                            }}>{sortHint('e.relevance', 'Relevance')}</span>
                        </th>
                        <th style={{width: "100px"}} className="text-center">
                            <span onClick={_ => {
                                context.setSortColumn('COUNT(t.id)')
                            }}>{sortHint('COUNT(t.id)', 'Tags')}</span>
                        </th>
                        <th style={{width: "40px"}}/>
                    </tr>
                    </thead>

                    <tbody>
                    {context.expressions.map((expression, index) =>
                        <tr key={index} onClick={_ => { context.getExpression(expression.id) }}>
                            <td style={{width: "40px"}} className="text-center">
                                <input type="checkbox" className="expressionSelect" onClick={ event => { event.stopPropagation(); checkSelected(); event.target.blur() } }
                                       data-expressionid={expression.id}/>
                            </td>
                            <td style={{width: "75px"}} className="text-center">{expression.id}</td>
                            <td><span className="hover-pill">{expression.title}</span></td>
                            <td className="text-center"><span className="hover-pill"
                                                              onClick={ event => { event.stopPropagation(); context.getDomain(expression.domainId) }}>{expression.domainName}</span>
                            </td>
                            <td style={{width: "100px"}} className="text-center">{expression.relevance}</td>
                            <td style={{width: "100px"}} className="text-center">{expression.tagCount}</td>
                            <td style={{width: "40px"}} className="text-center">
                                <a href={expression.url} target="_blank" rel="noopener noreferrer">
                                    <i className="fas fa-external-link-alt"/>
                                </a>
                            </td>
                        </tr>
                    )}
                    {context.expressions.length > 0 || <tr>
                        <td colSpan="5" className="text-center"><h3 className="text-muted">No results</h3></td>
                    </tr>}
                    </tbody>

                    <tfoot className={context.isLoadingExpressions ? 'd-block' : 'd-none'}>
                    <tr>
                        <td>
                            <div className="d-flex justify-content-center align-items-center h-100">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="sr-only">Loading...</span>
                                </div>
                            </div>
                        </td>
                    </tr>
                    </tfoot>
                </Table>
            </section>
            }

            {context.currentExpression && <Expression style={{zIndex: context.currentExpressionTS}}/>}
            {context.currentDomain && <Domain style={{zIndex: context.currentDomainTS}}/>}
            {context.allTaggedContent && <div className="taggedContentExplorer" style={{zIndex: context.allTaggedContentTS}}>
                <TaggedContent tags={context.allTaggedContent} forLand={true}/>
            </div>}
        </div>
    )
}

export default ExpressionExplorer
