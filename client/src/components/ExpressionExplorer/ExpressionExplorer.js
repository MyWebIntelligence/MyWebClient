import React, {useContext, useState} from 'react';
import {Context} from '../../app/Context';
import {Row, Col, Badge, Button, Table} from 'react-bootstrap';
import './ExpressionExplorer.css'
import Expression from "./Expression";
import Domain from "../Domain/Domain";

function ExpressionExplorer() {
    const context = useContext(Context);
    const [selected, setSelected] = useState(false);

    const setPrevPage = _ => {
        if (context.currentPage > 1) {
            context.setCurrentPage(context.currentPage - 1);
        }
    };

    const setNextPage = _ => {
        if (context.currentPage < context.pageCount) {
            context.setCurrentPage(context.currentPage + 1);
        }
    };

    const groupSelect = event => {
        setSelected(event.target.checked);
        const cbs = document.querySelectorAll(".expressionSelect");
        cbs.forEach(cb => {
            cb.checked = event.target.checked;
        });
    }

    const checkSelected = _ => {
        let isChecked = false;
        const cbs = document.querySelectorAll(".expressionSelect");
        for (let cb of cbs) {
            if (cb.checked) {
                isChecked = true;
                break;
            }
        }
        setSelected(isChecked);
    }

    const dropSelected = _ => {
        if (window.confirm("Are you sure to drop selected expressions?")) {
            const cbs = document.querySelectorAll(".expressionSelect:checked");
            let ids = [];
            cbs.forEach(cb => {
                ids.push(parseInt(cb.dataset.expressionid));
            });
            context.deleteExpression(ids);
            context.getLand(context.currentLand.id);
            context.getExpressions(context.currentLand.id);
        }
    }

    const sortHint = (column, label) => {
        const sortHint = context.sortOrder === 1 ? <i className="fas fa-caret-up"/> : <i className="fas fa-caret-down"/>;
        return (column === context.sortColumn) ? <span className="text-primary">{label} {sortHint}</span> : label;
    };

    const noResult = <div className="d-flex align-items-center justify-content-center h-100">
        <h2 className="text-muted"><i className="fas fa-exclamation-triangle" /> Select land or change filters</h2>
    </div>;

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
                            <Button variant="outline-danger" className="btn-sm mx-2" disabled={!selected} onClick={dropSelected}>Drop selection</Button>
                        </h2>
                    </Col>
                    <Col md="6" className="d-flex align-items-center justify-content-end">
                        <Button size="sm" className="rounded-pill mx-1" onClick={setPrevPage}>
                            <i className="fas fa-arrow-left" />
                        </Button>

                        <span className="h4">{context.currentPage}/{context.pageCount}</span>

                        <Button size="sm" className="rounded-pill mx-1" onClick={setNextPage}>
                            <i className="fas fa-arrow-right" />
                        </Button>
                    </Col>
                </Row>

                <Table borderless>
                    <thead>
                    <tr>
                        <th style={{width: "40px"}} className="text-center">
                            <input type="checkbox" onClick={groupSelect} />
                        </th>
                        <th style={{width: "75px"}} className="text-center">
                            <span onClick={_ => {context.setSortColumn('id')}}>{sortHint('id', '#')}</span>
                        </th>
                        <th>
                            <span onClick={_ => {context.setSortColumn('e.title')}}>{sortHint('e.title', 'Title')}</span>
                        </th>
                        <th className="text-center">
                            <span onClick={_ => {context.setSortColumn('domainName')}}>{sortHint('domainName', 'Domain')}</span>
                        </th>
                        <th style={{width: "100px"}} className="text-center">
                            <span onClick={_ => {context.setSortColumn('relevance')}}>{sortHint('relevance', 'Relevance')}</span>
                        </th>
                        <th style={{width: "40px"}}>&nbsp;</th>
                    </tr>
                    </thead>
                    <tbody>
                    {context.expressions.map((expression, index) =>
                        <tr key={index}>
                            <td style={{width: "40px"}} className="text-center">
                                <input type="checkbox" className="expressionSelect" onClick={checkSelected} data-expressionid={expression.id} />
                            </td>
                            <td style={{width: "75px"}} className="text-center">{expression.id}</td>
                            <td><span className="hover-pill" onClick={_ => context.getExpression(expression.id)}>{expression.title}</span></td>
                            <td className="text-center"><span className="hover-pill" onClick={_ => context.getDomain(expression.domainId)}>{expression.domainName}</span></td>
                            <td style={{width: "100px"}} className="text-center">{expression.relevance}</td>
                            <td style={{width: "40px"}} className="text-center">
                                <a href={expression.url} target="_blank" rel="noopener noreferrer">
                                    <i className="fas fa-external-link-alt" />
                                </a>
                            </td>
                        </tr>
                    )}
                    {context.expressions.length > 0 || <tr>
                        <td colSpan="5"><h3 className="text-muted">No results</h3></td>
                    </tr>}
                    </tbody>
                </Table>
            </section>
            }

            {context.currentExpression && <Expression/>}
            {context.currentDomain && <Domain/>}
        </div>
    );
}

export default ExpressionExplorer;