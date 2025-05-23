// Fichier: client/src/components/Domain/Domain.js
// Description: Composant React pour afficher les détails d'un "domaine" spécifique.
// Un domaine semble être une entité contenant des expressions et des métadonnées.
// Ce composant utilise le Contexte (ConfigContext) pour accéder aux données du domaine courant
// et pour permettre de fermer la vue du domaine.

import React, {useCallback, useContext, useEffect} from "react";
import {Context} from '../../app/Context';
import './Domain.css';
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";

/**
 * Composant Domain.
 * Affiche les informations détaillées du domaine actuellement sélectionné dans le contexte.
 * Permet de fermer la vue du domaine via un bouton ou la touche Échap.
 * @param {object} props - Les propriétés du composant (ex: style).
 */
function Domain(props) {
    const context = useContext(Context);

    /**
     * Gère les raccourcis clavier pour ce composant.
     * Spécifiquement, la touche Échap (keyCode 27) ferme la vue du domaine
     * si aucun champ de saisie n'a le focus et si aucune expression n'est chargée.
     * @param {KeyboardEvent} event - L'événement clavier.
     */
    const keyboardControl = useCallback(event => {
        const notFocused = document.querySelectorAll('input:focus, textarea:focus').length === 0
        const unloadedExpression = context.currentExpression === null
        if (notFocused && unloadedExpression) {
            switch (event.keyCode) {
                case 27: context.getDomain(null)
                    break
                default:
                    break
            }
        }
    }, [context])

    useEffect(() => {
        document.addEventListener("keydown", keyboardControl, false)
        return () => {
            document.removeEventListener("keydown", keyboardControl, false)
        }
    }, [keyboardControl])

    return <section className={"Domain" + (context.currentDomain ? " d-block" : "")} style={props.style}>
        <Row>
            <Col md="8">
                <h6 className="App-objtype">Domain</h6>
                <h2>{context.currentDomain.name}  <a href={"https://"+context.currentDomain.name} target="_blank" rel="noopener noreferrer"><i className="fas fa-external-link-alt"/></a></h2>
                <h5 className="text-muted">{context.currentDomain.title}</h5>
            </Col>
            <Col md="4" className="d-flex align-items-center justify-content-end">
                <Button size="sm" className="rounded-pill mx-1"
                        onClick={_ => context.getDomain(null)}>
                    <i className="fas fa-times" />
                </Button>
            </Col>
        </Row>

        <p className="lead my-5">{context.currentDomain.description}</p>

        <h5>Expressions</h5>
        <p>{context.currentDomain.expressionCount} expressions registered in this domain</p>

        <h5>keywords</h5>
        <p>{context.currentDomain.keywords}</p>
    </section>
}

export default Domain;
