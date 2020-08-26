import React, {useCallback, useContext, useEffect, useRef, useState} from 'react'
import {Context} from '../../app/Context'
import {Button, Col, Row, Modal, Form} from "react-bootstrap"

function TaggedContent({tags, forLand = false}) {
    const context = useContext(Context)
    const tagRef = useRef()
    const [showModal, setShowModal] = useState(false)
    const [currentTag, setCurrentTag] = useState({tagId: null, contentId: null, content: null})

    const handleClose = _ => setShowModal(false);
    const handleShow = _ => setShowModal(true);

    const keyboardControl = useCallback(event => {
        switch (event.keyCode) {
            case 27: // ESC Close expression
                context.getAllTaggedContent(null)
                break
            default:
                break
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        document.addEventListener("keydown", keyboardControl, false)
        return () => {
            document.removeEventListener("keydown", keyboardControl, false)
        }
    }, [keyboardControl])

    const deleteTaggedContent = taggedContentId => {
        if (window.confirm("Are your sure to delete this content?")) {
            context.deleteTaggedContent(taggedContentId, forLand)
        }
    }

    return (
        <section className="taggedContent" style={{display: tags !== null ? 'block' : 'none'}}>
            {forLand === true && <Row>
                <Col md="8">
                    {forLand === true && <div>
                        <h6 className="App-objtype">Tags</h6>
                        <h2>Tagged content</h2>
                    </div>}
                </Col>
                <Col md="4" className="d-flex align-items-start justify-content-end">
                    <Button size="sm" variant="outline-danger" className="rounded-pill mx-1"
                            onClick={_ => context.getAllTaggedContent(null)}>
                        <i className="fas fa-times"/>
                    </Button>
                </Col>
            </Row>}

            {tags.length === 0 &&
            <p className="alert alert-warning">No content tagged yet.</p>}
            {tags.length > 0 && <div>
                {forLand === false && <h5>Tagged content</h5>}
                <div className="panel py-2 my-3">
                    <ul>
                        {context.categorizeTaggedContent(tags).map((tag, i) => <li key={i}>
                            <h6 className="App-objtype">{tag.name}</h6>
                            <ul>
                                {tag.contents.map((content, j) => <li key={j}>
                                    {console.log(content)}
                                    <i className="fas fa-trash text-danger float-right mx-1"
                                       onClick={_ => deleteTaggedContent(content.id)}/>
                                    <i className="fas fa-edit text-primary float-right mx-1"
                                       onClick={_ => {
                                           setCurrentTag({tagId: tag.id, contentId: content.id, content: content.text})
                                           handleShow()
                                       }}/>
                                    <p className={(forLand === false ? "App-text-excerpt " : "") + "mb-1"}>{content.text}</p>
                                </li>)}
                            </ul>
                        </li>)}
                    </ul>
                </div>
            </div>}

            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Move content</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {console.log(currentTag)}
                    <p>{currentTag.content}</p>
                    <Form.Control as="select" ref={tagRef} defaultValue={currentTag.tagId}>
                        {context.flatTags(context.tags, 0).map((tag, i) => <option
                            key={i}
                            value={tag.id}>{String.fromCharCode(160).repeat(tag.depth)} {tag.title}</option>)}
                    </Form.Control>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>Close</Button>
                    <Button variant="primary"
                            onClick={_ => {
                                context.moveTag(currentTag.contentId, parseInt(tagRef.current.value), forLand)
                                setShowModal(false)
                            }}>Save
                        changes</Button>
                </Modal.Footer>
            </Modal>
        </section>
    )
}

export default TaggedContent