import express from 'express';
import bodyParser from 'body-parser';
import sqlite from 'sqlite3';
import Mercury from '@postlight/mercury-parser';

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let db;

const normPath = (filename) => filename.replace(/\\/g, '/');
const saveReadable = (id, content) => {
    try {
        db.run('UPDATE expression SET readable = ? WHERE id = ?', [content, id], err => {
            if (err) { console.log(`Error : ${err.code} on processing readable #${id}`); }
            else { const byteSize = Buffer.from(content).length; console.log(`Saved ${byteSize} bytes from readable #${id}`); }
        });
    } catch(err) {
        console.log(`Error : undefined content for expression #${id}`);
    }
};

app.get('/api/connect', (req, res) => {
    console.log(`Connecting to ${req.query.db}`);
    db = new sqlite.Database(normPath(req.query.db), sqlite.OPEN_READWRITE, (err) => {
        if (err) console.error(err.message);
        else console.log(`Connected to ${req.query.db}`);
        res.json(!err);
    });
});

app.get('/api/lands', (req, res) => {
    console.log(`Getting lands`);

    const sql = `SELECT
       l.id,
       l.name,
       l.description,
       MAX(e.relevance) AS maxRelevance,
       MIN(e.relevance) AS minRelevance
    FROM land AS l
    LEFT JOIN expression AS e ON e.land_id = l.id
    WHERE e.http_status = 200
    GROUP BY e.land_id`;

    db.all(sql, (err, rows) => {
        let response = (!err) ? rows : [];
        res.json(response);
    });
});

app.get('/api/land', (req, res) => {
    console.log(`Getting land #${req.query.id}`);

    const minRelevance = req.query.minRelevance ?? 0;
    const minDepth = req.query.minDepth ?? 0;
    const params = [
        req.query.id,
        minRelevance,
        minDepth
    ];

    let data;

    const sql = `SELECT
        l.id,
        l.name,
        l.description,
        COUNT(e.id) AS expressionCount,
        MAX(e.relevance) AS maxRelevance,
        MIN(e.relevance) AS minRelevance
    FROM land AS l
    LEFT JOIN expression AS e ON e.land_id = l.id
    WHERE land_id = ?
        AND e.http_status = 200
        AND e.relevance >= ?
        AND e.depth >= ?
    GROUP BY e.land_id`;

    db.get(sql, params, (err, row) => {
        data = (!err) ? row : {};

        const sql = `SELECT
           e.id,
           e.title,
           e.url,
           e.http_status AS httpStatus,
           e.relevance,
           d.name AS domainName
        FROM expression AS e
        JOIN domain AS d ON d.id = e.domain_id
        WHERE land_id = ?
          AND e.http_status = 200
          AND e.relevance >= ?
          AND e.depth >= ?
        LIMIT 50`;

        db.all(sql, params, (err, rows) => {
            data.expressions = (!err) ? rows : [];
            res.json(data);
        });
    });
});

app.get('/api/expression', (req, res) => {
    console.log(`Getting expression #${req.query.id}`);

    const sql = `SELECT
       e.id,
       e.title,
       e.url,
       e.description,
       e.keywords,
       e.readable,
       e.relevance,
       e.depth,
       d.name AS domainName,
       GROUP_CONCAT(m.url) AS images
    FROM expression AS e
    JOIN domain AS d ON d.id = e.domain_id
    LEFT JOIN media AS m ON m.expression_id = e.id AND m.type = 'img'
    WHERE e.id = ?`;

    db.get(sql, [req.query.id], (err, row) => {
        let response = (!err) ? row : null;
        res.json(response);
    });
});

app.get('/api/readable', (req, res) => {
    console.log(`Setting readable for expression #${req.query.id}`);

    const sql = `SELECT
       e.id,
       e.url
    FROM expression AS e
    WHERE id = ?`;

    db.get(sql, [req.query.id], (err, row) => {
        let response = (!err) ? row : null;
        if (response) {
            try {
                Mercury.parse(response.url, {
                    contentType: 'markdown',
                }).then(result => {
                    saveReadable(response.id, result.content);
                    res.json(result.content);
                }).catch(err => {
                    console.log(err);
                    res.json(null);
                });
            } catch (err) {
                console.log(err);
                res.json(null);
            }
        } else {
            res.json(response);
        }
    });
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