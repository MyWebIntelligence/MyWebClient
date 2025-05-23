// Fichier: client/src/components/TagExplorer/TaggedContent.js
// Description: Composant React pour afficher et gérer le contenu qui a été tagué.
// Peut afficher le contenu taggué pour une expression spécifique ou pour un "land" entier.
// Permet de filtrer par tag, d'éditer le texte ou le tag d'un contenu taggué,
// et de supprimer des instances de taggage.

import React, {useCallback, useContext, useEffect, useRef, useState} from 'react'
import {Context} from '../../app/Context'
import {Button, Col, Row, Modal, Form, InputGroup} from "react-bootstrap"

/**
 * Composant TaggedContent.
 * Affiche une liste de segments de texte qui ont été tagués.
 * Permet de filtrer ces segments par tag, de les éditer (texte et tag associé)
 * ou de les supprimer.
 * @param {object} props - Les propriétés du composant.
 * @param {Array} props.tags - La liste des contenus tagués à afficher.
 * @param {boolean} [props.forLand=false] - Indique si le contenu affiché est pour un "land" entier (true) ou une expression spécifique (false).
 */
function TaggedContent({tags, forLand = false}) {
    const context = useContext(Context)
    const tagRef = useRef() // Référence pour le select de tag dans la modale d'édition
    const contentRef = useRef() // Référence pour le textarea de contenu dans la modale d'édition
    const [showModal, setShowModal] = useState(false) // État pour afficher/cacher la modale d'édition
    const [currentTag, setCurrentTag] = useState({tagId: null, contentId: null, content: null}) // Contenu taggué en cours d'édition

    /**
     * Gère la fermeture de la modale d'édition du contenu taggué.
     */
    const handleClose = _ => setShowModal(false)
    /**
     * Gère l'ouverture de la modale d'édition du contenu taggué.
     */
    const handleShow = _ => setShowModal(true)

    /**
     * Gère les raccourcis clavier pour la vue du contenu taggué.
     * ESC: Ferme la vue du contenu taggué (si `forLand` est vrai) et réinitialise le filtre de tag.
     * @param {KeyboardEvent} event - L'événement clavier.
     */
    const keyboardControl = useCallback(event => {
        switch (event.keyCode) {
            case 27: // ESC Close
                context.getAllTaggedContent(null)
                context.setTagFilter(null)
                break
            default:
                break
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [context]) // Ajout de context comme dépendance

    useEffect(() => {
        document.addEventListener("keydown", keyboardControl, false)
        return () => {
            document.removeEventListener("keydown", keyboardControl, false)
        }
    }, [keyboardControl])

    /**
     * Gère la suppression d'une instance de contenu taggué.
     * Demande confirmation à l'utilisateur avant d'appeler la fonction de suppression du contexte.
     * @param {number} taggedContentId - L'ID du contenu taggué à supprimer.
     */
    const deleteTaggedContent = taggedContentId => {
        if (window.confirm("Are your sure to delete this content?")) {
            context.deleteTaggedContent(taggedContentId, forLand)
        }
    }

    /**
     * Applique un filtre par tag sur le contenu taggué affiché.
     * Met à jour le filtre de tag dans le contexte et recharge le contenu taggué
     * (soit pour le "land" entier, soit pour l'expression courante) avec le nouveau filtre.
     * @param {string|null} tagId - L'ID du tag par lequel filtrer, ou null pour aucun filtre.
     */
    const getFiltered = tagId => {
        context.setTagFilter(tagId)

        let params = {}
        if (tagId !== null) {
            params.tagId = tagId
        }
        if (forLand === true) {
            context.getAllTaggedContent({landId: context.currentLand.id, ...params})
        } else {
            context.getTaggedContent({expressionId: context.currentExpression.id, ...params})
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
                    <Button size="sm" className="rounded-pill mx-1"
                            onClick={_ => context.getAllTaggedContent(null)}>
                        <i className="fas fa-times"/>
                    </Button>
                </Col>
            </Row>}

            {/* Subtitle in sidebar */}
            {forLand === false && <h5>Tagged content</h5>}

            <InputGroup className="my-3">
                <InputGroup.Prepend>
                    <InputGroup.Text><i className="fas fa-filter"/></InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control as="select" onChange={e => getFiltered(e.target.value || null)}>
                    <option value=''>All tags</option>
                    {context.flatTags(context.tags, 0).map((tag, i) => <option
                        key={i}
                        value={tag.id}>{String.fromCharCode(160).repeat(tag.depth)} {tag.name}</option>)}
                </Form.Control>
            </InputGroup>

            {tags.length === 0 &&
            <p className="alert alert-warning">No content tagged yet.</p>}
            {tags.length > 0 && <div>
                <div className="panel py-2 my-3">
                    <ul>
                        {context.categorizeTaggedContent(tags).map((tag, i) => <li key={i}>
                            <h6 className="tagLabel" style={{color: tag.color}}>{tag.path}</h6>
                            <ul>
                                {tag.contents.map((content, j) => <li key={j}>
                                    <i className="fas fa-trash text-danger float-right ml-1"
                                       onClick={_ => deleteTaggedContent(content.id)}/>

                                    <i className="fas fa-edit text-primary float-right ml-1"
                                       onClick={_ => {
                                           setCurrentTag({tagId: tag.id, contentId: content.id, content: content.text})
                                           handleShow()
                                       }}/>

                                    {forLand === true &&
                                    <i className="fas fa-link float-right ml-1 text-primary" onClick={_ => {
                                        context.getExpression(content.expression_id)
                                    }}/>}

                                    <p className={(forLand === false ? "App-text-excerpt " : "") + "mb-1"}>{content.text}</p>
                                </li>)}
                            </ul>
                        </li>)}
                    </ul>
                </div>
            </div>}

            <Modal show={showModal} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit tag content</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form.Control as="textarea" ref={contentRef} rows="10" className="mb-3"
                                  defaultValue={currentTag.content}/>
                    <Form.Control as="select" ref={tagRef} defaultValue={currentTag.tagId}>
                        {context.flatTags(context.tags, 0).map((tag, i) => <option
                            key={i}
                            value={tag.id}>{String.fromCharCode(160).repeat(tag.depth)} {tag.name}</option>)}
                    </Form.Control>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>Close</Button>
                    <Button variant="primary"
                            onClick={_ => {
                                context.updateTagContent(currentTag.contentId, parseInt(tagRef.current.value), contentRef.current.value, forLand)
                                setShowModal(false)
                            }}>Save
                        changes</Button>
                </Modal.Footer>
            </Modal>
        </section>
    )
}

export default TaggedContent
