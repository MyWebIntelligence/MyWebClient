import dotenv from 'dotenv';
const envConfig = dotenv.config();

if (envConfig.error) {
  console.error("Erreur lors du chargement du fichier .env:", envConfig.error);
} else {
  console.log("Variables .env chargées:", envConfig.parsed);
}

import express from 'express'
import bodyParser from 'body-parser'
import path from 'path' // Importer path
import { fileURLToPath } from 'url'; // Pour __dirname avec ES modules
import DataQueries from './DataQueries.js' // Ajout de .js
import authRoutes, { sessionMiddleware } from './authRoutes.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Middleware de session pour authentification
app.use(sessionMiddleware)

// Routes d'authentification
app.use('/api/auth', authRoutes)

// Servir les fichiers statiques de l'application React (pour le développement, pointe vers public)
// Pour la production, cela devrait pointer vers le dossier 'client/build'
app.use(express.static(path.join(__dirname, '..', '..', 'client', 'public')));


const port = process.env.PORT || 5001

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/api/connect', (req, res) => {
    console.log(`Connecting to ${req.query.db}`) // Restored original log
    DataQueries.connect(req, res) // Restored original call
})

app.get('/api/lands', (req, res) => {
    console.log(`Getting lands`)
    DataQueries.getLands(req, res)
})

app.get('/api/land', (req, res) => {
    console.log(`Getting land #${req.query.id}`)
    DataQueries.getLand(req, res)
})

app.get('/api/expressions', (req, res) => {
    console.log(`Getting expressions for land #${req.query.landId}`)
    DataQueries.getExpressions(req, res)
})

app.get('/api/domain', (req, res) => {
    console.log(`Getting domain #${req.query.id}`)
    DataQueries.getDomain(req, res)
})

app.get('/api/expression', (req, res) => {
    console.log(`Getting expression #${req.query.id}`)
    DataQueries.getExpression(req, res)
})

app.get('/api/deleteExpression', (req, res) => {
    console.log(`Deleting expression #${req.query.id}`)
    DataQueries.deleteExpression(req, res)
})

app.get('/api/prev', (req, res) => {
    console.log(`Getting prev expression #${req.query.id}`)
    DataQueries.getPrevExpression(req, res)
})

app.get('/api/next', (req, res) => {
    console.log(`Getting next expression #${req.query.id}`)
    DataQueries.getNextExpression(req, res)
})

app.get('/api/readable', (req, res) => {
    console.log(`Getting readable for expression #${req.query.id}`)
    DataQueries.getReadable(req, res)
})

app.post('/api/readable', (req, res) => {
    console.log(`Setting readable for expression #${req.body.id}`)
    DataQueries.saveReadable(req, res)
})

app.get('/api/tags', (req, res) => {
    console.log(`Getting tags for land #${req.query.landId}`)
    DataQueries.getTags(req, res)
})

app.post('/api/tags', (req, res) => {
    console.log(`Setting tags`)
    DataQueries.setTags(req, res)
})

app.post('/api/updateTag', (req, res) => {
    console.log(`Updating tag`)
    DataQueries.updateTag(req, res)
})

app.get('/api/taggedContent', (req, res) => {
    console.log(`Getting tagged content for #${req.query.landId || req.query.expressionId}`)
    DataQueries.getTaggedContent(req, res)
})

app.get('/api/deleteTaggedContent', (req, res) => {
    console.log(`Deleting tagged content #${req.query.id}`)
    DataQueries.deleteTaggedContent(req, res)
})

app.post('/api/tagContent', (req, res) => {
    console.log(`Saving tagged content`)
    DataQueries.setTaggedContent(req, res)
})

app.post('/api/updateTagContent', (req, res) => {
    console.log(`Editing tagged content`)
    DataQueries.updateTagContent(req, res)
})

app.post('/api/deleteMedia', (req, res) => {
    console.log(`Deleting media ${req.url}`)
    DataQueries.deleteMedia(req, res)
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
