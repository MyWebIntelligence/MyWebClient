import React, {useCallback, useContext, useEffect, useState} from 'react'
import {Context} from '../../app/Context'
import {Row, Col, Badge, Button, Table} from 'react-bootstrap'
import './ExpressionExplorer.css'
import Expression from "./Expression"
import Domain from "../Domain/Domain"

function ExpressionExplorer() {
    const context = useContext(Context)
    const [selected, setSelected] = useState(false)

    const setPrevPage = _ => {
        if (context.currentPage > 1) {
            context.setCurrentPage(context.currentPage - 1)
        }
    }

    const setNextPage = _ => {
        if (context.currentPage < context.pageCount) {
            context.setCurrentPage(context.currentPage + 1)
        }
    }

    const keyboardControl = useCallback(event => {
        const notFocused = document.querySelectorAll('input:focus, textarea:focus').length === 0
        const unloadedExpression = context.currentExpression === null
        const unloadedDomain = context.currentDomain === null
        if (notFocused && unloadedExpression && unloadedDomain) {
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
    }, [context, selected])

    useEffect(() => {
        document.addEventListener("keydown", keyboardControl, false)
        return () => {
            document.removeEventListener("keydown", keyboardControl, false)
        }
    }, [keyboardControl])

    const groupSelect = event => {
        setSelected(event.target.checked)
        const cbs = document.querySelectorAll(".expressionSelect")
        cbs.forEach(cb => {
            cb.checked = event.target.checked
        })
    }

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

    const dropSelected = _ => {
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
    }

    const sortHint = (column, label) => {
        const sortHint = context.sortOrder === 1 ? <i className="fas fa-caret-up"/> :
            <i className="fas fa-caret-down"/>
        return (column === context.sortColumn) ? <span className="text-primary">{label} {sortHint}</span> : label
    }

    const noResult = <div className="d-flex align-items-center justify-content-center h-100">
        <h2 className="text-muted"><i className="fas fa-exclamation-triangle"/> Select land or change filters</h2>
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
                        <td colSpan="5"><h3 className="text-muted">No results</h3></td>
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

            {context.currentExpression && <Expression/>}
            {context.currentDomain && <Domain/>}
        </div>
    )
}

export default ExpressionExplorer