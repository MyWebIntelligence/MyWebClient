// Fichier: client/src/components/App/App.js
// Description: Composant principal de l'application React.
// Ce fichier définit la structure de base de l'application, y compris le routage,
// la gestion de l'état d'authentification de l'utilisateur, et la mise en page principale.
// Il utilise React Router pour la navigation et le ConfigContext pour l'état global.

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'; // Modifié pour v5
import { ConfigContext } from '../../app/Context';
import LandExplorer from '../LandExplorer/LandExplorer';
import ExpressionExplorer from '../ExpressionExplorer/ExpressionExplorer';
import DatabaseLocator from '../DatabaseLocator/DatabaseLocator';
import Login from '../Login';
import ForgotPassword from '../ForgotPassword'; // Importer ForgotPassword
import ResetPassword from '../ResetPassword';   // Importer ResetPassword
import './App.css';
import 'react-sortable-tree/style.css';

/**
 * Composant MainApp.
 * Représente la structure principale de l'application une fois l'utilisateur connecté.
 * Inclut l'en-tête (DatabaseLocator), la barre latérale (LandExplorer) et la vue principale (ExpressionExplorer).
 * Enveloppe ses enfants dans le ConfigContext pour leur donner accès à l'état global.
 */
function MainApp({ onLogout }) {
    return (
        <ConfigContext>
            <div className="App">
                <header className="App-header">
                    <div className="p-3" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <DatabaseLocator />
                        <button className="btn btn-outline-danger" onClick={onLogout}>Déconnexion</button>
                    </div>
                </header>
                <aside className="App-sidebar">
                    <div className="p-3">
                        <LandExplorer />
                    </div>
                </aside>
                <section className="App-view">
                    <div className="p-3" style={{ position: 'relative', zIndex: 1 }}>
                        <ExpressionExplorer />
                    </div>
                </section>
            </div>
        </ConfigContext>
    );
}

/**
 * Composant App racine.
 * Gère l'état d'authentification de l'utilisateur et le routage de l'application.
 * Au chargement, tente de récupérer les informations de l'utilisateur connecté via l'API /api/auth/me.
 * Affiche un écran de chargement, puis soit les routes d'authentification (Login, ForgotPassword, ResetPassword)
 * si l'utilisateur n'est pas connecté, soit le MainApp si l'utilisateur est connecté.
 */
function App() {
    const [user, setUser] = useState(undefined); // undefined = loading, null = non connecté

    // Effet pour vérifier l'état d'authentification de l'utilisateur au montage du composant.
    useEffect(() => {
        const token = localStorage.getItem("auth_token");
        if (!token) {
            setUser(null);
            return;
        }
        fetch("/api/auth/me", {
            headers: {
                "Authorization": "Bearer " + token
            }
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.id) setUser(data);
                else {
                    localStorage.removeItem("auth_token");
                    setUser(null);
                }
            })
            .catch(() => {
                localStorage.removeItem("auth_token");
                setUser(null);
            });
    }, []);

    /**
     * Gère la connexion de l'utilisateur.
     * Met à jour l'état `user` avec les données de l'utilisateur connecté.
     * @param {object} userData - Les informations de l'utilisateur retournées par l'API après connexion.
     */
    const handleLogin = (userData) => {
        setUser(userData);
    };

    if (user === undefined) {
        return <div className="container text-center" style={{ marginTop: 100 }}><h2>Chargement...</h2></div>;
    }

    // Fonction de déconnexion
    const handleLogout = () => {
        localStorage.removeItem("auth_token");
        setUser(null);
    };

    return (
        <BrowserRouter>
            <Switch>
                <Route path="/login">
                    {!user ? <Login onLogin={handleLogin} /> : <Redirect to="/" />}
                </Route>
                <Route path="/forgot-password">
                    {!user ? <ForgotPassword /> : <Redirect to="/" />}
                </Route>
                <Route path="/reset-password">
                    {!user ? <ResetPassword /> : <Redirect to="/" />}
                </Route>
                <Route path="/">
                    {user ? <MainApp onLogout={handleLogout} /> : <Redirect to="/login" />}
                </Route>
            </Switch>
        </BrowserRouter>
    );
}

export default App;
