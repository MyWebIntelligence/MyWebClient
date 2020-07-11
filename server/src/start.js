import express from 'express';
import bodyParser from 'body-parser';
import DataQueries from './DataQueries';
import {log} from '../../client/src/app/Util';

const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/connect', (req, res) => {
    log(`Connecting to ${req.query.db}`);
    DataQueries.connect(req, res);
});

app.get('/api/lands', (req, res) => {
    log(`Getting lands`);
    DataQueries.getLands(req, res);
});

app.get('/api/land', (req, res) => {
    log(`Getting land #${req.query.id}`);
    DataQueries.getLand(req, res);
});

app.get('/api/expressions', (req, res) => {
    log(`Getting expressions for land #${req.query.landId}`);
    DataQueries.getExpressions(req, res);
});

app.get('/api/domain', (req, res) => {
    log(`Getting domain #${req.query.id}`);
    DataQueries.getDomain(req, res);
});

app.get('/api/expression', (req, res) => {
    log(`Getting expression #${req.query.id}`);
    DataQueries.getExpression(req, res);
});

app.get('/api/deleteExpression', (req, res) => {
    log(`Deleting expression #${req.query.id}`);
    DataQueries.deleteExpression(req, res);
});

app.get('/api/prev', (req, res) => {
    log(`Getting prev expression #${req.query.id}`);
    DataQueries.getPrevExpression(req, res);
});

app.get('/api/next', (req, res) => {
    log(`Getting next expression #${req.query.id}`);
    DataQueries.getNextExpression(req, res);
});

app.get('/api/readable', (req, res) => {
    log(`Getting readable for expression #${req.query.id}`);
    DataQueries.getReadable(req, res);
});

app.post('/api/readable', (req, res) => {
    log(`Setting readable for expression #${req.body.id}`);
    DataQueries.saveReadable(req, res);
});

app.get('/api/tags', (req, res) => {
    log(`Getting tags for land #${req.query.landId}`);
    DataQueries.getTags(req, res)
});

app.post('/api/tags', (req, res) => {
    log(`Setting tags`);
    DataQueries.setTags(req, res)
});

app.get('/api/taggedContent', (req, res) => {
    log(`Getting tagged content for expression #${req.query.expressionId}`);
    DataQueries.getTaggedContent(req, res)
});

app.get('/api/deleteTaggedContent', (req, res) => {
    log(`Deleting tagged content #${req.query.id}`);
    DataQueries.deleteTaggedContent(req, res)
});

app.post('/api/tagContent', (req, res) => {
    log(`Saving tagged content`);
    DataQueries.setTaggedContent(req, res)
});

app.listen(port, () => log(`Listening on port ${port}`));