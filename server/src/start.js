// Fichier: server/src/start.js
// Description: Point d'entrée principal du serveur backend Express.
// Ce fichier initialise le serveur, configure les middlewares (y compris pour les sessions et
// l'analyse du corps des requêtes), charge les variables d'environnement,
// définit les routes API pour l'authentification et l'accès aux données,
// sert les fichiers statiques de l'application client React, et démarre le serveur
// sur le port spécifié (par défaut 5001 ou via la variable d'environnement PORT).

import dotenv from 'dotenv';
const envConfig = dotenv.config(); // Charge les variables d'environnement depuis le fichier .env

if (envConfig.error) {
  console.error("Erreur lors du chargement du fichier .env:", envConfig.error);
} else {
  console.log("Variables .env chargées:", envConfig.parsed);
}

import express from 'express'
import bodyParser from 'body-parser' // Middleware pour analyser le corps des requêtes
import path from 'path' // Importer path
import { fileURLToPath } from 'url'; // Pour __dirname avec ES modules
import DataQueries from './DataQueries.js' // Ajout de .js
import authRoutes from './authRoutes.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Récupère le nom du répertoire courant

const app = express() // Crée une instance de l'application Express

// Middlewares de base pour l'analyse du corps des requêtes
app.use(express.json()) // Pour analyser les corps de requête JSON
app.use(express.urlencoded({ extended: true })) // Pour analyser les corps de requête URL-encoded

// Suppression du middleware de session : tout est géré par JWT désormais

// Montage des routes d'authentification sous le préfixe /api/auth
app.use('/api/auth', authRoutes)

// Middleware pour servir les fichiers statiques de l'application client React.
// En développement, cela pointe vers le dossier `public` du client.
// En production, cela devrait pointer vers le dossier `build` du client après la compilation.
const clientPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '..', '..', 'client', 'build')
    : path.join(__dirname, '..', '..', 'client', 'public');

app.use(express.static(clientPath));


const port = process.env.PORT || 5001 // Définit le port d'écoute du serveur

// Middlewares body-parser (redondant avec express.json et express.urlencoded, mais conservé pour compatibilité si DataQueries les attend)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Définition des routes API pour les données principales, déléguées à DataQueries.js
// Chaque route loggue l'action et appelle la fonction correspondante dans DataQueries.

const dataRouter = express.Router();

// Route pour récupérer la liste des "lands"
dataRouter.get('/lands', (req, res) => {
    console.log(`Getting lands`)
    DataQueries.getLands(req, res)
})

// Route pour récupérer les détails d'un "land" spécifique
dataRouter.get('/land', (req, res) => {
    console.log(`Getting land #${req.query.id}`)
    DataQueries.getLand(req, res)
})

// Route pour récupérer les expressions d'un "land" (avec filtres, tri, pagination)
dataRouter.get('/expressions', (req, res) => {
    console.log(`Getting expressions for land #${req.query.landId}`)
    DataQueries.getExpressions(req, res)
})

// Route pour récupérer les détails d'un domaine
dataRouter.get('/domain', (req, res) => {
    console.log(`Getting domain #${req.query.id}`)
    DataQueries.getDomain(req, res)
})

// Route pour récupérer les détails d'une expression
dataRouter.get('/expression', (req, res) => {
    console.log(`Getting expression #${req.query.id}`)
    DataQueries.getExpression(req, res)
})

// Route pour supprimer une ou plusieurs expressions
dataRouter.get('/deleteExpression', (req, res) => {
    console.log(`Deleting expression #${req.query.id}`)
    DataQueries.deleteExpression(req, res)
})

// Route pour obtenir l'expression précédente
dataRouter.get('/prev', (req, res) => {
    console.log(`Getting prev expression #${req.query.id}`)
    DataQueries.getPrevExpression(req, res)
})

// Route pour obtenir l'expression suivante
dataRouter.get('/next', (req, res) => {
    console.log(`Getting next expression #${req.query.id}`)
    DataQueries.getNextExpression(req, res)
})

// Route pour obtenir le contenu "lisible" (Markdown) d'une expression
dataRouter.get('/readable', (req, res) => {
    console.log(`Getting readable for expression #${req.query.id}`)
    DataQueries.getReadable(req, res)
})

// Route pour sauvegarder le contenu "lisible" (Markdown) d'une expression
dataRouter.post('/readable', (req, res) => {
    console.log(`Setting readable for expression #${req.body.id}`)
    DataQueries.saveReadable(req, res)
})

// Route pour récupérer les tags d'un "land"
dataRouter.get('/tags', (req, res) => {
    console.log(`Getting tags for land #${req.query.landId}`)
    DataQueries.getTags(req, res)
})

// Route pour sauvegarder/mettre à jour la structure des tags d'un "land"
dataRouter.post('/tags', (req, res) => {
    console.log(`Setting tags`)
    DataQueries.setTags(req, res)
})

// Route pour mettre à jour un tag spécifique
dataRouter.post('/updateTag', (req, res) => {
    console.log(`Updating tag`)
    DataQueries.updateTag(req, res)
})

// Route pour récupérer le contenu taggué (pour un land ou une expression, avec filtre optionnel)
dataRouter.get('/taggedContent', (req, res) => {
    console.log(`Getting tagged content for #${req.query.landId || req.query.expressionId}`)
    DataQueries.getTaggedContent(req, res)
})

// Route pour supprimer une instance de contenu taggué
dataRouter.get('/deleteTaggedContent', (req, res) => {
    console.log(`Deleting tagged content #${req.query.id}`)
    DataQueries.deleteTaggedContent(req, res)
})

// Route pour créer une nouvelle instance de contenu taggué
dataRouter.post('/tagContent', (req, res) => {
    console.log(`Saving tagged content`)
    DataQueries.setTaggedContent(req, res)
})

// Route pour mettre à jour une instance de contenu taggué
dataRouter.post('/updateTagContent', (req, res) => {
    console.log(`Editing tagged content`)
    DataQueries.updateTagContent(req, res)
})

// Route pour supprimer un média associé à une expression
dataRouter.post('/deleteMedia', (req, res) => {
    console.log(`Deleting media ${req.url}`)
    DataQueries.deleteMedia(req, res)
})


// Monter les routes de données
app.use('/api', dataRouter);

// Route pour établir la connexion à la base de données principale
app.get('/api/connect', (req, res) => {
    console.log(`Connecting to ${req.query.db}`)
    DataQueries.connect(req, res) // La fonction connect dans DataQueries se chargera de répondre
})


// Gestion des routes client React : pour toutes les autres requêtes GET non-API, renvoyer index.html
// Cela permet à React Router de gérer la navigation côté client.
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '..', '..', 'client', 'public', 'index.html'));
    } else {
        // Si c'est une route API non trouvée, laisser Express gérer (404 par défaut)
        // Ou gérer explicitement si nécessaire
        res.status(404).send('API route not found');
    }
});

app.listen(port, () => console.log(`Listening on port ${port}`))
