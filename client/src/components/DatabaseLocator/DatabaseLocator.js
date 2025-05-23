// Fichier: client/src/components/DatabaseLocator/DatabaseLocator.js
// Description: Composant React permettant à l'utilisateur de spécifier le chemin
// vers le fichier de base de données SQLite et d'afficher l'état de la connexion.
// Utilise le Contexte (ConfigContext) pour mettre à jour le chemin de la base de données
// et pour refléter l'état de la connexion (connecté, en cours, erreur).

import React, {useContext, useEffect} from 'react';
import {Context} from '../../app/Context';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';

/**
 * Composant DatabaseLocator.
 * Affiche un champ de saisie où l'utilisateur peut coller le chemin d'accès
 * au fichier de la base de données.
 * Au premier rendu, tente de se connecter à la base de données précédemment stockée
 * dans localStorage.
 * Affiche une icône indiquant l'état de la connexion (succès, échec, en cours).
 */
function DatabaseLocator() {
    const context = useContext(Context);

    /**
     * Test connection once at first render
     */
    useEffect(() => {
        setTimeout(() => {
            context.setDb(localStorage.getItem('dbFile'));
        }, 1000);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    let stateClass = 'text-danger fas fa-exclamation-circle';

    if (context.connecting) {
        stateClass = 'text-warning fas fa-spinner spin';
    } else if (context.isConnected) {
        stateClass = 'text-success fas fa-check-circle';
    }

    return (
        <InputGroup>
            <InputGroup.Prepend>
                <InputGroup.Text><i className="fas fa-database" /></InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl id="dbLocation" onBlur={e => context.setDb(e.target.value)}
                         defaultValue={localStorage.getItem('dbFile')}
                         placeholder="Paste database file path here"/>
            <InputGroup.Append>
                <InputGroup.Text>
                    <i className={stateClass}> </i>
                </InputGroup.Text>
            </InputGroup.Append>
        </InputGroup>
    )
}

export default DatabaseLocator;
