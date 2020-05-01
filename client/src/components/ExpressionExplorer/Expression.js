import React, {useContext, useEffect, useRef, useState} from "react";
import {Context} from '../../app/Context';
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";

function Expression() {
    const context = useContext(Context);
    const textRef = useRef();
    const highlightsRef = useRef();
    const backdropRef = useRef();

    const [content, setContent] = useState(context.currentExpression.readable);
    const [contentChanged, setContentChanged] = useState(false);
    const [textSelection, setTextSelection] = useState();

    useEffect(() => {
        setContent(context.currentExpression.readable);
        setContentChanged(false);
    }, [context]);


    const onTextChange = event => {
        const content = event.target.value;
        setContent(content);

        const textChanged = content !== context.currentExpression.readable;
        setContentChanged(textChanged)

        highlightsRef.current.innerHTML = applyHighlights(content);
    };

    const selectText = event => {
        const selected = textRef.current.value.substring(event.currentTarget.selectionStart, event.currentTarget.selectionEnd);
        setTextSelection(selected)
    };

    function applyHighlights(text) {
        /**
         * @todo implement text highlight
         */
        return text
            .replace(/\n$/g, '\n\n')
            .replace(`/{text}\b/gi`, '<mark>$&</mark>');
    }

    const handleScroll = event => {
        const scrollTop = textRef.current.scrollTop;
        backdropRef.current.scrollTop = scrollTop;
    };

    const deleteExpression = event => {
        if (window.confirm("Are you sure to delete expression?")) {
            context.deleteExpression(context.currentExpression.id);
            context.getExpression(null);
            context.getExpressions(context.currentLand.id);
        }
    };

    const getReadable = expressionId => {
        const content = context.getReadable(expressionId)
        setContentChanged(true)
        setContent(content);
    };

    const saveReadable = expressionId => {
        context.saveReadable(context.currentExpression.id, textRef.current.value)
        setContentChanged(false)
    }

    const saveKeywords = event => {
        console.log("Save keywords");
    }

    return <section className={"ExpressionExplorer-details" + (context.currentExpression ? " d-block" : "")}>
        <Row>
            <Col md="8">
                <h6 className="App-objtype">Expression</h6>
                <h2>{context.currentExpression.title}</h2>
            </Col>
            <Col md="4" className="d-flex align-items-center justify-content-end">
                <Button size="sm" className="rounded-pill mx-1"
                        onClick={_ => context.getPrevExpression(context.currentExpression.id, context.currentExpression.landId)}>
                    <i className="fas fa-arrow-left"/>
                </Button>
                <Button size="sm" className="rounded-pill mx-1"
                        onClick={_ => context.getNextExpression(context.currentExpression.id, context.currentExpression.landId)}>
                    <i className="fas fa-arrow-right"/>
                </Button>
                <Button size="sm" variant="outline-danger" className="rounded-pill mx-1"
                        onClick={_ => context.getExpression(null)}>
                    <i className="fas fa-times" />
                </Button>
            </Col>
        </Row>

        <p className="lead my-5">{context.currentExpression.description}</p>

        <Container fluid className="p-0">
            <Row>
                <Col md="8">
                    <Form.Group controlId={"expressionForm" + context.currentExpression.id}>
                        <Form.Label>
                            <Button onClick={_ => getReadable(context.currentExpression.id)}>Readabilize
                            </Button>
                            <Button disabled={!contentChanged}
                                    onClick={_ => saveReadable(context.currentExpression.id)}>Save
                            </Button>
                            <Button variant="outline-danger"
                                    onClick={_ => deleteExpression(context.currentExpression.id)}>Delete</Button>
                        </Form.Label>
                        <div className="ExpressionExplorer-highlit">
                            <div ref={backdropRef} className="ExpressionExplorer-highlit-backdrop">
                                <div className="ExpressionExplorer-highlights" ref={highlightsRef}/>
                            </div>
                            <Form.Control as="textarea" className="ExpressionExplorer-readable" ref={textRef} value={content}
                                          onChange={onTextChange} onMouseUp={selectText} onScroll={handleScroll} />
                        </div>
                    </Form.Group>
                </Col>
                <Col md="4">
                    {!textSelection || <div>
                        <span>{textSelection}</span>
                         <span>
                            <Form.Control as="select" />
                        </span>
                    </div>}

                    <div>
                        <Form.Group controlId={"keywords" + context.currentExpression.id}>
                            <Form.Label>Keywords</Form.Label>
                            <Form.Control as="textarea" onBlur={saveKeywords}/>
                        </Form.Group>
                    </div>
                </Col>
            </Row>
        </Container>
    </section>
}

export default Expression;