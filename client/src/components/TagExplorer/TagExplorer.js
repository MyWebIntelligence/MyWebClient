import React, {useContext, useEffect, useState} from 'react';
import {Context} from "../../app/Context";
import SortableTree, {addNodeUnderParent, removeNodeAtPath, changeNodeAtPath} from 'react-sortable-tree';
import TagRenderer from "./TagRenderer";
import './TagExplorer.css';
import {Button, OverlayTrigger, Tooltip} from "react-bootstrap";

function TagExplorer() {

    const context = useContext(Context)
    const [treeData, setTreeData] = useState(context.tags)
    const getNodeKey = ({treeIndex}) => treeIndex;
    const newTag = {title: "New tag", color: "#ff0000", children: []}

    useEffect(_ => {
        setTreeData(context.tags)
    }, [context.tags])

    return <div>
        <div className="h5 my-3">Tags</div>

        <div className="panel py-2">
            <div className="pt-2">
                <Button onClick={() => context.setTags([...context.tags, newTag])} size="sm" className="mr-2">Add new</Button>
                <Button onClick={_ => context.getAllTaggedContent({landId: context.currentLand.id})} size="sm" className="mr-2">View tagged content</Button>
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
                    generateNodeProps={({node, path}) => ({
                        title: <input
                            value={node.title}
                            onChange={
                                event => {
                                    const title = event.target.value
                                    setTreeData(changeNodeAtPath({
                                        treeData: [...treeData],
                                        path,
                                        getNodeKey,
                                        newNode: {...node, title},
                                    }))
                                }
                            }
                            onBlur={_ => context.setTags(treeData)}
                        />,
                        buttons: [
                            <OverlayTrigger placement="right" overlay={
                                <Tooltip id={`addTag${node.id}`}>{`Add tag in ${node.title}`}</Tooltip>
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
                                <Tooltip id={`removeTag${node.id}`}>{`Remove tag ${node.title}`}</Tooltip>
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
                        ],
                    })}
                />
            </div>
        </div>
    </div>
}

export default TagExplorer;