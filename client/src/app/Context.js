import React, {Component} from 'react'
import axios from 'axios'
import qs from 'qs'
import {delay, log} from "./Util"

export const DEFAULT_RELEVANCE = 0
export const DEFAULT_DEPTH = 2

export const Context = React.createContext()

export class ConfigContext extends Component {
    constructor(props) {
        super(props)
        this.initialState = {
            isConnected: false,
            connecting: false,
            isLoadingExpressions: false,
            lands: [],
            currentDomain: null,
            currentLand: null,
            expressions: [],
            currentExpression: null,
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
        }
        this.state = this.initialState
    }

    setDb = value => {
        let state = this.initialState
        state.connecting = true
        this.setState(state)

        if (value) {
            localStorage.setItem('dbFile', value.toString())
            axios.get('/api/connect?db=' + encodeURI(value)).then(res => {
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
                        })
                        this.getLand(res.data[0].id)
                    })
                }
                this.setState({
                    isConnected: res.data
                })
            })
        } else {
            localStorage.removeItem('dbFile')
            this.setState(this.initialState)
        }
    }

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
                log(`Loaded land #${id}`)
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
                    })
                    this.getExpressions(land.id)
                    this.getTags(land.id)
                }
            })
        }
    }

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
            log(`Loaded expressions from land #${landId}`)
            this.setState({
                isLoadingExpressions: false,
                expressions: res.data
            })
        })
    }

    getDomain = id => {
        if (id === null) {
            this.setState({currentDomain: null})
        } else {
            axios.get(`/api/domain?id=${id}`).then(res => {
                log(`Loaded domain #${id}`)
                this.setState({currentDomain: res.data})
            })
        }
    }

    getExpression = id => {
        if (id === null) {
            this.setState({ currentExpression: null })
        } else {
            axios.get(`/api/expression?id=${id}`).then(res => {
                log(`Loaded expression #${id}`)
                this.setState({ currentExpression: res.data })
                this.getTaggedContent({ expressionId: id })
            })
        }
    }

    deleteExpression = id => {
        this.setState({ isLoadingExpressions: true })
        const ids = {id: id}
        axios.get(`/api/deleteExpression?${qs.stringify(ids, { encode: false, arrayFormat: 'brackets' })}`).then(res => {
            log(`Loaded expression #${id}`)
        })
    }

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
                log(`Prev expression is #${res.data}`)
            }
            this.getExpression(res.data)
        })
    }

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
                log(`Next expression is #${res.data}`)
            }
            this.getExpression(res.data)
        })
    }

    setCurrentRelevance = value => {
        this.setState({currentRelevance: value}, () => {
            this.setCurrentPage(1)
            this.getLand(this.state.currentLand.id)
        })
    }

    setCurrentDepth = value => {
        this.setState({currentDepth: value}, () => {
            this.getLand(this.state.currentLand.id)
        })
    }

    setCurrentPage = value => {
        this.setState({
            isLoadingExpressions: true,
            currentPage: value
        }, () => {
            delay(400, this.getExpressions, this.state.currentLand.id)
        })
    }

    setResultsPerPage = value => {
        this.setState({resultsPerPage: value}, () => {
            this.getExpressions(this.state.currentLand.id)
        })
    }

    getReadable = expressionId => {
        axios.get(`/api/readable?id=${expressionId}`).then(res => {
            this.setState(state => {
                const expression = state.currentExpression
                expression.readable = res.data
                return {
                    currentExpression: expression
                }
            })
            return res.data
        })
    }

    saveReadable = (expressionId, content) => {
        axios.post(`/api/readable`, {
            id: expressionId,
            content: content
        }).then(res => res.data)
    }

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

    setSortOrder = order => {
        this.setState({sortOrder: parseInt(order)}, () => {
            this.getExpressions(this.state.currentLand.id)
        })
    }

    getTags = landId => {
        if (landId === null) {
            this.setState({ tags: [] })
        } else {
            axios.get(`/api/tags?${qs.stringify({landId: landId})}`).then(res => {
                log(`Loaded tags from land #${landId}`)
                this.setState({ tags: res.data })
            })
        }
    }

    setTags = tags => {
        const tagsHaveChanged = (a, b, d) => {
            if (a.length !== b.length) {
                log(`Size changed from ${a.length} to ${b.length}`)
                return true
            }

            return a.some((tag, i) => {
                if (!(i in b)) {
                    log(`Tag removed from tree`)
                    return true
                }

                if (tag.id !== b[i].id) {
                    log(`Sort changed from ${tag.id} to ${b[i].id}`)
                    return true
                }

                if (tag.title !== b[i].title) {
                    log(`Name changed from ${tag.title} to ${b[i].title}`)
                    return true
                }

                return tagsHaveChanged(tag.children, b[i].children, d+1)
            })
        }

        if (tagsHaveChanged(this.state.tags, tags, 0)) {
            axios.post(`/api/tags`, {
                landId: this.state.currentLand.id,
                tags: tags
            }).then(res => {
                log("Tags saved")
                this.getTags(this.state.currentLand.id)
                if (this.state.currentExpression !== null) {
                    this.getTaggedContent({ expressionId: this.state.currentExpression.id })
                }
            })
        }

        this.setState({ tags: tags })
    }

    getTaggedContent = scope => {
        if (scope === null) {
            this.setState({ taggedContent: [] })
        } else {
            const param = qs.stringify(scope)
            axios.get(`/api/taggedContent?${param}`).then(res => {
                log(`Loaded tagged content for ${param}`)
                this.setState({ taggedContent: res.data })
            })
        }
    }

    deleteTaggedContent = taggedContentId => {
        axios.get(`/api/deleteTaggedContent?id=${taggedContentId}`).then(res => {
            this.getTaggedContent({ expressionId: this.state.currentExpression.id })
        })
    }

    tagContent = (tagId, expressionId, text, start, end) => {
        axios.post('/api/tagContent', {
            tagId: tagId,
            expressionId: expressionId,
            text: text,
            start: start,
            end: end,
        }).then(res => {
            if (res.data === true) {
                log(`Saved tagged content`)
                this.getTaggedContent({ expressionId: expressionId })
            }
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
            getTaggedContent: this.getTaggedContent,
            tagContent: this.tagContent,
            deleteTaggedContent: this.deleteTaggedContent,
        }
        return (
            <Context.Provider value={state}>
                {this.props.children}
            </Context.Provider>
        )
    }
}