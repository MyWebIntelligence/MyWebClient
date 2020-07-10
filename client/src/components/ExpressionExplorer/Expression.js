import React, {useCallback, useContext, useEffect, useRef, useState} from "react"
import {Context} from '../../app/Context'
import {Button, ButtonGroup, ButtonToolbar, Badge, Container, Row, Col, Form} from "react-bootstrap"

function Expression() {
    const context = useContext(Context)
    const textRef = useRef()
    const highlightsRef = useRef()
    const backdropRef = useRef()
    const tagRef = useRef()

    const [content, setContent] = useState(context.currentExpression.readable)
    const [contentChanged, setContentChanged] = useState(false)
    const [textSelection, setTextSelection] = useState()
    const [selectionStart, setSelectionStart] = useState()
    const [selectionEnd, setSelectionEnd] = useState()

    useEffect(() => {
        setContent(context.currentExpression.readable)
        setTextSelection(null)
        setSelectionStart(null)
        setSelectionEnd(null)
    }, [context])

    const keyboardControl = useCallback(event => {
        if (!textRef.current.matches(":focus")) {
            switch (event.keyCode) {
                case 27: // ESC Close expression
                    saveBeforeQuit()
                    context.getExpression(null)
                    break
                case 37: // LEFT Previous expression
                    saveBeforeQuit()
                    context.getPrevExpression(context.currentExpression.id, context.currentExpression.landId)
                    break
                case 39: // Right Next expression
                    saveBeforeQuit()
                    context.getNextExpression(context.currentExpression.id, context.currentExpression.landId)
                    break
                case 68: // D Delete expression
                    deleteExpression()
                    break
                case 82: // R Readabilize content
                    getReadable()
                    break
                case 83: // S Save expression
                    saveReadable()
                    break
                default:
                    break
            }
        }
    }, [context.currentExpression, contentChanged])

    useEffect(() => {
        document.addEventListener("keydown", keyboardControl, false)
        return () => {
            document.removeEventListener("keydown", keyboardControl, false)
        }
    }, [context.currentExpression, contentChanged])

    const saveBeforeQuit = _ => {
        if (contentChanged && window.confirm("Would you want to save your changes before quit?")) {
            saveReadable()
        }
    }

    const onTextChange = event => {
        const content = event.target.value
        setContent(content)

        const textChanged = content !== context.currentExpression.readable
        setContentChanged(textChanged)

        highlightsRef.current.innerHTML = applyHighlights(content)
    }

    const selectText = event => {
        const selected = textRef.current.value.substring(event.currentTarget.selectionStart, event.currentTarget.selectionEnd)
        setTextSelection(selected)
        setSelectionStart(event.currentTarget.selectionStart)
        setSelectionEnd(event.currentTarget.selectionEnd)
    }

    /**
     * @todo implement text highlight
     */
    function applyHighlights(text) {
        return text
            .replace(/\n$/g, '\n\n')
            .replace(`/{text}\b/gi`, '<mark>$&</mark>')
    }

    const handleScroll = event => {
        backdropRef.current.scrollTop = textRef.current.scrollTop
    }
    /**
     * End todo
     */

    const deleteExpression = event => {
        if (window.confirm("Are you sure to delete expression?")) {
            const expressionId = context.currentExpression.id
            const landId = context.currentExpression.landId
            context.getNextExpression(expressionId, landId)
            context.deleteExpression(expressionId)
            context.getLand(context.currentLand.id)

            context.getExpressions(context.currentLand.id)
        }
    }

    const deleteTaggedContent = taggedContentId => {
        if (window.confirm("Are your sure to delete this content?")) {
            context.deleteTaggedContent(taggedContentId)
        }
    }

    const getReadable = _ => {
        const currentContent = context.currentExpression.readable
        const content = context.getReadable(context.currentExpression.id)
        const hasChanged = currentContent !== content
        setContentChanged(hasChanged)
        if (hasChanged) {
            setContent(content)
        }
    }

    const saveReadable = _ => {
        context.saveReadable(context.currentExpression.id, textRef.current.value)
        setContentChanged(false)
    }

    const reloadExpression = _ => {
        context.getExpression(context.currentExpression.id)
        setContentChanged(false)
    }

    const flatTags = (tags, depth) => {
        let out = []
        tags.forEach(tag => {
            tag.depth = depth
            out.push(tag)
            out = out.concat(flatTags(tag.children, depth + 1))
        })
        return out
    }

    const categorizeTaggedContent = _ => {
        let data = []
        flatTags(context.tags).forEach(tag => {
            let tagContent = {name: tag.title, contents: []}
            context.taggedContent.forEach(content => {
                if (content.tag_id === tag.id) {
                    tagContent.contents.push(content)
                }
            })
            if (tagContent.contents.length > 0) {
                data.push(tagContent)
            }
        })
        console.log(data)
        return data
    }

    return <section className={"ExpressionExplorer-details" + (context.currentExpression ? " d-block" : "")}>
        <Row>
            <Col md="8">
                <h6 className="App-objtype">Expression</h6>
                <div className="my-2">
                    <h5 className="m-0">
                        <span className="App-link"
                              onClick={_ => context.getDomain(context.currentExpression.domainId)}>{context.currentExpression.domainName}</span>
                    </h5>
                    <h2 className="m-0">{context.currentExpression.title}</h2>
                    <p><small><a href={context.currentExpression.url} target="_blank" rel="noopener noreferrer">{context.currentExpression.url}</a></small></p>
                </div>
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
                    <i className="fas fa-times"/>
                </Button>
            </Col>
        </Row>

        <p className="lead my-4">{context.currentExpression.description}</p>

        <Container fluid className="p-0">
            <Row>
                <Col md="8">
                    <Form.Group controlId={"expressionForm" + context.currentExpression.id}>
                        <div className="ExpressionExplorer-highlit">
                            <div ref={backdropRef} className="ExpressionExplorer-highlit-backdrop">
                                <div className="ExpressionExplorer-highlights" ref={highlightsRef}/>
                            </div>
                            <Form.Control as="textarea" className="ExpressionExplorer-readable" ref={textRef}
                                          value={content}
                                          onChange={onTextChange} onMouseUp={selectText} onScroll={handleScroll}/>
                        </div>
                        <div className="my-3">
                            <ButtonToolbar>
                                <ButtonGroup className="mr-2">
                                    <Button
                                        onClick={getReadable}><u>R</u>eadabilize</Button>
                                </ButtonGroup>
                                <ButtonGroup className="mr-2">
                                    <Button disabled={!contentChanged}
                                            onClick={saveReadable}><u>S</u>ave</Button>
                                    <Button disabled={!contentChanged}
                                            onClick={reloadExpression}>Reload</Button>
                                </ButtonGroup>
                                <ButtonGroup>
                                    <Button variant="outline-danger"
                                            onClick={_ => deleteExpression(context.currentExpression.id)}><u>D</u>elete</Button>
                                </ButtonGroup>
                            </ButtonToolbar>
                        </div>
                    </Form.Group>
                </Col>
                <Col md="4">
                    <h5>Id <Badge pill variant="secondary">{context.currentExpression.id}</Badge></h5>
                    <h5>Relevance <Badge pill variant="secondary">{context.currentExpression.relevance}</Badge></h5>
                    <h5>Depth <Badge pill variant="secondary">{context.currentExpression.depth}</Badge></h5>

                    <hr/>

                    <h5>Content tagging</h5>

                    {!textSelection && <div>
                        {context.tags.length > 0 &&
                        <p className="my-3 alert alert-warning">Select text in expression content.</p>}
                        {context.tags.length === 0 &&
                        <p className="my-3 alert alert-warning">You have to create tags before tagging content.</p>}
                    </div>}

                    {!textSelection || <div className="alert alert-success">
                            <h6>Select tag</h6>
                            <p className="App-text-excerpt my-2">{textSelection}</p>
                            <Form>
                                <div className="input-group">
                                    <Form.Control as="select" ref={tagRef}>
                                        {flatTags(context.tags, 0).map((tag, i) => <option
                                            key={i}
                                            value={tag.id}>{String.fromCharCode(160).repeat(tag.depth)} {tag.title}</option>)}
                                    </Form.Control>
                                    <div className="input-group-append">
                                        <Button onClick={_ => {
                                            context.tagContent(
                                                tagRef.current.value,
                                                context.currentExpression.id,
                                                textSelection,
                                                selectionStart,
                                                selectionEnd)
                                        }}>Save</Button>
                                    </div>
                                </div>
                            </Form>
                        </div>}

                    {context.taggedContent.length === 0 &&
                    <p className="alert alert-warning">No content tagged yet.</p>}
                    {context.taggedContent.length > 0 && <div>
                        <h5>Tagged content</h5>
                        <div className="panel taggedContentExplorer py-2 my-3">
                            <ul>
                                {categorizeTaggedContent().map((tag, i) => <li key={i}>
                                    <h6>{tag.name}</h6>
                                    <ul>
                                        {tag.contents.map((content, j) => <li key={j}>
                                            <i className="fas fa-times text-danger float-right" onClick={_ => deleteTaggedContent(content.id)}/>
                                            <p className="App-text-excerpt">{content.text}</p>
                                        </li>)}
                                    </ul>
                                </li>)}
                            </ul>
                        </div>
                    </div>}
                </Col>
            </Row>
        </Container>
    </section>
}

export default Expression