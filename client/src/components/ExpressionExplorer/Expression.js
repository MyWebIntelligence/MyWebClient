import React, {useCallback, useContext, useEffect, useRef, useState} from "react"
import {Context} from '../../app/Context'
import {Badge, Button, ButtonGroup, ButtonToolbar, Carousel, Col, Container, Form, Row} from "react-bootstrap"
import TaggedContent from "../TagExplorer/TaggedContent"
import * as marked from 'marked'
import './MarkdownEditor.css' // Import the new CSS

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

    // Ajout : état pour la position du bloc de tagging
    const [taggingPosition, setTaggingPosition] = useState(null);

    // Version onMouseUp uniquement (retour à l'ancien comportement)
    const selectText = event => {
        let selectedText = '';
        let start = 0;
        let end = 0;
        let pos = null;

        if (editMode && textRef.current && typeof textRef.current.value === 'string') {
            // Sélection dans le textarea (édition)
            selectedText = textRef.current.value.substring(event.currentTarget.selectionStart, event.currentTarget.selectionEnd);
            start = event.currentTarget.selectionStart;
            end = event.currentTarget.selectionEnd;
            if (selectedText.length > 0 && textRef.current) {
                const rect = textRef.current.getBoundingClientRect();
                pos = { top: rect.top + window.scrollY + 40, left: rect.left + window.scrollX + rect.width - 250 };
            }
        } else if (!editMode && window.getSelection) {
            // Sélection dans le markdown (lecture)
            const selection = window.getSelection();
            selectedText = selection.toString();
            if (selectedText.length > 0) {
                const originalContent = content;
                const foundIndex = originalContent.indexOf(selectedText);
                if (foundIndex !== -1) {
                    start = foundIndex;
                    end = foundIndex + selectedText.length;
                } else {
                    start = 0;
                    end = 0;
                }
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    let rect = null;
                    if (range.getClientRects && range.getClientRects().length > 0) {
                        rect = range.getClientRects()[0];
                    } else {
                        rect = range.getBoundingClientRect();
                    }
                    pos = { 
                        top: rect.top + window.scrollY - 48,
                        left: rect.left + window.scrollX
                    };
                }
            } else {
                start = 0;
                end = 0;
                pos = null;
            }
        }

        setTextSelection(selectedText);
        setSelectionStart(start);
        setSelectionEnd(end);
        setTaggingPosition(pos);
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
        <div style={{ display: 'flex', height: '100%', gap: '16px', boxSizing: 'border-box' }}>
            {/* Colonne centrale : 2/3 de la largeur de la section principale */}
            <div style={{ flex: '0 0 66%', boxSizing: 'border-box', minWidth: 0 }}>
                <Row>
                    <Col>
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
                    <Col className="d-flex align-items-start justify-content-end" style={{ flex: '0 0 auto' }}>
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
                    <Col>
                        <p className="lead my-4">{context.currentExpression.description}</p>
                    </Col>
                </Row>
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
                                className="markdown-editor-content"
                                onMouseUp={selectText}
                                ref={textRef}
                            />
                        }
                    </div>
                </Form.Group>
            </div>
            {/* Colonne droite : 1/3 de la largeur de la section principale */}
            <div style={{ flex: '0 0 34%', boxSizing: 'border-box', minWidth: 0, paddingLeft: '8px' }}>
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
                {/* Bloc de tagging flottant */}
                {textSelection && taggingPosition &&
                    <div
                        style={{
                            position: 'fixed',
                            top: taggingPosition.top,
                            left: taggingPosition.left,
                            zIndex: 9999,
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                            padding: 16,
                            minWidth: 260,
                            maxWidth: 320
                        }}
                    >
                        <h5>Content tagging</h5>
                        {context.tags.length === 0
                            ? <p className="my-3 alert alert-warning">You have to create tags before tagging content.</p>
                            : <div className="alert alert-success">
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
                            </div>
                        }
                    </div>
                }
                {/* Bloc TaggedContent permanent à droite */}
                <TaggedContent tags={context.taggedContent}/>
            </div>
        </div>
    </section>
}

export default Expression
