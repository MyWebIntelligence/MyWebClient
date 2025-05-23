// Fichier: server/src/DataQueries.js
// Description: Ce module gère toutes les requêtes vers la base de données principale de l'application (hors admin).
// Il est responsable de la connexion à la base de données SQLite spécifiée par l'utilisateur
// et de l'exécution des requêtes SQL pour récupérer et manipuler les données relatives aux "lands",
// "expressions", "domaines", "tags", contenu taggué, et médias.
// Les fonctions de cet objet sont généralement exposées comme des points de terminaison API.

import sqlite from "sqlite3"
import Mercury from "@postlight/mercury-parser" // Utilisé pour extraire le contenu "lisible" d'URLs

let db // Instance unique de la base de données principale

/**
 * Génère une chaîne de placeholders SQL (?) pour les requêtes préparées,
 * en fonction du nombre de paramètres.
 * @param {Array|any} params - Un tableau de paramètres ou une seule valeur.
 * @returns {string} Une chaîne de placeholders (ex: "?,?,?" ou "?").
 */
const placeholders = params => {
    if (Array.isArray(params)) {
        return params.map(_ => '?').join(',')
    }
    return '?'
}

/**
 * Récupère l'ID de l'expression précédente ou suivante dans un "land" donné,
 * en fonction des critères de tri et de filtrage actuels.
 * @param {number} offset - -1 pour l'expression précédente, 1 pour la suivante.
 * @param {object} req - L'objet requête Express, contenant les paramètres dans req.query (landId, minRelevance, maxDepth, id, sortColumn, sortOrder).
 * @param {object} res - L'objet réponse Express.
 */
const getSiblingExpression = (offset, req, res) => {
    const params = [
        req.query.landId,
        req.query.minRelevance ?? 0,
        req.query.maxDepth ?? 3,
        req.query.id
    ]

    const column = req.query.sortColumn
    const order = parseInt(req.query.sortOrder) === 1 ? 'ASC' : 'DESC'

    const sql = `SELECT sibling
                     FROM (
                          SELECT e.id,
                                 LEAD(e.id, ${offset}, NULL) OVER (ORDER BY ${column} ${order}) AS sibling
                          FROM expression AS e
                                   JOIN domain AS d ON d.id = e.domain_id
                                   LEFT JOIN taggedcontent AS t ON t.expression_id = e.id
                          WHERE e.land_id = ?
                            AND e.http_status = 200
                            AND e.relevance >= ?
                            AND e.depth <= ?
                          GROUP BY e.id
                      ) AS t
                     WHERE t.id = ?`

    db.get(sql, params, (err, row) => {
        const response = !err && row ? row.sibling : null
        res.json(response)
    })
}

const dbCheck = (res, callback) => {
    if (!db) {
        console.error("Database not connected. Call /api/connect first.");
        if (res && typeof res.status === 'function') {
            res.status(503).json({ error: "Database not connected. Please connect first via /api/connect." });
        }
        return false;
    }
    return callback();
};

const DataQueries = {
    /**
     * API Route: /api/connect
     * Établit une connexion à la base de données SQLite spécifiée par le chemin dans `req.query.db`.
     * Active les clés étrangères.
     * @param {object} req - L'objet requête Express. `req.query.db` doit contenir le chemin du fichier DB.
     * @param {object} res - L'objet réponse Express. Retourne `true` si la connexion est réussie, `false` sinon.
     */
    connect: (req, res) => {
        const normPath = (filename) => filename.replace(/\\/g, '/') // Normalise les chemins pour Windows
        db = new sqlite.Database(normPath(req.query.db), sqlite.OPEN_READWRITE, (err) => {
            if (err) console.error(err.message)
            else {
                db.run('PRAGMA foreign_keys = ON') // Active le support des clés étrangères
                console.log(`Connected to ${req.query.db}`)
            }
            res.json(!err) // Retourne true si pas d'erreur, false sinon
        })
    },

    /**
     * API Route: /api/lands
     * Récupère la liste de tous les "lands" (id et nom).
     * @param {object} req - L'objet requête Express.
     * @param {object} res - L'objet réponse Express. Retourne un tableau d'objets land [{id, name}].
     */
    getLands: (req, res) => dbCheck(res, () => {
        const sql = `SELECT id, name FROM land`;
        db.all(sql, (err, rows) => {
            if (err) {
                console.error("Error in getLands query:", err.message);
                res.json([]);
            } else {
                res.json(rows);
            }
        })
    }), // Ajout de la virgule manquante

    /**
     * API Route: /api/land
     * Récupère les détails d'un "land" spécifique, y compris le nombre d'expressions
     * correspondant aux filtres de pertinence et de profondeur.
     * @param {object} req - L'objet requête Express. `req.query` doit contenir `id` (du land),
     *                       et optionnellement `minRelevance` et `maxDepth`.
     * @param {object} res - L'objet réponse Express. Retourne un objet land détaillé ou `false` en cas d'erreur.
     */
    getLand: (req, res) => dbCheck(res, () => {
        const params = [
            req.query.id, // pour le COUNT(*)
            req.query.minRelevance ?? 0,
            req.query.maxDepth ?? 3,
            req.query.id, // pour le WHERE l.id = ?
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
    }), // Ajout de la virgule manquante

    /**
     * API Route: /api/expressions
     * Récupère une liste paginée et triée d'expressions pour un "land" donné,
     * en appliquant les filtres de pertinence et de profondeur.
     * @param {object} req - L'objet requête Express. `req.query` doit contenir `landId`,
     *                       et optionnellement `minRelevance`, `maxDepth`, `offset`, `limit`, `sortColumn`, `sortOrder`.
     * @param {object} res - L'objet réponse Express. Retourne un tableau d'objets expression.
     */
    getExpressions: (req, res) => dbCheck(res, () => {
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
                            COUNT(tc.tag_id) AS tagCount
                     FROM expression AS e
                     JOIN domain AS d ON d.id = e.domain_id
                     LEFT JOIN taggedcontent AS tc ON tc.expression_id = e.id
                     WHERE land_id = ?
                       AND e.http_status = 200
                       AND e.relevance >= ?
                       AND e.depth <= ?
                     GROUP BY e.id
                     ORDER BY ${column} ${order}
                     LIMIT ?, ?`
        console.log("Executing getExpressions query:", sql, "with params:", params); // Log query and params
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error("Error in getExpressions query:", err.message);
            }
            console.log("getExpressions query result:", rows); // Log the result
            const response = !err ? rows : []
            res.json(response)
        })
    }), // Ajout de la virgule manquante

    /**
     * API Route: /api/domain
     * Récupère les détails d'un domaine spécifique, y compris le nombre total d'expressions associées.
     * @param {object} req - L'objet requête Express. `req.query.id` doit contenir l'ID du domaine.
     * @param {object} res - L'objet réponse Express. Retourne un objet domaine détaillé ou `null` en cas d'erreur.
     */
    getDomain: (req, res) => dbCheck(res, () => {
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
    }), // Ajout de la virgule manquante

    /**
     * API Route: /api/expression
     * Récupère les détails complets d'une expression spécifique, y compris son domaine associé et ses images.
     * @param {object} req - L'objet requête Express. `req.query.id` doit contenir l'ID de l'expression.
     * @param {object} res - L'objet réponse Express. Retourne un objet expression détaillé ou `null` en cas d'erreur.
     */
    getExpression: (req, res) => dbCheck(res, () => {
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
    }), // Ajout de la virgule manquante

    /**
     * API Route: /api/prev
     * Récupère l'ID de l'expression précédente par rapport à une expression donnée,
     * en utilisant les filtres et tris courants. Fait appel à `getSiblingExpression`.
     * @param {object} req - L'objet requête Express. Voir `getSiblingExpression` pour les `req.query` attendus.
     * @param {object} res - L'objet réponse Express.
     */
    getPrevExpression: (req, res) => dbCheck(res, () => {
        getSiblingExpression(-1, req, res)
    }), // Virgule déjà présente, mais vérification

    /**
     * API Route: /api/next
     * Récupère l'ID de l'expression suivante par rapport à une expression donnée,
     * en utilisant les filtres et tris courants. Fait appel à `getSiblingExpression`.
     * @param {object} req - L'objet requête Express. Voir `getSiblingExpression` pour les `req.query` attendus.
     * @param {object} res - L'objet réponse Express.
     */
    getNextExpression: (req, res) => dbCheck(res, () => {
        getSiblingExpression(1, req, res)
    }), // Virgule déjà présente, mais vérification

    /**
     * API Route: /api/readable
     * Récupère l'URL d'une expression, puis utilise Mercury Parser pour extraire
     * son contenu principal au format Markdown.
     * @param {object} req - L'objet requête Express. `req.query.id` doit contenir l'ID de l'expression.
     * @param {object} res - L'objet réponse Express. Retourne le contenu Markdown ou `null`.
     */
    getReadable: (req, res) => dbCheck(res, () => {
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
                        console.log(err)
                        res.json(null)
                    })
                } catch (err) {
                    console.log(err)
                    res.json(null)
                }
            } else {
                res.json(response)
            }
        })
    }), // Ajout de la virgule manquante

    /**
     * API Route: /api/readable (POST)
     * Sauvegarde le contenu "lisible" (Markdown) d'une expression.
     * Met à jour le champ `readable` et `readable_at` de l'expression.
     * @param {object} req - L'objet requête Express. `req.body` doit contenir `id` (de l'expression) et `content` (Markdown).
     * @param {object} res - L'objet réponse Express. Retourne `true` en cas de succès, `false` sinon.
     */
    saveReadable: (req, res) => dbCheck(res, () => {
        try {
            db.run(
                'UPDATE expression SET readable = ?, readable_at = ? WHERE id = ?',
                [req.body.content, (new Date()).toISOString(), req.body.id],
                err => {
                    if (err) {
                        console.log(`Error : ${err.code} on processing readable #${req.body.id}`)
                    } else {
                        const byteSize = Buffer.from(req.body.content).length
                        console.log(`Saved ${byteSize} bytes from readable #${req.body.id}`)
                        res.json(true)
                    }
                }
            )
        } catch (err) {
            console.log(`Error : undefined content for expression #${req.body.id}`)
            res.json(false)
        }
    }), // Ajout de la virgule manquante

    /**
     * API Route: /api/deleteExpression
     * Supprime une ou plusieurs expressions, ainsi que les médias et liens associés.
     * @param {object} req - L'objet requête Express. `req.query.id` peut être un ID unique ou un tableau d'IDs.
     * @param {object} res - L'objet réponse Express. Retourne `true`.
     */
    deleteExpression: (req, res) => dbCheck(res, () => {
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
    }), // Virgule déjà présente, mais vérification

    /**
     * API Route: /api/tags
     * Récupère tous les tags pour un "land" donné et les structure en arbre hiérarchique.
     * Calcule également le chemin complet (`path`) pour chaque tag.
     * @param {object} req - L'objet requête Express. `req.query.landId` doit contenir l'ID du "land".
     * @param {object} res - L'objet réponse Express. Retourne un tableau de tags structuré en arbre.
     */
    getTags: (req, res) => dbCheck(res, () => {
        const buildTagTree = rows => { // Fonction utilitaire pour construire l'arbre
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

        const sql = `WITH RECURSIVE tagPath AS (
            SELECT id,
                   name
            FROM tag
            WHERE parent_id IS NULL
            UNION ALL
            SELECT t.id,
                   p.name || ' / ' || t.name
            FROM tagPath AS p
                     JOIN tag AS t ON p.id = t.parent_id
        )
                     SELECT t.*,
                            tp.name AS path
                     FROM tag AS t
                              JOIN tagPath AS tp ON tp.id = t.id
                     WHERE land_id = ?
                     ORDER BY parent_id, sorting`

        db.all(sql, [req.query.landId], (err, rows) => {
            const response = !err ? buildTagTree(rows) : []
            res.json(response)
        })
    }), // Ajout de la virgule manquante

    /**
     * Selects all tags from land to build server-side index
     * Then walks through all GUI-side nodes to insert or update nodes and build new index
     * Then both indexes are compared so deletions can be committed
     * @param {object} req - L'objet requête Express. `req.body` doit contenir `landId` et `tags` (la structure d'arbre des tags).
     * @param {object} res - L'objet réponse Express. Retourne `true`.
     */
    setTags: (req, res) => dbCheck(res, () => {
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
                    insert.run([tag.land_id, tag.parent_id, tag.name, tag.sorting, tag.color], _ => {
                        tag.id = insert.lastID
                    })
                } else {
                    update.run([tag.parent_id, tag.name, tag.sorting, tag.color, tag.id])
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

            const deletions = prevIndex.filter(index => !nextIndex.includes(index))
            deletions.forEach(id => remove.run([id]))

            res.json(true)
        })
    }), // Ajout de la virgule manquante

    /**
     * API Route: /api/updateTag (POST)
     * Met à jour le nom et la couleur d'un tag spécifique.
     * @param {object} req - L'objet requête Express. `req.body` doit contenir `id` (du tag), `name`, et `color`.
     * @param {object} res - L'objet réponse Express. Retourne `true` ou une erreur.
     */
    updateTag: (req, res) => dbCheck(res, () => {
        const sql = `UPDATE tag
                     SET name  = ?,
                         color = ?
                     WHERE id = ?`
        db.run(sql, [req.body.name, req.body.color, req.body.id], (err) => {
            const response = !err ? true : err
            res.json(response)
        })
    }), // Virgule déjà présente, mais vérification

    /**
     * API Route: /api/taggedContent
     * Récupère le contenu taggué, soit pour une expression spécifique, soit pour un "land" entier.
     * Peut également filtrer par un tag spécifique.
     * @param {object} req - L'objet requête Express. `req.query` peut contenir `expressionId` ou `landId`, et optionnellement `tagId`.
     * @param {object} res - L'objet réponse Express. Retourne un tableau de contenus taggués.
     */
    getTaggedContent: (req, res) => dbCheck(res, () => {
        let sql,
            params = []

        if ('expressionId' in req.query) {
            sql = `SELECT tc.*
                   FROM taggedContent tc
                            JOIN tag t ON t.id = tc.tag_id
                   WHERE expression_id = ?`
            params.push(req.query.expressionId)
        } else if ('landId' in req.query) {
            sql = `SELECT tc.*
                   FROM taggedContent AS tc
                            JOIN expression AS e ON e.id = tc.expression_id
                            JOIN tag t ON t.id = tc.tag_id
                   WHERE e.land_id = ?`
            params.push(req.query.landId)
        }

        if ('tagId' in req.query) {
            sql += ` AND t.id = ?`
            params.push(req.query.tagId)
        }

        db.all(sql, params, (err, rows) => {
            const response = !err ? rows : []
            res.json(response)
        })
    }), // Ajout de la virgule manquante

    /**
     * API Route: /api/deleteTaggedContent
     * Supprime une instance spécifique de contenu taggué.
     * @param {object} req - L'objet requête Express. `req.query.id` doit contenir l'ID du contenu taggué.
     * @param {object} res - L'objet réponse Express. Retourne `true` si succès.
     */
    deleteTaggedContent: (req, res) => dbCheck(res, () => {
        const sql = `DELETE
                     FROM taggedContent
                     WHERE id = ?`
        db.run(sql, [req.query.id], err => {
            res.json(!err)
        })
    }), // Virgule déjà présente, mais vérification

    /**
     * API Route: /api/tagContent (POST) - (Nommé setTaggedContent dans le code original)
     * Crée une nouvelle instance de contenu taggué (associe un tag à un segment de texte d'une expression).
     * @param {object} req - L'objet requête Express. `req.body` doit contenir `tagId`, `expressionId`, `text`, `start`, `end`.
     * @param {object} res - L'objet réponse Express. Retourne `true` ou une erreur.
     */
    setTaggedContent: (req, res) => dbCheck(res, () => {
        const sql = 'INSERT INTO taggedContent (tag_id, expression_id, `text`,  from_char, to_char) VALUES (?, ?, ?, ?, ?)'
        db.run(sql, [req.body.tagId, req.body.expressionId, req.body.text, req.body.start, req.body.end], (err) => {
            const response = !err ? true : err
            res.json(response)
        })
    }), // Virgule déjà présente, mais vérification

    /**
     * API Route: /api/updateTagContent (POST)
     * Met à jour le tag et/ou le texte d'une instance de contenu taggué existante.
     * @param {object} req - L'objet requête Express. `req.body` doit contenir `contentId`, `tagId`, `text`.
     * @param {object} res - L'objet réponse Express. Retourne `true` ou une erreur.
     */
    updateTagContent: (req, res) => dbCheck(res, () => {
        const sql = `UPDATE taggedContent
                     SET tag_id = ?,
                         text= ?
                     WHERE id = ?`
        db.run(sql, [req.body.tagId, req.body.text, req.body.contentId], (err) => {
            const response = !err ? true : err
            res.json(response)
        })
    }), // Virgule déjà présente, mais vérification

    /**
     * API Route: /api/deleteMedia (POST)
     * Supprime un média (par URL) associé à une expression spécifique.
     * @param {object} req - L'objet requête Express. `req.body` doit contenir `url` (du média) et `expressionId`.
     * @param {object} res - L'objet réponse Express. Retourne `true` ou une erreur.
     */
    deleteMedia: (req, res) => dbCheck(res, () => {
        db.run('DELETE FROM media WHERE url = ? AND expression_id = ?', [req.body.url, req.body.expressionId], (err) => {
            const response = !err ? true : err
            res.json(response)
        })
    })
}

export default DataQueries
