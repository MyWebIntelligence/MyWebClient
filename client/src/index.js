// Fichier: client/src/index.js
// Description: Point d'entrée principal de l'application React.
// Ce fichier est responsable du rendu du composant racine <App /> dans le DOM
// et de l'initialisation (ou non) du service worker.

import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App/App';
import * as serviceWorker from './serviceWorker';
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
