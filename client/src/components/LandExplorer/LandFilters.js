// Fichier: client/src/components/LandExplorer/LandFilters.js
// Description: Composant React qui affiche les contrôles de filtrage pour un "land".
// Permet à l'utilisateur de définir la pertinence minimale et la profondeur maximale
// pour les expressions affichées dans le "land" courant.
// Utilise le composant FilterSlider pour chaque filtre et le Contexte (ConfigContext)
// pour appliquer les changements de filtre.

import React, {useContext} from 'react';
import './LandFilters.css';
import Form from 'react-bootstrap/Form';
import FilterSlider from './FilterSlider';
import {Context} from '../../app/Context';
import {delay} from '../../app/Util';

/**
 * Composant LandFilters.
 * Affiche des curseurs (FilterSlider) pour ajuster la pertinence minimale
 * et la profondeur maximale des expressions à afficher pour le "land" courant.
 * Les changements sont appliqués au contexte avec un léger délai pour éviter
 * des rafraîchissements trop fréquents pendant que l'utilisateur ajuste le curseur.
 */
function LandFilters() {
    const context = useContext(Context);

    /**
     * Gère le changement de la valeur du filtre de pertinence.
     * Appelle la fonction `setCurrentRelevance` du contexte avec la nouvelle valeur,
     * après un délai de 400ms.
     * @param {string|number} value - La nouvelle valeur de pertinence (provenant du slider).
     */
    const onChangeRelevance = (value) => {
        delay(400, context.setCurrentRelevance, parseInt(value));
    };

    /**
     * Gère le changement de la valeur du filtre de profondeur.
     * Appelle la fonction `setCurrentDepth` du contexte avec la nouvelle valeur,
     * après un délai de 400ms.
     * @param {string|number} value - La nouvelle valeur de profondeur (provenant du slider).
     */
    const onChangeDepth = (value) => {
        delay(400, context.setCurrentDepth, parseInt(value));
    };

    return (
        <div>
            <div className="h5 my-3">Filters</div>
            <div className="py-3 panel">
                <Form>
                    <FilterSlider label="Minimum relevance"
                                  min={context.minRelevance}
                                  max={context.maxRelevance}
                                  defaultValue={context.currentRelevance}
                                  apply={onChangeRelevance}/>

                    <FilterSlider label="Maximum depth"
                                  min={context.minDepth}
                                  max={context.maxDepth}
                                  defaultValue={context.currentDepth}
                                  apply={onChangeDepth}/>
                </Form>
            </div>
        </div>
    );
}

export default LandFilters;
