import React, {useContext} from 'react';
import {Context} from '../../config/Context';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import './ExpressionExplorer.css'
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";

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

    const textSelection = event => {
        console.log(event.currentTarget.selectionStart, event.currentTarget.selectionEnd);
    };

    const noResult = <div>
        <h2 className="text-muted"><i className="fas fa-exclamation-triangle"> </i> Select land or change filters</h2>
    </div>;

    return (
        <div className="ExpressionExplorer">
            {!context.currentLand && noResult}
            {context.currentLand &&
            <section className="ExpressionExplorer-list">
                <Row>
                    <Col md="6">
                        <h2>{context.currentLand.name}
                            <Badge pill variant="primary">{context.currentLand.expressionCount}</Badge>
                        </h2>
                    </Col>
                    <Col md="6" className="text-right">
                        <Button size="sm" variant="link" onClick={setPrevPage}>
                            <i className="fas fa-arrow-left"> </i>
                        </Button>
                        <span>Page {context.currentPage}/{context.pageCount}</span>
                        <Button size="sm" variant="link" onClick={setNextPage}>
                            <i className="fas fa-arrow-right"> </i>
                        </Button>
                    </Col>
                </Row>

                <Table borderless>
                    <thead>
                    <tr>
                        <th style={{width: "5%"}} className="text-center">#</th>
                        <th style={{width: "60%"}}>Title</th>
                        <th style={{width: "20%"}} className="text-center">Domain</th>
                        <th style={{width: "10%"}} className="text-center">Relevance</th>
                        <th style={{width: "5%"}}>&nbsp;</th>
                    </tr>
                    </thead>
                    <tbody>
                    {context.expressions.map((expression, index) =>
                        <tr key={index} onClick={_ => context.getExpression(expression.id)} data-id={expression.id}>
                            <td style={{width: "5%"}} className="text-center">{expression.id}</td>
                            <td style={{width: "60%"}}>{expression.title}</td>
                            <td style={{width: "20%"}} className="text-center">{expression.domainName}</td>
                            <td style={{width: "10%"}} className="text-center">{expression.relevance}</td>
                            <td style={{width: "5%"}} className="text-center">
                                <a href={expression.url} target="_blank" rel="noopener noreferrer">
                                    <i className="fas fa-external-link-alt"> </i>
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

            {context.currentExpression &&
            <section className={"ExpressionExplorer-details" + (context.currentExpression ? " d-block" : "")}>
                <h2 className="d-flex align-items-center">
                    <Button variant="primary" className="App-back rounded-pill"
                            onClick={_ => context.getExpression(null)}>
                        <i className="fas fa-arrow-left"> </i>
                    </Button> {context.currentExpression.title}
                </h2>
                <p className="lead my-5">{context.currentExpression.description}</p>
                <Container fluid className="p-0">
                    <Row>
                        <Col md="8">
                            <Form.Group controlId={"expressionForm" + context.currentExpression.id}>
                                <Form.Label>
                                    <Button className="rounded-pill"
                                            onClick={_ => context.getReadable(context.currentExpression.id)}>Readabilize</Button>
                                </Form.Label>
                                <Form.Control as="textarea" className="ExpressionExplorer-readable"
                                              value={context.currentExpression.readable} onChange={_ => {
                                }} onMouseUp={textSelection}/>
                            </Form.Group>
                            <Row>
                                <Col md="5" className="text-right">
                                    <Button
                                        onClick={_ => context.getPrevExpression(context.currentExpression.id, context.currentExpression.landId)}>Prev</Button>
                                </Col>
                                <Col md="2" className="text-center">
                                    <Button variant="outline-danger">Delete</Button>
                                </Col>
                                <Col md="5" className="text-left">
                                    <Button
                                        onClick={_ => context.getNextExpression(context.currentExpression.id, context.currentExpression.landId)}>Next</Button>
                                </Col>
                            </Row>
                        </Col>
                        <Col md="4">

                        </Col>
                    </Row>
                </Container>
            </section>
            }
        </div>
    );
}

export default ExpressionExplorer;