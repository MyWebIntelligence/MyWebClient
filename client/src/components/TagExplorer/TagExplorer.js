// Fichier: client/src/components/TagExplorer/TagExplorer.js
// Description: Composant React pour afficher et gérer une hiérarchie de tags.
// Utilise la bibliothèque `react-sortable-tree` pour permettre le tri, l'ajout,
// la suppression et la modification des tags (nom, couleur).
// Interagit avec le Contexte (ConfigContext) pour persister les changements de tags
// et pour récupérer les tags associés au "land" courant.

import React, {useContext, useEffect, useState} from 'react'
import {Context} from "../../app/Context"
import SortableTree, {addNodeUnderParent, removeNodeAtPath, changeNodeAtPath} from 'react-sortable-tree'
import TagRenderer from "./TagRenderer"
import './TagExplorer.css'
import {Button, Modal, OverlayTrigger, Tooltip} from "react-bootstrap"
import {SketchPicker} from 'react-color'

/**
 * Composant TagExplorer.
 * Affiche une arborescence de tags éditable (ajout, suppression, renommage, changement de couleur).
 * Permet également de visualiser tout le contenu taggué pour le "land" courant.
 * Utilise `react-sortable-tree` pour l'affichage et la manipulation de l'arbre.
 */
function TagExplorer() {

    const context = useContext(Context)
    const defaultColor = '#007bff' // Couleur par défaut pour les nouveaux tags
    const [treeData, setTreeData] = useState(context.tags) // État local pour les données de l'arbre
    const getNodeKey = ({treeIndex}) => treeIndex // Fonction pour obtenir la clé d'un nœud
    const newTag = {name: 'New tag', color: defaultColor, children: []} // Modèle pour un nouveau tag
    const [currentTag, setCurrentTag] = useState(null); // Tag actuellement sélectionné pour le changement de couleur
    const [showModal, setShowModal] = useState(false) // État pour afficher/cacher la modale de sélection de couleur

    /**
     * Gère la fermeture de la modale de sélection de couleur.
     */
    const handleClose = _ => setShowModal(false)

    // Met à jour l'état local `treeData` lorsque les tags du contexte changent.
    useEffect(() => {
        setTreeData(context.tags)
    }, [context.tags])

    return <div>
        <div className="h5 my-3">Tags</div>

        <div className="panel py-2">
            <div className="pt-2">
                <Button onClick={() => context.setTags([...context.tags, newTag])} size="sm" className="mr-2">Add
                    new</Button>
                <Button onClick={_ => {
                    context.getAllTaggedContent({landId: context.currentLand.id})
                }} size="sm"
                        className="mr-2">View tagged content</Button>
            </div>

            <hr/>

            <div className="TagExplorer-tagTree">
                <SortableTree
                    treeData={treeData}
                    onChange={tags => {
                        context.setTags(tags)
                    }}
                    scaffoldBlockPxWidth={26}
                    rowHeight={36}
                    //treeNodeRenderer={TreeRenderer}
                    nodeContentRenderer={TagRenderer}
                    generateNodeProps={({node: tag, path}) => ({
                        title: <input
                            value={tag.name}
                            onChange={
                                event => {
                                    const name = event.target.value
                                    setTreeData(changeNodeAtPath({
                                        treeData: [...treeData],
                                        path,
                                        getNodeKey,
                                        newNode: {...tag, name},
                                    }))
                                }
                            }
                            onBlur={_ => context.setTags(treeData)}
                        />,
                        buttons: [
                            <OverlayTrigger placement="right" overlay={
                                <Tooltip id={`addTag${tag.id}`}>{`Add tag in ${tag.name}`}</Tooltip>
                            }>
                                <button className="TagExplorer-nodeControl"
                                        onClick={() =>
                                            context.setTags(addNodeUnderParent({
                                                    treeData: treeData,
                                                    parentKey: path[path.length - 1],
                                                    expandParent: true,
                                                    getNodeKey,
                                                    newNode: newTag
                                                }).treeData
                                            )
                                        }>
                                    <i className="fas fa-plus-circle"/>
                                </button>
                            </OverlayTrigger>,

                            <OverlayTrigger placement="right" overlay={
                                <Tooltip id={`removeTag${tag.id}`}>{`Remove tag ${tag.name}`}</Tooltip>
                            }>
                                <button className="TagExplorer-nodeControl"
                                        onClick={() => {
                                            if (window.confirm("Are you sure to delete this tag?")) {
                                                context.setTags(removeNodeAtPath({
                                                    treeData: treeData,
                                                    path,
                                                    getNodeKey,
                                                }))
                                            }
                                        }}>
                                    <i className="fas fa-minus-circle"/>
                                </button>
                            </OverlayTrigger>,

                            <button className="TagExplorer-nodeControl" onClick={_ => {
                                setCurrentTag(tag);
                                setShowModal(true)
                            }}>
                                <i className="fas fa-tint" style={{color: tag.color}}/>
                            </button>
                        ],
                    })}
                />
            </div>
        </div>

        <Modal show={showModal} onHide={handleClose} size="sm">
            <Modal.Header closeButton>
                <Modal.Title>Set tag color</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className="d-flex justify-content-center">
                    <SketchPicker color={currentTag !== null ? currentTag.color : defaultColor}
                                  onChange={(color) => currentTag.color = color.hex}
                                  onChangeComplete={() => context.updateTag(currentTag)}/>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    </div>
}

export default TagExplorer
