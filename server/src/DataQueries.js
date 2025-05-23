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
 * Valide et normalise une colonne de tri pour éviter les injections SQL
 * @param {string} column - Nom de la colonne
 * @returns {string} Nom de colonne validé
 */
const validateSortColumn = (column) => {
    const allowedColumns = ['e.id', 'e.title', 'e.relevance', 'e.depth', 'd.name']; // Ajoutez d'autres colonnes valides si nécessaire
    return allowedColumns.includes(column) ? column : 'e.id'; // Colonne par défaut sécurisée
}

/**
 * Récupère l'ID de l'expression précédente ou suivante dans un "land" donné,
 * en fonction des critères de tri et de filtrage actuels.
 * @param {number} offset - -1 pour l'expression précédente, 1 pour la suivante.
 * @param {object} req - L'objet requête Express, contenant les paramètres dans req.query (landId, minRelevance, maxDepth, id, sortColumn, sortOrder).
 * @param {object} res - L'objet réponse Express.
 */
const getSiblingExpression = (offset, req, res) => {
    // Validation des paramètres requis
    if (!req.query.id || !req.query.landId) {
        console.error("Missing required parameters for getSiblingExpression: id or landId");
        res.status(400).json({ error: "Missing required parameters: id and landId are required" });
        return;
    }

    const params = [
        parseInt(req.query.landId),
        parseFloat(req.query.minRelevance) || 0,
        parseInt(req.query.maxDepth) || 3,
        parseInt(req.query.id)
    ]

    // Validation des paramètres
    if (params.some(p => isNaN(p))) {
        console.error("Invalid parameters for getSiblingExpression:", req.query);
        res.status(400).json({ error: "Invalid parameters - all values must be numeric" });
        return;
    }

    const column = validateSortColumn(req.query.sortColumn || 'e.id');
    const order = parseInt(req.query.sortOrder) === 1 ? 'ASC' : 'DESC';
    // Pour LEAD, le deuxième argument est le nombre de lignes à avancer. 
    // Si offset est -1 (précédent), on veut avancer de 1 dans l'ordre inverse.
    // SQLite ne supporte pas LAG directement avec un offset négatif pour LEAD de cette manière.
    // La logique correcte est d'inverser l'ordre de tri pour "prev" et d'utiliser LEAD avec 1.
    // Cependant, la requête originale utilise LEAD(e.id, ${offset}, ...) ce qui est incorrect pour -1.
    // Une approche plus simple est de garder l'offset positif et de gérer la direction avec ORDER BY.
    // Mais la requête originale semble vouloir utiliser l'offset directement.
    // Pour LEAD, l'offset doit être positif. Si on veut "précédent", il faut inverser l'ordre et prendre le premier.
    // La requête actuelle avec GROUP BY e.id et LEAD/LAG dans une sous-requête est complexe.
    // Simplifions ou corrigeons la logique de LEAD/LAG si possible, ou assurons-nous que l'offset est toujours positif.
    // La requête originale utilise `LEAD(e.id, ${offset}, NULL)`. Si offset est -1, cela ne fonctionnera pas comme attendu.
    // Il est probable que l'intention était d'utiliser LAG pour offset=-1 ou de changer l'ordre.
    // Pour l'instant, on va s'assurer que l'offset pour LEAD est positif.
    const leadOffset = offset < 0 ? 1 : offset; // Assure un offset positif pour LEAD
    const effectiveOrder = offset < 0 ? (order === 'ASC' ? 'DESC' : 'ASC') : order; // Inverse l'ordre pour "précédent"

    const sql = `SELECT sibling
                     FROM (
                          SELECT e.id,
                                 LEAD(e.id, ${leadOffset}, NULL) OVER (ORDER BY ${column} ${effectiveOrder}) AS sibling
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

    console.log("Executing getSiblingExpression with params:", params, "SQL:", sql);
    db.get(sql, params, (err, row) => {
        if (err) {
            console.error("Error in getSiblingExpression query:", err.message);
            console.error("SQL:", sql);
            console.error("Params:", params);
            res.status(500).json({ error: "Database error in getSiblingExpression", details: err.message });
            return;
        }
        const response = row ? row.sibling : null;
        console.log("getSiblingExpression result:", response);
        res.json(response);
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
    try {
        return callback();
    } catch (error) {
        console.error("Error in dbCheck callback execution:", error);
        if (res && typeof res.status === 'function') {
            res.status(500).json({ error: "Internal server error during database operation", details: error.message });
        }
        return false;
    }
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
        if (!req.query.db) {
            console.error("Missing db path for connect");
            res.status(400).json({ error: "Missing required parameter: db" });
            return;
        }
        const normPath = (filename) => filename.replace(/\\/g, '/') // Normalise les chemins pour Windows
        db = new sqlite.Database(normPath(req.query.db), sqlite.OPEN_READWRITE, (err) => {
            if (err) {
                console.error("Database connection error:", err.message);
                res.json(false); // Ne pas envoyer de statut 500 ici, le client gère `false`
            } else {
                db.run('PRAGMA foreign_keys = ON'); // Active le support des clés étrangères
                console.log(`Connected to ${req.query.db}`);
                res.json(true);
            }
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
                res.status(500).json({ error: "Database error in getLands", details: err.message });
            } else {
                res.json(rows || []);
            }
        })
    }),

    /**
     * API Route: /api/land
     * Récupère les détails d'un "land" spécifique, y compris le nombre d'expressions
     * correspondant aux filtres de pertinence et de profondeur.
     * @param {object} req - L'objet requête Express. `req.query` doit contenir `id` (du land),
     *                       et optionnellement `minRelevance` et `maxDepth`.
     * @param {object} res - L'objet réponse Express. Retourne un objet land détaillé ou `false` en cas d'erreur.
     */
    getLand: (req, res) => dbCheck(res, () => {
        if (!req.query.id) {
            console.error("Missing id for getLand");
            res.status(400).json({ error: "Missing required parameter: id" });
            return;
        }

        const landId = parseInt(req.query.id);
        const minRelevance = parseFloat(req.query.minRelevance) || 0;
        const maxDepth = parseInt(req.query.maxDepth) || 3;

        if (isNaN(landId) || isNaN(minRelevance) || isNaN(maxDepth)) {
            console.error("Invalid parameters for getLand:", req.query);
            res.status(400).json({ error: "Invalid parameters - id, minRelevance, maxDepth must be numeric" });
            return;
        }
        
        const params = [landId, minRelevance, maxDepth, landId];


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
                     WHERE l.id = ?`

        db.get(sql, params, (err, row) => {
            if (err) {
                console.error("Error in getLand query:", err.message);
                res.status(500).json({ error: "Database error in getLand", details: err.message });
            } else {
                res.json(row || false); 
            }
        })
    }),

    /**
     * API Route: /api/expressions
     * Récupère une liste paginée et triée d'expressions pour un "land" donné,
     * en appliquant les filtres de pertinence et de profondeur.
     * @param {object} req - L'objet requête Express. `req.query` doit contenir `landId`,
     *                       et optionnellement `minRelevance`, `maxDepth`, `offset`, `limit`, `sortColumn`, `sortOrder`.
     * @param {object} res - L'objet réponse Express. Retourne un tableau d'objets expression.
     */
    getExpressions: (req, res) => dbCheck(res, () => {
        if (!req.query.landId) {
            console.error("Missing landId for getExpressions");
            res.status(400).json({ error: "Missing required parameter: landId" });
            return;
        }

        const params = [
            parseInt(req.query.landId),
            parseFloat(req.query.minRelevance) || 0,
            parseInt(req.query.maxDepth) || 3,
            parseInt(req.query.offset) || 0,
            parseInt(req.query.limit) || 50,
        ]

        if (params.some(p => isNaN(p))) {
            console.error("Invalid parameters for getExpressions:", req.query);
            res.status(400).json({ error: "Invalid parameters for getExpressions" });
            return;
        }

        const column = validateSortColumn(req.query.sortColumn || 'e.id');
        const order = parseInt(req.query.sortOrder) === 1 ? 'ASC' : 'DESC';

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
                     WHERE e.land_id = ?
                       AND e.http_status = 200
                       AND e.relevance >= ?
                       AND e.depth <= ?
                     GROUP BY e.id
                     ORDER BY ${column} ${order}
                     LIMIT ?, ?`
        
        console.log("Executing getExpressions query:", sql, "with params:", params);
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error("Error in getExpressions query:", err.message);
                res.status(500).json({ error: "Database error in getExpressions", details: err.message });
            } else {
                console.log("getExpressions query result count:", rows ? rows.length : 0);
                res.json(rows || []);
            }
        })
    }),

    /**
     * API Route: /api/domain
     * Récupère les détails d'un domaine spécifique, y compris le nombre total d'expressions associées.
     * @param {object} req - L'objet requête Express. `req.query.id` doit contenir l'ID du domaine.
     * @param {object} res - L'objet réponse Express. Retourne un objet domaine détaillé ou `null` en cas d'erreur.
     */
    getDomain: (req, res) => dbCheck(res, () => {
        if (!req.query.id) {
            console.error("Missing id for getDomain");
            res.status(400).json({ error: "Missing required parameter: id" });
            return;
        }
        const domainId = parseInt(req.query.id);
        if (isNaN(domainId)) {
            console.error("Invalid id for getDomain:", req.query.id);
            res.status(400).json({ error: "Invalid parameter: id must be a number" });
            return;
        }

        const sql = `SELECT d.id,
                            d.name,
                            d.title,
                            d.description,
                            d.keywords,
                            COUNT(e.id) AS expressionCount
                     FROM domain AS d
                              LEFT JOIN expression AS e ON e.domain_id = d.id 
                     WHERE d.id = ?
                     GROUP BY d.id`

        db.get(sql, [domainId], (err, row) => {
            if (err) {
                console.error("Error in getDomain query:", err.message);
                res.status(500).json({ error: "Database error in getDomain", details: err.message });
            } else {
                res.json(row || null);
            }
        })
    }),

    /**
     * API Route: /api/expression
     * Récupère les détails complets d'une expression spécifique, y compris son domaine associé et ses images.
     * @param {object} req - L'objet requête Express. `req.query.id` doit contenir l'ID de l'expression.
     * @param {object} res - L'objet réponse Express. Retourne un objet expression détaillé ou `null` en cas d'erreur.
     */
    getExpression: (req, res) => dbCheck(res, () => {
        if (!req.query.id) {
            console.error("Missing id for getExpression");
            res.status(400).json({ error: "Missing required parameter: id" });
            return;
        }

        const expressionId = parseInt(req.query.id);
        if (isNaN(expressionId)) {
            console.error("Invalid id for getExpression:", req.query.id);
            res.status(400).json({ error: "Invalid parameter: id must be a number" });
            return;
        }

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
                     WHERE e.id = ?
                     GROUP BY e.id`

        console.log("Executing getExpression with id:", expressionId);
        db.get(sql, [expressionId], (err, row) => {
            if (err) {
                console.error("Error in getExpression query:", err.message);
                console.error("Expression ID:", expressionId);
                res.status(500).json({ error: "Database error in getExpression", details: err.message });
            } else {
                console.log("getExpression result:", row ? "found" : "not found");
                res.json(row || null);
            }
        })
    }),

    getPrevExpression: (req, res) => dbCheck(res, () => {
        getSiblingExpression(-1, req, res)
    }),

    getNextExpression: (req, res) => dbCheck(res, () => {
        getSiblingExpression(1, req, res)
    }),

    getReadable: (req, res) => dbCheck(res, () => {
        if (!req.query.id) {
            console.error("Missing id for getReadable");
            res.status(400).json({ error: "Missing required parameter: id" });
            return;
        }
        const expressionId = parseInt(req.query.id);
        if (isNaN(expressionId)) {
            console.error("Invalid id for getReadable:", req.query.id);
            res.status(400).json({ error: "Invalid parameter: id must be a number" });
            return;
        }

        const sql = `SELECT e.id, e.url FROM expression AS e WHERE id = ?`

        db.get(sql, [expressionId], (err, row) => {
            if (err) {
                console.error("Error in getReadable (SQL query):", err.message);
                res.status(500).json({ error: "Database error in getReadable", details: err.message });
                return;
            }

            if (row && row.url) {
                try {
                    Mercury.parse(row.url, { contentType: 'markdown' })
                        .then(result => { res.json(result.content); })
                        .catch(mercuryErr => {
                            console.error("Mercury parser error for URL", row.url, ":", mercuryErr);
                            res.status(500).json({ error: "Error parsing content with Mercury", details: mercuryErr.message });
                        });
                } catch (parseErr) {
                    console.error("Exception during Mercury.parse call for URL", row.url, ":", parseErr);
                    res.status(500).json({ error: "Exception during content parsing", details: parseErr.message });
                }
            } else {
                res.json(null); 
            }
        })
    }),

    saveReadable: (req, res) => dbCheck(res, () => {
        if (!req.body.id || req.body.content === undefined) {
            console.error("Missing id or content for saveReadable");
            res.status(400).json({ error: "Missing required parameters: id and content" });
            return;
        }
        const expressionId = parseInt(req.body.id);
        if (isNaN(expressionId)) {
            console.error("Invalid id for saveReadable:", req.body.id);
            res.status(400).json({ error: "Invalid parameter: id must be a number" });
            return;
        }

        try {
            db.run(
                'UPDATE expression SET readable = ?, readable_at = ? WHERE id = ?',
                [req.body.content, (new Date()).toISOString(), expressionId],
                function(err) { 
                    if (err) {
                        console.error(`Error : ${err.message} on processing readable #${expressionId}`);
                        res.status(500).json({ error: "Database error in saveReadable", details: err.message });
                    } else if (this.changes === 0) {
                        console.warn(`No rows updated for saveReadable on expression #${expressionId}. It might not exist.`);
                        res.status(404).json({ error: `Expression with id ${expressionId} not found for saving readable content.` });
                    }
                    else {
                        const byteSize = Buffer.from(req.body.content).length;
                        console.log(`Saved ${byteSize} bytes from readable #${expressionId}`);
                        res.json(true);
                    }
                }
            )
        } catch (err) { 
            console.error(`Exception in saveReadable for expression #${expressionId}:`, err);
            res.status(500).json({ error: "Server exception during saveReadable", details: err.message });
        }
    }),

    deleteExpression: (req, res) => dbCheck(res, () => {
        if (!req.query.id) {
            console.error("Missing id for deleteExpression");
            res.status(400).json({ error: "Missing required parameter: id" });
            return;
        }
        const ids = Array.isArray(req.query.id) ? req.query.id.map(id => parseInt(id)) : [parseInt(req.query.id)];
        if (ids.some(id => isNaN(id))) {
            console.error("Invalid id(s) for deleteExpression:", req.query.id);
            res.status(400).json({ error: "Invalid parameter: id(s) must be numeric" });
            return;
        }

        db.serialize(() => {
            const idPlaceholders = placeholders(ids);
            db.run(`DELETE FROM expression WHERE id IN (${idPlaceholders})`, ids, function(err) {
                if (err) console.error("Error deleting from expression:", err.message);
                else console.log(`Deleted ${this.changes} rows from expression`);
            });
            db.run(`DELETE FROM media WHERE expression_id IN (${idPlaceholders})`, ids, function(err) {
                if (err) console.error("Error deleting from media:", err.message);
                else console.log(`Deleted ${this.changes} rows from media`);
            });
            const paramsForExpressionLink = [...ids, ...ids];
            const sourcePlaceholders = placeholders(ids);
            const targetPlaceholders = placeholders(ids);
            db.run(`DELETE FROM expressionlink WHERE source_id IN (${sourcePlaceholders}) OR target_id IN (${targetPlaceholders})`, paramsForExpressionLink, function(err) {
                if (err) console.error("Error deleting from expressionlink:", err.message);
                else console.log(`Deleted ${this.changes} rows from expressionlink`);
            });
        })
        return res.json(true); 
    }),

    getTags: (req, res) => dbCheck(res, () => {
        if (!req.query.landId) {
            console.error("Missing landId for getTags");
            res.status(400).json({ error: "Missing required parameter: landId" });
            return;
        }
        const landId = parseInt(req.query.landId);
        if (isNaN(landId)) {
            console.error("Invalid landId for getTags:", req.query.landId);
            res.status(400).json({ error: "Invalid parameter: landId must be a number" });
            return;
        }

        const buildTagTree = rows => {
            const tree = []
            const lookup = {}
            rows.forEach((r) => {
                lookup[r.id] = { ...r, children: [] , expanded: true }; 
            })
            rows.forEach((r) => {
                if (r.parent_id !== null && lookup[r.parent_id]) { 
                    lookup[r.parent_id].children.push(lookup[r.id])
                } else {
                    tree.push(lookup[r.id])
                }
            })
            return tree
        }

        const sql = `WITH RECURSIVE tagPath(id, name, path, parent_id, sorting, color, land_id_rec) AS (
            SELECT id, name, name, parent_id, sorting, color, land_id
            FROM tag
            WHERE parent_id IS NULL AND land_id = ?
            UNION ALL
            SELECT t.id, t.name, tp.path || ' / ' || t.name, t.parent_id, t.sorting, t.color, t.land_id
            FROM tag AS t
            JOIN tagPath AS tp ON t.parent_id = tp.id
            WHERE t.land_id = ?
        )
        SELECT t.*, tp.path FROM tag AS t JOIN tagPath AS tp ON tp.id = t.id WHERE t.land_id = ? ORDER BY t.parent_id, t.sorting`;


        db.all(sql, [landId, landId, landId], (err, rows) => { 
            if (err) {
                console.error("Error in getTags query:", err.message);
                res.status(500).json({ error: "Database error in getTags", details: err.message });
            } else {
                res.json(buildTagTree(rows || []));
            }
        })
    }),

    setTags: (req, res) => dbCheck(res, () => {
        if (!req.body.landId || !req.body.tags) {
            console.error("Missing landId or tags for setTags");
            res.status(400).json({ error: "Missing required parameters: landId and tags" });
            return;
        }
        const landId = parseInt(req.body.landId);
        if (isNaN(landId)) {
            console.error("Invalid landId for setTags:", req.body.landId);
            res.status(400).json({ error: "Invalid parameter: landId must be a number" });
            return;
        }

        const insert = db.prepare("INSERT INTO tag (land_id, parent_id, name, sorting, color) VALUES (?, ?, ?, ?, ?)")
        const update = db.prepare("UPDATE tag SET parent_id = ?, name = ?, sorting = ?, color = ? WHERE id = ?")
        const remove = db.prepare("DELETE FROM tag WHERE id = ?")

        db.all('SELECT id FROM tag WHERE land_id = ?', [landId], (err, currentDbRows) => {
            if (err) {
                console.error("Error fetching current tags in setTags:", err.message);
                res.status(500).json({ error: "Database error fetching current tags", details: err.message });
                return;
            }

            const prevIndex = currentDbRows.map(row => row.id)
            let nextIndex = [] // Doit être let pour être modifiable
            
            const processTagsRecursive = (tags, parentId) => {
                tags.forEach((tag, index) => {
                    let currentTagId = tag.id; 
                    const tagData = [
                        landId,
                        parentId,
                        tag.name,
                        index, 
                        tag.color
                    ];

                    if (currentTagId && prevIndex.includes(currentTagId)) { 
                        update.run([...tagData.slice(1), currentTagId], function(updateErr) { 
                            if (updateErr) console.error("Error updating tag:", updateErr.message, tag);
                        });
                        nextIndex.push(currentTagId);
                    } else { 
                        insert.run(tagData, function(insertErr) {
                            if (insertErr) console.error("Error inserting tag:", insertErr.message, tag);
                            else if (this.lastID) {
                                currentTagId = this.lastID; // Mettre à jour currentTagId pour les enfants
                                nextIndex.push(this.lastID);
                            }
                        });
                    }
                    if (tag.children && tag.children.length > 0) {
                        processTagsRecursive(tag.children, currentTagId); 
                    }
                });
            };
            
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");
                processTagsRecursive(req.body.tags, null);

                insert.finalize(err => { if(err) console.error("Finalize insert error:", err.message)});
                update.finalize(err => { if(err) console.error("Finalize update error:", err.message)});

                const deletions = prevIndex.filter(id => !nextIndex.includes(id));
                deletions.forEach(id => {
                    remove.run([id], function(removeErr) {
                        if (removeErr) console.error("Error removing tag:", removeErr.message, id);
                    });
                });
                remove.finalize(err => { if(err) console.error("Finalize remove error:", err.message)});
                
                db.run("COMMIT", commitErr => {
                    if (commitErr) {
                        console.error("Error committing setTags transaction:", commitErr.message);
                        db.run("ROLLBACK"); 
                        res.status(500).json({ error: "Database error committing tags", details: commitErr.message });
                    } else {
                        res.json(true);
                    }
                });
            });
        })
    }),

    updateTag: (req, res) => dbCheck(res, () => {
        if (!req.body.id || req.body.name === undefined || req.body.color === undefined) { 
            console.error("Missing parameters for updateTag");
            res.status(400).json({ error: "Missing required parameters: id, name, and color" });
            return;
        }
        const tagId = parseInt(req.body.id);
        if (isNaN(tagId)) {
            console.error("Invalid id for updateTag:", req.body.id);
            res.status(400).json({ error: "Invalid parameter: id must be a number" });
            return;
        }

        const sql = `UPDATE tag SET name  = ?, color = ? WHERE id = ?`
        db.run(sql, [req.body.name, req.body.color, tagId], function(err) {
            if (err) {
                console.error("Error in updateTag query:", err.message);
                res.status(500).json({ error: "Database error in updateTag", details: err.message });
            } else if (this.changes === 0) {
                console.warn(`No tag found with id ${tagId} to update.`);
                res.status(404).json({ error: `Tag with id ${tagId} not found.` });
            }
            else {
                res.json(true);
            }
        })
    }),

    getTaggedContent: (req, res) => dbCheck(res, () => {
        let sql, params = [];
        let hasKeyParam = false;

        if ('expressionId' in req.query) {
            const expressionId = parseInt(req.query.expressionId);
            if (isNaN(expressionId)) {
                res.status(400).json({ error: "Invalid parameter: expressionId must be a number" }); return;
            }
            sql = `SELECT tc.* FROM taggedContent tc JOIN tag t ON t.id = tc.tag_id WHERE tc.expression_id = ?`;
            params.push(expressionId);
            hasKeyParam = true;
        } else if ('landId' in req.query) {
            const landId = parseInt(req.query.landId);
            if (isNaN(landId)) {
                res.status(400).json({ error: "Invalid parameter: landId must be a number" }); return;
            }
            sql = `SELECT tc.* FROM taggedContent AS tc JOIN expression AS e ON e.id = tc.expression_id JOIN tag t ON t.id = tc.tag_id WHERE e.land_id = ?`;
            params.push(landId);
            hasKeyParam = true;
        }
        
        if (!hasKeyParam) {
            res.status(400).json({ error: "Missing required parameter: expressionId or landId" });
            return;
        }

        if ('tagId' in req.query) {
            const tagId = parseInt(req.query.tagId);
            if (isNaN(tagId)) {
                res.status(400).json({ error: "Invalid parameter: tagId must be a number" }); return;
            }
            sql += ` AND t.id = ?`;
            params.push(tagId);
        }

        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error("Error in getTaggedContent query:", err.message);
                res.status(500).json({ error: "Database error in getTaggedContent", details: err.message });
            } else {
                res.json(rows || []);
            }
        })
    }),

    deleteTaggedContent: (req, res) => dbCheck(res, () => {
        if (!req.query.id) {
            console.error("Missing id for deleteTaggedContent");
            res.status(400).json({ error: "Missing required parameter: id" });
            return;
        }
        const taggedContentId = parseInt(req.query.id);
        if (isNaN(taggedContentId)) {
            console.error("Invalid id for deleteTaggedContent:", req.query.id);
            res.status(400).json({ error: "Invalid parameter: id must be a number" });
            return;
        }

        const sql = `DELETE FROM taggedContent WHERE id = ?`
        db.run(sql, [taggedContentId], function(err) {
            if (err) {
                console.error("Error in deleteTaggedContent query:", err.message);
                res.status(500).json({ error: "Database error in deleteTaggedContent", details: err.message });
            } else if (this.changes === 0) {
                console.warn(`No taggedContent found with id ${taggedContentId} to delete.`);
                res.status(404).json({ error: `TaggedContent with id ${taggedContentId} not found.` });
            }
             else {
                res.json(true);
            }
        })
    }),

    setTaggedContent: (req, res) => dbCheck(res, () => {
        const { tagId, expressionId, text, start, end } = req.body;
        if (tagId === undefined || expressionId === undefined || text === undefined || start === undefined || end === undefined) {
            console.error("Missing parameters for setTaggedContent:", req.body);
            res.status(400).json({ error: "Missing required parameters: tagId, expressionId, text, start, end" });
            return;
        }
        const pTagId = parseInt(tagId);
        const pExpressionId = parseInt(expressionId);
        const pStart = parseInt(start);
        const pEnd = parseInt(end);

        if (isNaN(pTagId) || isNaN(pExpressionId) || isNaN(pStart) || isNaN(pEnd)) {
            console.error("Invalid numeric parameters for setTaggedContent:", req.body);
            res.status(400).json({ error: "Invalid parameters: tagId, expressionId, start, end must be numeric" });
            return;
        }

        const sql = 'INSERT INTO taggedContent (tag_id, expression_id, `text`,  from_char, to_char) VALUES (?, ?, ?, ?, ?)'
        db.run(sql, [pTagId, pExpressionId, text, pStart, pEnd], function(err) { 
            if (err) {
                console.error("Error in setTaggedContent query:", err.message);
                res.status(500).json({ error: "Database error in setTaggedContent", details: err.message });
            } else {
                res.status(201).json({ id: this.lastID, message: "Tagged content created successfully" });
            }
        })
    }),

    updateTagContent: (req, res) => dbCheck(res, () => {
        const { contentId, tagId, text } = req.body;
        if (contentId === undefined || tagId === undefined || text === undefined) {
            console.error("Missing parameters for updateTagContent:", req.body);
            res.status(400).json({ error: "Missing required parameters: contentId, tagId, text" });
            return;
        }
        const pContentId = parseInt(contentId);
        const pTagId = parseInt(tagId);

        if (isNaN(pContentId) || isNaN(pTagId)) {
            console.error("Invalid numeric parameters for updateTagContent:", req.body);
            res.status(400).json({ error: "Invalid parameters: contentId and tagId must be numeric" });
            return;
        }

        const sql = `UPDATE taggedContent SET tag_id = ?, text = ? WHERE id = ?`
        db.run(sql, [pTagId, text, pContentId], function(err) {
            if (err) {
                console.error("Error in updateTagContent query:", err.message);
                res.status(500).json({ error: "Database error in updateTagContent", details: err.message });
            } else if (this.changes === 0) {
                console.warn(`No taggedContent found with id ${pContentId} to update.`);
                res.status(404).json({ error: `TaggedContent with id ${pContentId} not found.` });
            }
            else {
                res.json(true);
            }
        })
    }),

    deleteMedia: (req, res) => dbCheck(res, () => {
        if (!req.body.url || !req.body.expressionId) {
            console.error("Missing url or expressionId for deleteMedia:", req.body);
            res.status(400).json({ error: "Missing required parameters: url and expressionId" });
            return;
        }
        const expressionId = parseInt(req.body.expressionId);
        if (isNaN(expressionId)) {
            console.error("Invalid expressionId for deleteMedia:", req.body.expressionId);
            res.status(400).json({ error: "Invalid parameter: expressionId must be a number" });
            return;
        }

        db.run('DELETE FROM media WHERE url = ? AND expression_id = ?', [req.body.url, expressionId], function(err) {
            if (err) {
                console.error("Error in deleteMedia query:", err.message);
                res.status(500).json({ error: "Database error in deleteMedia", details: err.message });
            } else if (this.changes === 0) {
                console.warn(`No media found with url ${req.body.url} for expression ${expressionId} to delete.`);
                res.status(404).json({ error: `Media not found for deletion.` });
            }
            else {
                res.json(true);
            }
        })
    })
}

export default DataQueries
