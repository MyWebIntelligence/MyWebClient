import sqlite from "sqlite3";
import Mercury from "@postlight/mercury-parser";

let db;

const DataQueries = {
    connect: (req, res) => {
        const normPath = (filename) => filename.replace(/\\/g, '/');
        db = new sqlite.Database(normPath(req.query.db), sqlite.OPEN_READWRITE, (err) => {
            if (err) console.error(err.message);
            else console.log(`Connected to ${req.query.db}`);
            res.json(!err);
        });
    },

    getLands: (req, res) => {
        const sql = `SELECT l.id,
                            l.name,
                            COUNT(e.id)      AS expressionCount,
                            MAX(e.relevance) AS maxRelevance,
                            MIN(e.relevance) AS minRelevance,
                            MAX(e.depth)     AS maxDepth,
                            MIN(e.depth)     AS minDepth
                     FROM land AS l
                              LEFT JOIN expression AS e ON e.land_id = l.id
                     WHERE e.http_status = 200
                       AND e.relevance >= 0
                     GROUP BY e.land_id`;
        db.all(sql, (err, rows) => {
            let response = (!err) ? rows : [];
            res.json(response);
        });
    },

    getLand: (req, res) => {
        const params = [
            req.query.id,
            req.query.minRelevance ?? 0,
            req.query.maxDepth ?? 3,
        ];

        const sql = `SELECT l.id,
                            l.name,
                            l.description,
                            COUNT(e.id) AS expressionCount
                     FROM land AS l
                              LEFT JOIN expression AS e ON e.land_id = l.id
                     WHERE land_id = ?
                       AND e.http_status = 200
                       AND e.relevance >= ?
                       AND e.depth <= ?
                     GROUP BY e.land_id`;

        db.get(sql, params, (err, row) => {
            let response = (!err) ? row : false;
            res.json(response);
        });
    },

    getExpressions: (req, res) => {
        const params = [
            req.query.landId,
            req.query.minRelevance ?? 0,
            req.query.maxDepth ?? 3,
            req.query.offset ?? 0,
            req.query.limit ?? 50,
        ];

        const column = req.query.sortColumn;
        const order = parseInt(req.query.sortOrder) === 1 ? 'ASC' : 'DESC';

        const sql = `SELECT e.id AS id,
                            e.title,
                            e.url,
                            e.http_status AS httpStatus,
                            e.relevance,
                            d.id          AS domainId,
                            d.name        AS domainName
                     FROM expression AS e
                              JOIN domain AS d ON d.id = e.domain_id
                     WHERE land_id = ?
                       AND e.http_status = 200
                       AND e.relevance >= ?
                       AND e.depth <= ?
                     ORDER BY ${column} ${order}
                     LIMIT ?, ?`;
        db.all(sql, params, (err, rows) => {
            let response = (!err) ? rows : [];
            res.json(response)
        });
    },

    getDomain: (req, res) => {
        const sql = `SELECT d.id,
                            d.name,
                            d.title,
                            d.description,
                            d.keywords,
                            COUNT(e.id) AS expressionCount
                     FROM domain AS d
                              JOIN expression AS e ON e.domain_id = d.id
                     WHERE d.id = ?`;

        db.get(sql, [req.query.id], (err, row) => {
            let response = !err ? row : null;
            res.json(response);
        });
    },

    getExpression: (req, res) => {
        const sql = `SELECT e.id,
                            e.land_id           AS landId,
                            e.url,
                            e.title,
                            e.description,
                            e.keywords,
                            e.readable,
                            e.relevance,
                            e.depth,
                            d.id                AS domainId,
                            d.name              AS domainName,
                            GROUP_CONCAT(m.url) AS images
                     FROM expression AS e
                              JOIN domain AS d ON d.id = e.domain_id
                              LEFT JOIN media AS m ON m.expression_id = e.id AND m.type = 'img'
                     WHERE e.id = ?`;

        db.get(sql, [req.query.id], (err, row) => {
            let response = !err ? row : null;
            res.json(response);
        });
    },

    getPrevExpression: (req, res) => {
        const params = [
            req.query.landId,
            req.query.minRelevance ?? 0,
            req.query.maxDepth ?? 3,
            req.query.id,
        ];

        const sql = `SELECT e.id
                     FROM expression AS e
                     WHERE e.land_id = ?
                       AND e.http_status = 200
                       AND e.relevance >= ?
                       AND e.depth <= ?
                       AND id < ?
                     ORDER BY id DESC
                     LIMIT 1`;

        db.get(sql, params, (err, row) => {
            let response = !err && row ? row.id : null;
            res.json(response);
        });
    },

    getNextExpression: (req, res) => {
        const params = [
            req.query.landId,
            req.query.minRelevance ?? 0,
            req.query.maxDepth ?? 3,
            req.query.id,
        ];

        const sql = `SELECT e.id
                     FROM expression AS e
                     WHERE e.land_id = ?
                       AND e.http_status = 200
                       AND e.relevance >= ?
                       AND e.depth <= ?
                       AND id > ?
                     ORDER BY id
                     LIMIT 1`;

        db.get(sql, params, (err, row) => {
            let response = !err && row ? row.id : null;
            res.json(response);
        });
    },

    getReadable: (req, res) => {
        const sql = `SELECT e.id,
                            e.url
                     FROM expression AS e
                     WHERE id = ?`;

        db.get(sql, [req.query.id], (err, row) => {
            let response = !err ? row : null;
            if (response) {
                try {
                    Mercury.parse(response.url, {
                        contentType: 'markdown',
                    }).then(result => {
                        console.log(result.content);
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
    },

    saveReadable: (req, res) => {
        try {
            db.run('UPDATE expression SET readable = ? WHERE id = ?', [req.body.content, req.body.id], err => {
                if (err) {
                    console.log(`Error : ${err.code} on processing readable #${req.body.id}`);
                } else {
                    const byteSize = Buffer.from(req.body.content).length;
                    console.log(`Saved ${byteSize} bytes from readable #${req.body.id}`);
                    res.json(true)
                }
            });
        } catch (err) {
            console.log(`Error : undefined content for expression #${req.body.id}`);
            res.json(false)
        }
    },

    deleteExpression: (req, res) => {
        db.serialize(() => {
            db.run(`DELETE
                    FROM expression
                    WHERE id = ?`, req.query.id)
                .run(`DELETE
                      FROM media
                      WHERE expression_id = ?`, req.query.id)
                .run(`DELETE
                      FROM expressionlink
                      WHERE source_id = ?
                         OR target_id = ?`, [req.query.id, req.query.id]);
        });
    },

};

export default DataQueries;