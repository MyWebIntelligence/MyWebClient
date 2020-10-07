import React, {useContext, useEffect, useState} from 'react'
import {Context} from "../../app/Context"
import SortableTree, {addNodeUnderParent, removeNodeAtPath, changeNodeAtPath} from 'react-sortable-tree'
import TagRenderer from "./TagRenderer"
import './TagExplorer.css'
import {Button, Modal, OverlayTrigger, Tooltip} from "react-bootstrap"
import {SketchPicker} from 'react-color'

function TagExplorer() {

    const context = useContext(Context)
    const defaultColor = '#007bff'
    const [treeData, setTreeData] = useState(context.tags)
    const getNodeKey = ({treeIndex}) => treeIndex
    const newTag = {name: 'New tag', color: defaultColor, children: []}
    const [currentTag, setCurrentTag] = useState(null);
    const [showModal, setShowModal] = useState(false)
    const handleClose = _ => setShowModal(false)

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