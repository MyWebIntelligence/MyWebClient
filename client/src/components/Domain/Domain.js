import React, {useContext} from "react";
import {Context} from '../../app/Context';
import './Domain.css';
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";

function Domain() {
    const context = useContext(Context);

    return <section className={"Domain" + (context.currentDomain ? " d-block" : "")}>
        <Row>
            <Col md="8">
                <h6 className="App-objtype">Domain</h6>
                <h2>{context.currentDomain.name}  <a href={"https://"+context.currentDomain.name} target="_blank" rel="noopener noreferrer"><i className="fas fa-external-link-alt"/></a></h2>
                <h5 className="text-muted">{context.currentDomain.title}</h5>
            </Col>
            <Col md="4" className="d-flex align-items-center justify-content-end">
                <Button size="sm" variant="outline-danger" className="rounded-pill mx-1"
                        onClick={_ => context.getDomain(null)}>
                    <i className="fas fa-times" />
                </Button>
            </Col>
        </Row>

        <p className="lead my-5">{context.currentDomain.description}</p>

        <p>{context.currentDomain.expressionCount} expressions registered from this domain</p>

        <p>{context.currentDomain.keywords}</p>
    </section>
}

export default Domain;