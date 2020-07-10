import sqlite from "sqlite3"
import Mercury from "@postlight/mercury-parser"
import {log, placeholders} from "../client/src/app/Util"

let db

const DataQueries = {
    connect: (req, res) => {
        const normPath = (filename) => filename.replace(/\\/g, '/')
        db = new sqlite.Database(normPath(req.query.db), sqlite.OPEN_READWRITE, (err) => {
            if (err) console.error(err.message)
            else {
                db.run('PRAGMA foreign_keys = ON')
                log(`Connected to ${req.query.db}`)
            }
            res.json(!err)
        })
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
                     GROUP BY e.land_id`
        db.all(sql, (err, rows) => {
            const response = !err ? rows : []
            res.json(response)
        })
    },

    getLand: (req, res) => {
        const params = [
            req.query.id,
            req.query.minRelevance ?? 0,
            req.query.maxDepth ?? 3,
            req.query.id,
        ]

        const sql = `SELECT l.id,
                            l.name,
                            l.description,
                            (SELECT COUNT(*)
                             FROM expression
                             WHERE land_id = ?
                               AND http_status = 200
                               AND relevance >= ?
                               AND depth <= ?
                            ) AS expressionCount
                     FROM land AS l
                              LEFT JOIN expression AS e ON e.land_id = l.id
                     WHERE l.id = ?
                     GROUP BY l.id`

        db.get(sql, params, (err, row) => {
            const response = !err ? row : false
            res.json(response)
        })
    },

    getExpressions: (req, res) => {
        const params = [
            req.query.landId,
            req.query.minRelevance ?? 0,
            req.query.maxDepth ?? 3,
            req.query.offset ?? 0,
            req.query.limit ?? 50,
        ]

        const column = req.query.sortColumn
        const order = parseInt(req.query.sortOrder) === 1 ? 'ASC' : 'DESC'

        const sql = `SELECT e.id AS id,
                            e.title,
                            e.url,
                            e.http_status AS httpStatus,
                            e.relevance,
                            d.id          AS domainId,
                            d.name        AS domainName,
                            COUNT(t.id) AS tagCount
                     FROM expression AS e
                     JOIN domain AS d ON d.id = e.domain_id
                     LEFT JOIN taggedcontent AS t ON t.expression_id = e.id
                     WHERE land_id = ?
                       AND e.http_status = 200
                       AND e.relevance >= ?
                       AND e.depth <= ?
                     GROUP BY e.id
                     ORDER BY ${column} ${order}
                     LIMIT ?, ?`
        db.all(sql, params, (err, rows) => {
            const response = !err ? rows : []
            res.json(response)
        })
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
                     WHERE d.id = ?`

        db.get(sql, [req.query.id], (err, row) => {
            const response = !err ? row : null
            res.json(response)
        })
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
                     WHERE e.id = ?`

        db.get(sql, [req.query.id], (err, row) => {
            const response = !err ? row : null
            res.json(response)
        })
    },

    getPrevExpression: (req, res) => {
        const params = [
            req.query.landId,
            req.query.minRelevance ?? 0,
            req.query.maxDepth ?? 3,
            req.query.id,
        ]

        const sql = `SELECT e.id
                     FROM expression AS e
                     WHERE e.land_id = ?
                       AND e.http_status = 200
                       AND e.relevance >= ?
                       AND e.depth <= ?
                       AND id < ?
                     ORDER BY id DESC
                     LIMIT 1`

        db.get(sql, params, (err, row) => {
            const response = !err && row ? row.id : null
            res.json(response)
        })
    },

    getNextExpression: (req, res) => {
        const params = [
            req.query.landId,
            req.query.minRelevance ?? 0,
            req.query.maxDepth ?? 3,
            req.query.id,
        ]

        const sql = `SELECT e.id
                     FROM expression AS e
                     WHERE e.land_id = ?
                       AND e.http_status = 200
                       AND e.relevance >= ?
                       AND e.depth <= ?
                       AND id > ?
                     ORDER BY id
                     LIMIT 1`

        db.get(sql, params, (err, row) => {
            const response = !err && row ? row.id : null
            res.json(response)
        })
    },

    getReadable: (req, res) => {
        const sql = `SELECT e.id,
                            e.url
                     FROM expression AS e
                     WHERE id = ?`

        db.get(sql, [req.query.id], (err, row) => {
            const response = !err ? row : null
            if (response) {
                try {
                    Mercury.parse(response.url, {
                        contentType: 'markdown',
                    }).then(result => {
                        res.json(result.content)
                    }).catch(err => {
                        log(err)
                        res.json(null)
                    })
                } catch (err) {
                    log(err)
                    res.json(null)
                }
            } else {
                res.json(response)
            }
        })
    },

    saveReadable: (req, res) => {
        try {
            db.run('UPDATE expression SET readable = ? WHERE id = ?', [req.body.content, req.body.id], err => {
                if (err) {
                    log(`Error : ${err.code} on processing readable #${req.body.id}`)
                } else {
                    const byteSize = Buffer.from(req.body.content).length
                    log(`Saved ${byteSize} bytes from readable #${req.body.id}`)
                    res.json(true)
                }
            })
        } catch (err) {
            log(`Error : undefined content for expression #${req.body.id}`)
            res.json(false)
        }
    },

    deleteExpression: (req, res) => {
        db.serialize(() => {
            db.run(`DELETE
                    FROM expression
                    WHERE id IN (${placeholders(req.query.id)})`, req.query.id)
                .run(`DELETE
                      FROM media
                      WHERE expression_id IN (${placeholders(req.query.id)})`, req.query.id)
                .run(`DELETE
                      FROM expressionlink
                      WHERE source_id IN (${placeholders(req.query.id)})
                         OR target_id IN (${placeholders(req.query.id)})`, [req.query.id, req.query.id])
        })
        return res.json(true)
    },

    getTags: (req, res) => {
        const buildTagTree = rows => {
            const tree = []
            const lookup = {}
            rows.forEach((r) => {
                lookup[r.id] = r
                lookup[r.id].expanded = true
                lookup[r.id].children = []
            })
            rows.forEach((r) => {
                if (r.parent_id !== null) {
                    lookup[r.parent_id].children.push(r)
                } else {
                    tree.push(r)
                }
            })
            return tree
        }

        const sql = `SELECT id,
                            land_id,
                            parent_id,
                            name AS title,
                            sorting,
                            color
                     FROM tag
                     WHERE land_id = ?
                     ORDER BY parent_id, sorting`
        db.all(sql, [req.query.landId], (err, rows) => {
            const response = !err ? buildTagTree(rows) : []
            res.json(response)
        })
    },

    /**
     * Selects all tags from land to build existing index
     * Then walks through all incoming nodes to insert new nodes, update existing nodes and build future index
     * This enables both indexes to be compared then deletions can be committed
     * @param req
     * @param res
     */
    setTags: (req, res) => {
        const insert = db.prepare("INSERT INTO tag (land_id, parent_id, name, sorting, color) VALUES (?, ?, ?, ?, ?)")
        const update = db.prepare("UPDATE tag SET parent_id = ?, name = ?, sorting = ?, color = ? WHERE id = ?")
        const remove = db.prepare("DELETE FROM tag WHERE id = ?")

        db.all('SELECT id FROM tag WHERE land_id = ?', [req.body.landId], (err, rows) => {
            const prevIndex = rows.map(row => row.id)
            const nextIndex = []
            const walk = (tags, parentId) => tags.forEach((tag, index) => {
                tag.land_id = req.body.landId
                tag.sorting = index
                tag.parent_id = parentId

                if (!('id' in tag)) {
                    insert.run([tag.land_id, tag.parent_id, tag.title, tag.sorting, tag.color], err => {
                        tag.id = insert.lastID
                    })
                } else {
                    update.run([tag.parent_id, tag.title, tag.sorting, tag.color, tag.id])
                }

                nextIndex.push(tag.id)


                if (!('children' in tag)) {
                    tag.children = []
                }

                if (tag.children.length > 0) {
                    walk(tag.children, tag.id)
                }
            })

            walk(req.body.tags, null)

            const toDelete = prevIndex.filter(index => !nextIndex.includes(index))
            toDelete.forEach(id => remove.run([id]))

            res.json(true)

        })
    },

    getTaggedContent: (req, res) => {
        const sql = `SELECT *
                     FROM taggedContent
                     WHERE expression_id = ?`
        db.all(sql, [req.query.expressionId], (err, rows) => {
            const response = !err ? rows : []
            res.json(response)
        })
    },

    deleteTaggedContent: (req, res) => {
        const sql = `DELETE
                     FROM taggedContent
                     WHERE id = ?`
        db.run(sql, [req.query.id], err => {
            res.json(!err)
        })
    },

    setTaggedContent: (req, res) => {
        log([req.body.tagId, req.body.expressionId, req.body.text, req.body.start, req.body.end])
        const sql = 'INSERT INTO taggedContent (tag_id, expression_id, `text`,  from_char, to_char) VALUES (?, ?, ?, ?, ?)'
        db.run(sql, [req.body.tagId, req.body.expressionId, req.body.text, req.body.start, req.body.end], (err) => {
            const response = !err ? true : err
            res.json(response)
        })
    },
}

export default DataQueries