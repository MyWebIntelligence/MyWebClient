// Fichier: client/src/components/LandExplorer/LandExplorer.js
// Description: Composant React pour l'exploration des "lands".
// Un "land" semble être une collection de données ou un périmètre d'analyse.
// Ce composant permet à l'utilisateur de sélectionner un "land" dans une liste déroulante,
// affiche sa description, et intègre les composants LandFilters (pour filtrer les expressions
// du land) et TagExplorer (pour gérer les tags associés au land).

import React, { useContext } from 'react';
import { Context } from '../../app/Context';
import LandFilters from './LandFilters';
import './LandExplorer.css';
import { FormControl } from 'react-bootstrap';
import TagExplorer from "../TagExplorer/TagExplorer";

/**
 * Composant LandExplorer.
 * Affiche une liste déroulante pour sélectionner un "land".
 * Une fois un "land" sélectionné, affiche sa description, les filtres associés (LandFilters)
 * et l'explorateur de tags (TagExplorer) pour ce "land".
 * Utilise le Contexte (ConfigContext) pour accéder à la liste des "lands", au "land" courant,
 * et pour déclencher le changement de "land".
 */
function LandExplorer() {
    const context = useContext(Context);
    const notConnected = <option>Waiting for database connection...</option>;
    const currentId = context.currentLand !== null ? context.currentLand.id : null;

    /**
     * Gère le changement de "land" sélectionné dans la liste déroulante.
     * Appelle la fonction `getLand` du contexte avec l'ID du nouveau "land".
     * @param {React.ChangeEvent<HTMLSelectElement>} event - L'événement de changement de la liste déroulante.
     */
    const switchLand = event => {
        const id = parseInt(event.target.value);
        context.getLand(id);
    };

    return (
        <div>
            <div className="h5 my-3">Land</div>
            <div className="panel py-3">
                <FormControl as="select" onChange={switchLand} disabled={!context.isConnected} defaultValue={currentId}>
                    {context.lands.map((land, index) => {
                        return (
                            <option key={index} value={land.id}>
                                {land.name}
                            </option>
                        )
                    })}
                    {context.lands.length > 0 || notConnected}
                </FormControl>
                {context.currentLand && <p className="mt-2 text-muted">{context.currentLand.description}</p>}
            </div>

            {context.currentLand && <LandFilters/>}

            <TagExplorer/>
        </div>
    );
}

export default LandExplorer;
