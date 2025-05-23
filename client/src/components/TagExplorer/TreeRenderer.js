// Fichier: client/src/components/TagExplorer/TreeRenderer.js
// Description: Composant React de bas niveau utilisé par `react-sortable-tree`
// pour le rendu de la structure de l'arbre, en particulier la gestion des zones de dépôt (drop targets)
// lors des opérations de glisser-déposer (drag-and-drop).
// Il s'agit probablement d'un composant interne ou d'une personnalisation
// pour `react-sortable-tree` plutôt qu'un composant d'interface utilisateur direct.

import React, { Component, Children, cloneElement } from 'react';
import PropTypes from 'prop-types';
import styles from './TreeRenderer.module.scss';

/**
 * Classe TreeRenderer.
 * Ce composant est un `nodeRenderer` pour `react-sortable-tree`.
 * Il est responsable du rendu de l'enveloppe de chaque nœud de l'arbre,
 * en particulier pour gérer la logique de la cible de dépôt (drop target)
 * lors du glisser-déposer.
 */
class TreeRenderer extends Component {
    render() {
        const {
            children, // Le contenu réel du nœud (rendu par un autre composant comme TagRenderer)
            listIndex,
            swapFrom,
            swapLength,
            swapDepth,
            scaffoldBlockPxWidth,
            lowerSiblingCounts,
            connectDropTarget,
            isOver,
            draggedNode,
            canDrop,
            treeIndex,
            treeId, // Delete from otherProps
            getPrevRow, // Delete from otherProps
            node, // Delete from otherProps
            path, // Delete from otherProps
            rowDirection, // Direction de la ligne (ltr ou rtl)
            ...otherProps // Autres props passées par react-sortable-tree
        } = this.props;

        // connectDropTarget est une fonction fournie par react-dnd (utilisé par react-sortable-tree)
        // pour rendre cet élément comme une zone de dépôt valide.
        return connectDropTarget(
            <div {...otherProps} className={styles.node}>
                {/* Clone les enfants (le contenu réel du nœud) en leur passant des props
                    liées à l'état du drag-and-drop (isOver, canDrop, etc.) */}
                {Children.map(children, child =>
                    cloneElement(child, {
                        isOver,
                        canDrop,
                        draggedNode,
                        lowerSiblingCounts,
                        listIndex,
                        swapFrom,
                        swapLength,
                        swapDepth,
                    })
                )}
            </div>
        );
    }
}

TreeRenderer.defaultProps = {
    swapFrom: null,
    swapDepth: null,
    swapLength: null,
    canDrop: false,
    draggedNode: null,
};

TreeRenderer.propTypes = {
    treeIndex: PropTypes.number.isRequired,
    treeId: PropTypes.string.isRequired,
    swapFrom: PropTypes.number,
    swapDepth: PropTypes.number,
    swapLength: PropTypes.number,
    scaffoldBlockPxWidth: PropTypes.number.isRequired,
    lowerSiblingCounts: PropTypes.arrayOf(PropTypes.number).isRequired,

    listIndex: PropTypes.number.isRequired,
    children: PropTypes.node.isRequired,

    // Drop target
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool,
    draggedNode: PropTypes.shape({}),

    // used in dndManager
    getPrevRow: PropTypes.func.isRequired,
    node: PropTypes.shape({}).isRequired,
    path: PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    ).isRequired,
    rowDirection: PropTypes.string.isRequired,
};

export default TreeRenderer;
