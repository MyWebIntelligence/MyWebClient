import React, {Component} from 'react';
import axios from 'axios';
import querystring from 'querystring';
import {delay} from "./Util";

export const DEFAULT_RELEVANCE = 0;
export const DEFAULT_DEPTH = 2;

export const Context = React.createContext();

export class ConfigContext extends Component {
    constructor(props) {
        super(props);
        this.initialState = {
            isConnected: false,
            connecting: false,
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
            sortColumn: 'id',
            sortOrder: 1
        };
        this.state = this.initialState;
    }

    setDb = value => {
        let state = this.initialState;
        state.connecting = true;
        this.setState(state);

        if (value) {
            localStorage.setItem('dbFile', value.toString());
            axios.get('/api/connect?db=' + encodeURI(value)).then(res => {
                if (res.data === true) {
                    axios.get(`/api/lands`).then(res => {
                        this.setState({
                            connecting: false,
                            lands: res.data,
                            land: null,
                            expressions: [],
                            currentExpression: null,
                        });
                        this.getLand(res.data[0].id);
                        this.getExpressions(res.data[0].id);
                    });
                }
                this.setState({
                    isConnected: res.data
                });
            });
        } else {
            localStorage.removeItem('dbFile');
            this.setState(this.initialState);
        }
    };

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
                currentPage: 1
            });
        } else {
            const switchingLand = !(this.state.currentLand && this.state.currentLand.id === id);
            const relevance = switchingLand ? DEFAULT_RELEVANCE : this.state.currentRelevance;
            const depth = switchingLand ? DEFAULT_DEPTH : this.state.currentDepth;
            const currentPage = switchingLand ? 1 : this.state.currentPage;

            const params = {
                id: id,
                minRelevance: relevance,
                maxDepth: depth,
            };

            axios.get(`/api/land?${querystring.stringify(params)}`).then(res => {
                console.log(`Loaded land #${id}`);
                this.setState({
                    currentDomain: null,
                    currentLand: res.data,
                    currentExpression: null,
                    resultCount: res.data.expressionCount,
                    pageCount: Math.ceil(res.data.expressionCount / this.state.resultsPerPage),
                    currentPage: currentPage,
                });

                if (switchingLand) {
                    const land = this.state.lands.find(land => land.id === id);
                    this.setState({
                        currentRelevance: DEFAULT_RELEVANCE,
                        minRelevance: land.minRelevance,
                        maxRelevance: land.maxRelevance,
                        currentDepth: DEFAULT_DEPTH,
                        minDepth: land.minDepth,
                        maxDepth: land.maxDepth,
                    });
                }
            });
        }
    };

    getExpressions = landId => {
        const params = {
            landId: landId,
            minRelevance: this.state.currentRelevance,
            maxDepth: this.state.currentDepth,
            offset: (this.state.currentPage - 1) * this.state.resultsPerPage,
            limit: this.state.resultsPerPage,
            sortColumn: this.state.sortColumn,
            sortOrder: this.state.sortOrder,
        };
        axios.get(`/api/expressions?${querystring.stringify(params)}`).then(res => {
            console.log(`Loaded expressions from land #${landId}`);
            this.getLand(landId);
            this.setState({expressions: res.data});
        });
    };

    getDomain = id => {
        if (id === null) {
            this.setState({currentDomain: null});
        } else {
            axios.get(`/api/domain?id=${id}`).then(res => {
                console.log(`Loaded domain #${id}`);
                this.setState({currentDomain: res.data});
            });
        }
    };

    getExpression = id => {
        if (id === null) {
            this.setState({currentExpression: null});
        } else {
            axios.get(`/api/expression?id=${id}`).then(res => {
                console.log(`Loaded expression #${id}`);
                this.setState({currentExpression: res.data});
            });
        }
    };

    deleteExpression = id => {
        axios.get(`/api/deleteExpression?id=${id}`).then(res => {
            console.log(`Loaded expression #${id}`);
        });
    }

    getPrevExpression = (id, landId) => {
        const params = {
            landId: landId,
            minRelevance: this.state.currentRelevance,
            maxDepth: this.state.currentDepth,
            id: id,
        };
        axios.get(`/api/prev?${querystring.stringify(params)}`).then(res => {
            if (res.data !== null) {
                console.log(`Prev expression is #${res.data}`);
            }
            this.getExpression(res.data);
        });
    };

    getNextExpression = (id, landId) => {
        const params = {
            landId: landId,
            minRelevance: this.state.currentRelevance,
            maxDepth: this.state.currentDepth,
            id: id,
        };
        axios.get(`/api/next?${querystring.stringify(params)}`).then(res => {
            if (res.data !== null) {
                console.log(`Next expression is #${res.data}`);
            }
            this.getExpression(res.data);
        });
    };

    setCurrentRelevance = value => {
        this.setState({currentRelevance: value}, () => {
            this.setCurrentPage(1);
            this.getExpressions(this.state.currentLand.id);
        });
    };

    setCurrentDepth = value => {
        this.setState({currentDepth: value}, () => {
            this.getExpressions(this.state.currentLand.id);
        });
    };

    setCurrentPage = value => {
        this.setState({currentPage: value}, () => {
            delay(this.getExpressions, this.state.currentLand.id);
        });
    };

    setResultsPerPage = value => {
        this.setState({resultsPerPage: value}, () => {
            this.getExpressions(this.state.currentLand.id);
        });
    };

    getReadable = expressionId => {
        axios.get(`/api/readable?id=${expressionId}`).then(res => {
            this.setState(state => {
                const expression = state.currentExpression
                expression.readable = res.data
                return {
                    currentExpression: expression
                }
            })
        });
    };

    saveReadable = (expressionId, content) => {
        axios.post(`/api/readable`, {
            id: expressionId,
            content: content
        }).then(res => {
            return res.data
        });
    };

    setSortColumn = column => {
        if (this.state.sortColumn === column) {
            this.setState(currentState => {
                return {sortOrder: currentState.sortOrder * -1}
            }, () => {
                this.getExpressions(this.state.currentLand.id);
            })
        } else {
            this.setState({sortColumn: column}, () => {
                this.getExpressions(this.state.currentLand.id);
            });
        }
    };

    setSortOrder = order => {
        this.setState({sortOrder: parseInt(order)}, () => {
            this.getExpressions(this.state.currentLand.id);
        });
    };

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
        };
        return (
            <Context.Provider value={state}>
                {this.props.children}
            </Context.Provider>
        );
    }
}