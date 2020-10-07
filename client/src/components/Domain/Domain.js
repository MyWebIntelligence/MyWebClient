import React, {useCallback, useContext, useEffect} from "react";
import {Context} from '../../app/Context';
import './Domain.css';
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";

function Domain(props) {
    const context = useContext(Context);

    const keyboardControl = useCallback(event => {
        const notFocused = document.querySelectorAll('input:focus, textarea:focus').length === 0
        const unloadedExpression = context.currentExpression === null
        if (notFocused && unloadedExpression) {
            switch (event.keyCode) {
                case 27: context.getDomain(null)
                    break
                default:
                    break
            }
        }
    }, [context])

    useEffect(() => {
        document.addEventListener("keydown", keyboardControl, false)
        return () => {
            document.removeEventListener("keydown", keyboardControl, false)
        }
    }, [keyboardControl])

    return <section className={"Domain" + (context.currentDomain ? " d-block" : "")} style={props.style}>
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

        <h5>Expressions</h5>
        <p>{context.currentDomain.expressionCount} expressions registered in this domain</p>

        <h5>keywords</h5>
        <p>{context.currentDomain.keywords}</p>
    </section>
}

export default Domain;