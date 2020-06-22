import React, { useContext } from 'react';
import {Context} from "../../app/Context";
import SortableTree, { addNodeUnderParent, removeNodeAtPath, changeNodeAtPath } from 'react-sortable-tree';
import TreeRenderer from "./TreeRenderer";
import TagRenderer from "./TagRenderer";
import './TagExplorer.css';
import {Button, OverlayTrigger, Tooltip} from "react-bootstrap";
import { delay } from "../../app/Util";

function TagExplorer() {
    const context = useContext(Context)

    const getNodeKey = ({ treeIndex }) => treeIndex;

    const newTag = {title: "New tag", color: "#ff0000", children: []}

    return <div>
         <div className="h5 my-3">Tags <Button onClick={() => context.setTags([...context.tags, newTag])} size="sm">Add new...</Button></div>

        <div className="TagExplorer-tagTree panel">
            <SortableTree
                treeData={context.tags}
                onChange={tags => context.setTags(tags)}
                scaffoldBlockPxWidth={26}
                rowHeight={42}
                //treeNodeRenderer={TreeRenderer}
                nodeContentRenderer={TagRenderer}
                generateNodeProps={({ node, path }) => ({
                    title: <input
                        value={node.title}
                        onChange={event => {
                            const title = event.target.value;
                            context.setTags(changeNodeAtPath({
                                    treeData: context.tags,
                                    path,
                                    getNodeKey,
                                    newNode: {...node, title},
                                }),
                            );
                        }}
                    />,
                    buttons: [
                        <OverlayTrigger placement="right" overlay={
                            <Tooltip id={`addTag${node.id}`}>{`Add tag in ${node.title}`}</Tooltip>
                        }>
                            <button className="TagExplorer-nodeControl"
                               onClick={() =>
                                   context.setTags(addNodeUnderParent({
                                           treeData: context.tags,
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
                                           treeData: context.tags,
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
}

export default TagExplorer;