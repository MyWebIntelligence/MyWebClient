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

function MainApp() { // Renommer l'ancien contenu de App en MainApp
    return (
        <ConfigContext>
            <div className="App">
                <header className="App-header">
                    <div className="p-3">
                        <DatabaseLocator />
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

function App() {
    const [user, setUser] = useState(undefined); // undefined = loading, null = non connecté

    useEffect(() => {
        fetch("/api/auth/me")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.id) setUser(data);
                else setUser(null);
            })
            .catch(() => setUser(null));
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    if (user === undefined) {
        return <div className="container text-center" style={{ marginTop: 100 }}><h2>Chargement...</h2></div>;
    }

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
                    {user ? <MainApp /> : <Redirect to="/login" />}
                </Route>
            </Switch>
        </BrowserRouter>
    );
}

export default App;
