import express from 'express';
import bodyParser from 'body-parser';
import DataQueries from './DataQueries';

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/connect', (req, res) => {
    console.log(`Connecting to ${req.query.db}`);
    DataQueries.connect(req, res);
});

app.get('/api/lands', (req, res) => {
    console.log(`Getting lands`);
    DataQueries.getLands(req, res);
});

app.get('/api/land', (req, res) => {
    console.log(`Getting land #${req.query.id}`);
    DataQueries.getLand(req, res);
});

app.get('/api/expressions', (req, res) => {
    console.log(`Getting expressions for land #${req.query.landId}`);
    DataQueries.getExpressions(req, res);
});

app.get('/api/expression', (req, res) => {
    console.log(`Getting expression #${req.query.id}`);
    DataQueries.getExpression(req, res);
});

app.get('/api/prev', (req, res) => {
    console.log(`Getting prev expression #${req.query.id}`);
    DataQueries.getPrevExpression(req, res);
});

app.get('/api/next', (req, res) => {
    console.log(`Getting next expression #${req.query.id}`);
    DataQueries.getNextExpression(req, res);
});

app.get('/api/readable', (req, res) => {
    console.log(`Setting readable for expression #${req.query.id}`);
    DataQueries.getReadable(req, res);
});

/*
app.post('/api/setdb', (req, res) => {
    console.log(req.body);
    res.send(
        `I received your POST request. This is what you sent me: ${req.body.post}`,
    );
});
 */

app.listen(port, () => console.log(`Listening on port ${port}`));