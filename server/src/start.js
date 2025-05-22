import express from 'express'
import bodyParser from 'body-parser'
import DataQueries from './DataQueries'

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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

app.listen(port, () => console.log(`Listening on port ${port}`))
