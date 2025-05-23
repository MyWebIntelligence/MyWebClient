// Fichier: client/src/components/LandExplorer/FilterSlider.js
// Description: Composant React réutilisable affichant un curseur (slider)
// pour filtrer des données numériques (ex: pertinence, profondeur).
// Il prend en entrée les valeurs min/max, une valeur par défaut, un label,
// et une fonction `apply` à appeler lorsque la valeur du curseur change.

import React, {useEffect, useState} from 'react';
import FormGroup from 'react-bootstrap/FormGroup';
import FormLabel from 'react-bootstrap/FormLabel';
import FormControl from 'react-bootstrap/FormControl';
import {Badge} from 'react-bootstrap';
import "./FilterSlider.css";

/**
 * Composant FilterSlider.
 * Affiche un contrôle de type "range" (curseur) avec un label et la valeur actuelle.
 * Permet à l'utilisateur de sélectionner une valeur dans un intervalle défini.
 * @param {object} props - Les propriétés du composant.
 * @param {string} props.label - Le label à afficher au-dessus du curseur.
 * @param {number} props.min - La valeur minimale du curseur.
 * @param {number} props.max - La valeur maximale du curseur.
 * @param {number} props.defaultValue - La valeur initiale du curseur.
 * @param {Function} props.apply - La fonction callback à exécuter lorsque la valeur change, reçoit la nouvelle valeur.
 */
function FilterSlider({label, min, max, defaultValue, apply}) {
    const [value, setValue] = useState(defaultValue);

    // Met à jour la valeur du curseur si la valeur par défaut change (ex: changement de "land").
    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    /**
     * Gère le changement de valeur du curseur.
     * Met à jour l'état local `value` et appelle la fonction `apply` passée en props
     * avec la nouvelle valeur.
     * @param {React.ChangeEvent<HTMLInputElement>} event - L'événement de changement du curseur.
     */
    const handleChange = event => {
        setValue(event.target.value);
        apply(event.target.value);
    };

    return (
        <FormGroup>
            <FormLabel>{label} <Badge pill variant="primary">{value}</Badge></FormLabel>
            <FormControl type="range" min={min} max={max} className="form-control-range" value={value} onChange={handleChange}/>
        </FormGroup>
    );
}

export default FilterSlider;
