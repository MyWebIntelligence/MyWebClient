import React, {useContext} from 'react';
import {Context} from '../../app/Context';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import './ExpressionExplorer.css'
import Expression from "./Expression";
import Domain from "../Domain/Domain";

function ExpressionExplorer() {
    const context = useContext(Context);

    const setPrevPage = () => {
        if (context.currentPage > 1) {
            context.setCurrentPage(context.currentPage - 1);
        }
    };

    const setNextPage = () => {
        if (context.currentPage < context.pageCount) {
            context.setCurrentPage(context.currentPage + 1);
        }
    };

    const sortHint = (column, label) => {
        const sortHint = context.sortOrder === 1 ? <i className="fas fa-caret-up"/> : <i className="fas fa-caret-down"/>;
        return (column === context.sortColumn) ? <span className="text-primary">{label} {sortHint}</span> : label;
    };

    const noResult = <div>
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
                        <th style={{width: "5%"}} className="text-center">
                            <div className="custom-control custom-checkbox">
                                <input type="checkbox" className="custom-control-input"/>
                                <label className="custom-control-label"/>
                            </div>
                        </th>
                        <th style={{width: "5%"}} className="text-center">
                            <span onClick={_ => {context.setSortColumn('id')}}>{sortHint('id', '#')}</span>
                        </th>
                        <th style={{width: "55%"}}>
                            <span onClick={_ => {context.setSortColumn('title')}}>{sortHint('title', 'Title')}</span>
                        </th>
                        <th style={{width: "20%"}} className="text-center">
                            <span onClick={_ => {context.setSortColumn('domainName')}}>{sortHint('domainName', 'Domain')}</span>
                        </th>
                        <th style={{width: "10%"}} className="text-center">
                            <span onClick={_ => {context.setSortColumn('relevance')}}>{sortHint('relevance', 'Relevance')}</span>
                        </th>
                        <th style={{width: "5%"}}>&nbsp;</th>
                    </tr>
                    </thead>
                    <tbody>
                    {context.expressions.map((expression, index) =>
                        <tr key={index}>
                            <td style={{width: "5%"}} className="text-center">
                                <div className="custom-control custom-checkbox">
                                    <input type="checkbox" className="custom-control-input"/>
                                    <label className="custom-control-label"/>
                                </div>
                            </td>
                            <td style={{width: "5%"}} className="text-center">{expression.id}</td>
                            <td style={{width: "60%"}}><span className="hover-pill" onClick={_ => context.getExpression(expression.id)}>{expression.title}</span></td>
                            <td style={{width: "20%"}} className="text-center"><span className="hover-pill" onClick={_ => context.getDomain(expression.domainId)}>{expression.domainName}</span></td>
                            <td style={{width: "10%"}} className="text-center">{expression.relevance}</td>
                            <td style={{width: "5%"}} className="text-center">
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