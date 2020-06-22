import React, {useContext, useEffect, useRef, useState} from "react";
import {Context} from '../../app/Context';
import {Button, ButtonGroup, ButtonToolbar, Badge, Container, Row, Col, Form} from "react-bootstrap";

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
        //setContentChanged(false);
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
        backdropRef.current.scrollTop = textRef.current.scrollTop;
    };

    const deleteExpression = event => {
        if (window.confirm("Are you sure to delete expression?")) {
            context.deleteExpression(context.currentExpression.id);
            context.getExpression(null);
            context.getLand(context.currentLand.id);
            context.getExpressions(context.currentLand.id);
        }
    };

    const getReadable = expressionId => {
        const currentContent = context.currentExpression.readable
        const content = context.getReadable(expressionId)
        const hasChanged = currentContent !== content
        setContentChanged(hasChanged)
        if (hasChanged) {
            setContent(content)
        }
    };

    const saveReadable = expressionId => {
        context.saveReadable(context.currentExpression.id, textRef.current.value)
        setContentChanged(false)
    }

    const reloadExpression = expressionId => {
        context.getExpression(expressionId);
    }

    const flatTags = (tags, depth) => {
        let out = []
        tags.forEach(tag => {
            tag.depth = depth
            out.push(tag)
            out = out.concat(flatTags(tag.children, depth+1));
        })
        return out;
    }

    return <section className={"ExpressionExplorer-details" + (context.currentExpression ? " d-block" : "")}>
        <Row>
            <Col md="8">
                <h6 className="App-objtype">Expression</h6>
                <h2>{context.currentExpression.title} <a href={context.currentExpression.url} target="_blank" rel="noopener noreferrer"><i className="fas fa-external-link-alt"/></a></h2>
                <h5>
                    <span className="App-link" onClick={_ => context.getDomain(context.currentExpression.domainId)}>{context.currentExpression.domainName}</span>
                </h5>
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
                        <div className="ExpressionExplorer-highlit">
                            <div ref={backdropRef} className="ExpressionExplorer-highlit-backdrop">
                                <div className="ExpressionExplorer-highlights" ref={highlightsRef}/>
                            </div>
                            <Form.Control as="textarea" className="ExpressionExplorer-readable" ref={textRef} value={content}
                                          onChange={onTextChange} onMouseUp={selectText} onScroll={handleScroll} />
                        </div>
                        <div className="my-3">
                            <ButtonToolbar>
                                <ButtonGroup className="mr-2">
                                    <Button onClick={_ => getReadable(context.currentExpression.id)}>Readabilize</Button>
                                </ButtonGroup>
                                <ButtonGroup className="mr-2">
                                    <Button disabled={!contentChanged} onClick={_ => saveReadable(context.currentExpression.id)}>Save</Button>
                                    <Button disabled={!contentChanged} onClick={_ => reloadExpression(context.currentExpression.id)}>Reload</Button>
                                </ButtonGroup>
                                <ButtonGroup>
                                    <Button variant="outline-danger" onClick={_ => deleteExpression(context.currentExpression.id)}>Delete</Button>
                                </ButtonGroup>
                            </ButtonToolbar>
                        </div>
                    </Form.Group>
                </Col>
                <Col md="4">
                    <h5>Relevance <Badge pill variant="primary">{context.currentExpression.relevance}</Badge></h5>
                    <h5>Depth <Badge pill variant="primary">{context.currentExpression.depth}</Badge></h5>

                    <hr/>

                    <h5>Content tagging</h5>

                    {!textSelection && <div>
                        {context.tags.length > 0 && <p>Select text in expression content.</p>}
                        {context.tags.length === 0 && <p className="text-warning">You have to create tags before tagging content.</p>}
                    </div>}

                    {!textSelection || <div>
                        <Form.Control as="select">
                            {flatTags(context.tags, 0).map((tag, i) => <option key={i}>{String.fromCharCode(160).repeat(tag.depth)} {tag.title}</option>)}
                        </Form.Control>
                        <p className="my-2">{textSelection}</p>
                    </div>}
                </Col>
            </Row>
        </Container>
    </section>
}

export default Expression;