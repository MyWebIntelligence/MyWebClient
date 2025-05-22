import React, {useCallback, useContext, useEffect, useRef, useState} from "react"
import {Context} from '../../app/Context'
import {Badge, Button, ButtonGroup, ButtonToolbar, Carousel, Col, Container, Form, Row} from "react-bootstrap"
import TaggedContent from "../TagExplorer/TaggedContent"
import * as marked from 'marked'

function Expression(props) {
    const context = useContext(Context)
    const textRef = useRef()
    const tagRef = useRef()

    const [content, setContent] = useState(context.currentExpression.readable)
    const [contentChanged, setContentChanged] = useState(false)
    const [textSelection, setTextSelection] = useState()
    const [selectionStart, setSelectionStart] = useState()
    const [selectionEnd, setSelectionEnd] = useState()
    const [editMode, setEditMode] = useState(false)

    useEffect(() => {
        setContent(context.currentExpression.readable)
        setTextSelection(null)
        setSelectionStart(null)
        setSelectionEnd(null)
    }, [context])

    const keyboardControl = useCallback(event => {
        if (context.notFocused()) {
            switch (event.keyCode) {
                case 27: // ESC Close expression
                    saveBeforeQuit()
                    context.getExpression(null)
                    break
                case 37: // ← Previous expression
                    saveBeforeQuit()
                    context.getPrevExpression(context.currentExpression.id, context.currentExpression.landId)
                    break
                case 39: // → Next expression
                    saveBeforeQuit()
                    context.getNextExpression(context.currentExpression.id, context.currentExpression.landId)
                    break
                case 69: // E Edit readable
                    setEditMode(!editMode)
                    break
                case 68: // D Delete expression
                    deleteExpression()
                    break
                case 82: // R Readabilize content
                    getReadable()
                    break
                case 83: // S Save expression
                    if (contentChanged) {
                        saveReadable()
                    }
                    break
                default:
                    break
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context.currentExpression, contentChanged])

    useEffect(() => {
        document.addEventListener("keydown", keyboardControl, false)
        return () => {
            document.removeEventListener("keydown", keyboardControl, false)
        }
    }, [keyboardControl])

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
    }

    const selectText = event => {
        const selected = textRef.current.value.substring(event.currentTarget.selectionStart, event.currentTarget.selectionEnd)
        setTextSelection(selected)
        setSelectionStart(event.currentTarget.selectionStart)
        setSelectionEnd(event.currentTarget.selectionEnd)
    }

    const deleteExpression = _ => {
        if (window.confirm("Are you sure to delete expression?")) {
            const expressionId = context.currentExpression.id
            const landId = context.currentExpression.landId
            context.getNextExpression(expressionId, landId)
            context.deleteExpression(expressionId)
            context.getLand(context.currentLand.id)
            context.getExpressions(context.currentLand.id)
        }
    }

    const getReadable = _ => {
        const currentContent = context.currentExpression.readable
        const content = context.getReadable(context.currentExpression.id)
        const hasChanged = currentContent !== content
        setContentChanged(hasChanged)

        if (content && hasChanged) {
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

    const deleteMedia = (event, image) => {
        context.deleteMedia(image)
        reloadExpression()
    }

    return <section className={"ExpressionExplorer-details" + (context.currentExpression ? " d-block" : "")} style={props.style}>
        <Row>
            <Col md="8">
                <h6 className="App-objtype">Expression</h6>
                <div className="my-2">
                    <h5 className="m-0">
                        <span className="App-link"
                              onClick={_ => context.getDomain(context.currentExpression.domainId)}>{context.currentExpression.domainName}</span>
                    </h5>
                    <h2 className="m-0">{context.currentExpression.title}</h2>
                    <p>
                        <small>
                            <a href={context.currentExpression.url} target="_blank"
                               rel="noopener noreferrer">{context.currentExpression.url}</a>
                            &nbsp;
                            <i className="fas fa-external-link-alt text-primary"/>
                        </small>
                    </p>
                </div>
            </Col>
            <Col md="4" className="d-flex align-items-start justify-content-end">
                <Button size="sm" className="rounded-pill mx-1"
                        onClick={_ => context.getPrevExpression(context.currentExpression.id, context.currentExpression.landId)}>
                    <i className="fas fa-arrow-left"/>
                </Button>
                <Button size="sm" className="rounded-pill mx-1"
                        onClick={_ => context.getNextExpression(context.currentExpression.id, context.currentExpression.landId)}>
                    <i className="fas fa-arrow-right"/>
                </Button>
                <Button size="sm" className="rounded-pill mx-1"
                        onClick={_ => context.getExpression(null)}>
                    <i className="fas fa-times"/>
                </Button>
            </Col>
        </Row>

        <Row>
            <Col md="8">
                <p className="lead my-4">{context.currentExpression.description}</p>
            </Col>
        </Row>

        <Container fluid className="p-0">
            <Row>
                <Col md="8">
                    <Form.Group controlId={"expressionForm" + context.currentExpression.id}>
                        <div className="ExpressionExplorer-content">
                            {editMode
                                ? <Form.Control as="textarea"
                                                ref={textRef}
                                                value={content}
                                                className="ExpressionExplorer-content-editable"
                                                onChange={onTextChange}
                                                onMouseUp={selectText}/>
                                : <div dangerouslySetInnerHTML={{__html: marked.parse(content)}}
                                       className="ExpressionExplorer-content-readable form-control"/>
                            }
                        </div>
                        <div className="my-3">
                            <ButtonToolbar>
                                <ButtonGroup className="mr-2">
                                    <Button onClick={_ => setEditMode(!editMode)} variant={editMode ? 'success' : 'primary'}>{editMode ? 'E' : <u>E</u>}dit</Button>
                                </ButtonGroup>
                                <ButtonGroup className="mr-2">
                                    <Button onClick={getReadable}
                                            disabled={!editMode}><u>R</u>eadabilize</Button>
                                </ButtonGroup>
                                <ButtonGroup className="mr-2">
                                    <Button onClick={saveReadable}
                                            disabled={!(editMode && contentChanged)}><u>S</u>ave</Button>
                                    <Button onClick={reloadExpression}
                                            disabled={!(editMode && contentChanged)}>Reload</Button>
                                </ButtonGroup>
                                <ButtonGroup>
                                    <Button variant="outline-danger"
                                            onClick={_ => deleteExpression(context.currentExpression.id)}
                                            disabled={!editMode}><u>D</u>elete</Button>
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

                    <h5>Media</h5>

                    {context.currentExpression.images !== null && <div className="panel py-3 bg-light">
                        <Carousel keyboard={false} interval={null}>
                            {context.currentExpression.images.split(',').map((image, index) => <Carousel.Item key={index}>
                                <img src={image} alt=""/>
                                <Carousel.Caption>
                                    <i className="fas fa-trash text-danger"
                                       onClick={event => deleteMedia(event, image)}/>
                                </Carousel.Caption>
                            </Carousel.Item>)}
                        </Carousel>
                    </div>}
                    {context.currentExpression.images === null && <p className="text-muted">No media related to this expression</p>}

                    <hr/>

                    <h5>Content tagging</h5>

                    {context.tags.length === 0
                        ? <p className="my-3 alert alert-warning">You have to create tags before tagging content.</p>
                        : <>{!textSelection && <p className="my-3 alert alert-warning">Select text in expression content.</p>}</>
                    }
                    {!textSelection || <div className="alert alert-success">
                        <h6>Select tag</h6>
                        <p className="App-text-excerpt my-2">{textSelection}</p>
                        <Form>
                            <div className="input-group">
                                <Form.Control as="select" ref={tagRef}>
                                    {context.flatTags(context.tags, 0).map((tag, i) => <option
                                        key={i}
                                        value={tag.id}>{String.fromCharCode(160).repeat(tag.depth)} {tag.name}</option>)}
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

                    {!editMode && <p>Start tagging content in <Button onClick={_ => setEditMode(!editMode)} size="sm">Edit mode</Button></p>}

                    <TaggedContent tags={context.taggedContent}/>
                </Col>
            </Row>
        </Container>
    </section>
}

export default Expression
