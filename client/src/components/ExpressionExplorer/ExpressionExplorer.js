import React from 'react';
import './ExpressionExplorer.css';
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Carousel from "react-bootstrap/Carousel";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";

function ExpressionExplorer({land, expression, getExpression, getReadable}) {
    const noResult = <div><h1 className="text-muted">No expression to show, please select land</h1></div>;

    const load = expressionId => {
        getExpression(expressionId);
    };

    const readabilize = expressionId => {
        getReadable(expressionId);
    };

    return (
        <div className="ExpressionExplorer">
            {!land.expressions && noResult}
            {land.expressions &&
            <section className="ExpressionExplorer-list">
                <Table borderless>
                    <thead>
                        <tr>
                            <th colSpan="6">
                                <h2>{ land.name} <Badge variant="info">Crawled {land.expressionCount}</Badge></h2>
                            </th>
                        </tr>
                        <tr>
                            <th style={{minWidth:"5%"}}>#</th>
                            <th style={{minWidth:"50%"}}>Title</th>
                            <th style={{minWidth:"20%"}}>Domain</th>
                            <th style={{minWidth:"10%"}} className="text-center">Status</th>
                            <th style={{minWidth:"10%"}} className="text-center">Relevance</th>
                            <th style={{minWidth:"5%"}}> </th>
                        </tr>
                    </thead>
                    <tbody>
                        {land.expressions.map(expression =>
                        <tr key={expression.id} onClick={_ => load(expression.id)}>
                            <td width="5%">{expression.id}</td>
                            <td width="50%">{expression.title}</td>
                            <td width="20%">{expression.domainName}</td>
                            <td width="10%" className="text-center">{expression.httpStatus}</td>
                            <td width="10%" className="text-center">{expression.relevance}</td>
                            <td width="5%"><a href={expression.url} target="_blank" rel="noopener noreferrer"><i className="fas fa-external-link-alt"> </i></a></td>
                        </tr>
                        )}
                    </tbody>
                </Table>
            </section>
            }

            {expression &&
            <section className={"ExpressionExplorer-details" + (expression ? " d-block" : "")}>
                <h2 className="d-flex align-items-center"><Button variant="light" className="App-back rounded-pill" onClick={_ => getExpression(null)}><i className="fas fa-arrow-left"> </i></Button> {expression.title}</h2>
                <p className="lead my-5">{expression.description}</p>
                <Container fluid className="p-0">
                    <Row>
                        <Col md="8">
                            <Form.Group controlId={"expressionForm" + expression.id}>
                                <Form.Label><Button className="rounded-pill" onClick={_ => readabilize(expression.id)}>Readabilize</Button></Form.Label>
                                <Form.Control as="textarea" className="ExpressionExplorer-readable" value={expression.readable} onChange={_ => {}}/>
                            </Form.Group>
                        </Col>
                        <Col md="4">
                            {expression.images &&
                            <Carousel className="ExpressionExplorer-gallery">
                                {expression.images.split(',').map((url, index) =>
                                    <Carousel.Item key={index}>
                                        <img className="d-block w-100" src={url} alt={url} />
                                        <Carousel.Caption>
                                            <p>{url}</p>
                                        </Carousel.Caption>
                                    </Carousel.Item>
                                )}
                            </Carousel>
                            }
                        </Col>
                    </Row>
                </Container>
            </section>
            }
        </div>
    );
}

export default ExpressionExplorer;