// Fichier: server/src/AdminDB.js
// Description: Ce module gère la connexion et les opérations CRUD (Create, Read, Update, Delete)
// pour la base de données SQLite `admin.db`. Cette base de données stocke les informations
// relatives aux utilisateurs (identifiants, mots de passe hashés, rôles, état de blocage),
// les logs d'accès, et les tokens de réinitialisation de mot de passe.

import sqlite from "sqlite3"
import fs from "fs" // Ajout de l'import fs
import path from "path" // Ajout de l'import path

let adminDB // Instance unique de la base de données

/**
 * Établit une connexion à la base de données admin.db ou la crée si elle n'existe pas.
 * Active les clés étrangères (foreign keys) pour assurer l'intégrité référentielle.
 * @param {string} [dbPath="admin.db"] - Le chemin vers le fichier de la base de données.
 * @returns {sqlite.Database} L'instance de la base de données connectée.
 */
const connectAdminDB = (dbPath = "admin.db") => {
    if (!adminDB) {
        adminDB = new sqlite.Database(dbPath, sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err) => {
            if (err) {
                console.error("Erreur connexion admin.db:", err.message)
            } else {
                console.log(`Connecté à la base admin.db à ${dbPath}`)
                adminDB.run('PRAGMA foreign_keys = ON', (fkErr) => {
                    if (fkErr) {
                        console.error("Erreur activation foreign keys:", fkErr.message)
                        return
                    }
                    // Exécuter les migrations
                    const migrationsPath = path.join(path.dirname(import.meta.url.replace('file://', '')), 'migrations_auth.sql')
                    fs.readFile(migrationsPath, 'utf8', (fsErr, sqlScript) => {
                        if (fsErr) {
                            console.error("Erreur lecture fichier migrations_auth.sql:", fsErr.message)
                            return
                        }
                        adminDB.exec(sqlScript, (execErr) => {
                            if (execErr) {
                                console.error("Erreur exécution migrations_auth.sql:", execErr.message)
                            } else {
                                console.log("Migrations auth exécutées avec succès.")
                            }
                        })
                    })
                })
            }
        })
    }
    return adminDB
}

/**
 * Ajoute un nouvel utilisateur à la base de données.
 * Initialise le compteur d'échecs de connexion à 0 pour le nouvel utilisateur.
 * @param {object} user - L'objet utilisateur contenant username, password_hash, email, role.
 * @param {Function} callback - Callback de la forme (err, lastID) où lastID est l'ID de l'utilisateur inséré.
 */
const addUser = (user, callback) => {
    const sql = `INSERT INTO users (username, password_hash, email, role, failed_attempts) VALUES (?, ?, ?, ?, 0)`
    adminDB.run(sql, [user.username, user.password_hash, user.email, user.role], function(err) {
        callback(err, this ? this.lastID : null)
    })
}

/**
 * Incrémente le compteur des tentatives de connexion échouées pour un utilisateur.
 * Si le nombre de tentatives atteint `maxAttempts`, l'utilisateur est bloqué pour 1 heure.
 * @param {number} userId - L'ID de l'utilisateur.
 * @param {number} [maxAttempts=5] - Le nombre maximum de tentatives échouées avant blocage.
 * @param {Function} callback - Callback de la forme (err).
 */
const incrementFailedAttempts = (userId, maxAttempts = 5, callback) => {
    const sql = `UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = ?`
    adminDB.run(sql, [userId], function(err) {
        if (err) return callback(err)
        // Vérifier si on doit bloquer
        adminDB.get(`SELECT failed_attempts FROM users WHERE id = ?`, [userId], (err2, row) => {
            if (err2) return callback(err2)
            if (row && row.failed_attempts >= maxAttempts) {
                const until = new Date(Date.now() + 60 * 60 * 1000).toISOString()
                adminDB.run(`UPDATE users SET is_blocked = 1, blocked_until = ? WHERE id = ?`, [until, userId], callback)
            } else {
                callback(null)
            }
        })
    })
}

/**
 * Réinitialise le compteur des tentatives de connexion échouées pour un utilisateur (généralement après une connexion réussie).
 * @param {number} userId - L'ID de l'utilisateur.
 * @param {Function} callback - Callback de la forme (err).
 */
const resetFailedAttempts = (userId, callback) => {
    const sql = `UPDATE users SET failed_attempts = 0 WHERE id = ?`
    adminDB.run(sql, [userId], callback)
}

/**
 * Recherche un utilisateur dans la base de données par son nom d'utilisateur (username) ou son adresse e-mail.
 * @param {string} identifier - Le nom d'utilisateur ou l'e-mail à rechercher.
 * @param {Function} callback - Callback de la forme (err, row) où row contient les données de l'utilisateur s'il est trouvé.
 */
const findUser = (identifier, callback) => {
    const sql = `SELECT * FROM users WHERE username = ? OR email = ?`
    adminDB.get(sql, [identifier, identifier], (err, row) => {
        callback(err, row)
    })
}

/**
 * Recherche un utilisateur dans la base de données par son id.
 * @param {number} id - L'id de l'utilisateur à rechercher.
 * @param {Function} callback - Callback de la forme (err, row) où row contient les données de l'utilisateur s'il est trouvé.
 */
const findUserById = (id, callback) => {
    const sql = `SELECT * FROM users WHERE id = ?`
    adminDB.get(sql, [id], callback)
}

/**
 * Met à jour l'horodatage de la dernière session de l'utilisateur.
 * @param {number} userId - L'ID de l'utilisateur.
 * @param {Function} callback - Callback de la forme (err).
 */
const updateLastSession = (userId, callback) => {
    const sql = `UPDATE users SET last_session = CURRENT_TIMESTAMP WHERE id = ?`
    adminDB.run(sql, [userId], callback)
}

/**
 * Ajoute une entrée dans les logs d'accès.
 * @param {object} log - L'objet log contenant user_id, ip, status, reason.
 * @param {Function} callback - Callback de la forme (err).
 */
const addAccessLog = (log, callback) => {
    const sql = `INSERT INTO access_logs (user_id, ip, status, reason) VALUES (?, ?, ?, ?)`
    adminDB.run(sql, [log.user_id, log.ip, log.status, log.reason], callback)
}

/**
 * Met à jour l'état de blocage d'un utilisateur et la date d'expiration du blocage.
 * @param {number} userId - L'ID de l'utilisateur.
 * @param {boolean} blocked - True pour bloquer, false pour débloquer.
 * @param {string|null} until - La date ISO jusqu'à laquelle l'utilisateur est bloqué (null si déblocage).
 * @param {Function} callback - Callback de la forme (err).
 */
const setUserBlocked = (userId, blocked, until, callback) => {
    const sql = `UPDATE users SET is_blocked = ?, blocked_until = ? WHERE id = ?`
    adminDB.run(sql, [blocked ? 1 : 0, until, userId], callback)
}

/**
 * Récupère tous les logs d'accès pour un utilisateur spécifique, triés par date décroissante.
 * @param {number} userId - L'ID de l'utilisateur.
 * @param {Function} callback - Callback de la forme (err, rows) où rows est un tableau des logs.
 */
const getAccessLogs = (userId, callback) => {
    const sql = `SELECT * FROM access_logs WHERE user_id = ? ORDER BY timestamp DESC`
    adminDB.all(sql, [userId], callback)
}

/**
 * Définit ou met à jour le token de réinitialisation de mot de passe et sa date d'expiration pour un utilisateur (identifié par email).
 * @param {string} email - L'adresse e-mail de l'utilisateur.
 * @param {string} token - Le token de réinitialisation généré.
 * @param {string} expires - La date ISO d'expiration du token.
 * @param {Function} callback - Callback de la forme (err).
 */
const setResetToken = (email, token, expires, callback) => {
    const sql = `UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?`
    adminDB.run(sql, [token, expires, email], callback)
}

/**
 * Recherche un utilisateur par un token de réinitialisation de mot de passe valide (non expiré).
 * @param {string} token - Le token de réinitialisation.
 * @param {Function} callback - Callback de la forme (err, row) où row contient les données de l'utilisateur si trouvé.
 */
const findUserByResetToken = (token, callback) => {
    const sql = `SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > CURRENT_TIMESTAMP`
    adminDB.get(sql, [token], callback)
}

/**
 * Réinitialise le mot de passe d'un utilisateur et invalide le token de réinitialisation utilisé.
 * @param {number} userId - L'ID de l'utilisateur.
 * @param {string} newHash - Le nouveau hash du mot de passe.
 * @param {Function} callback - Callback de la forme (err).
 */
const resetPassword = (userId, newHash, callback) => {
    const sql = `UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?`
    adminDB.run(sql, [newHash, userId], callback)
}

export default {
    connectAdminDB,
    addUser,
    findUser,
    findUserById,
    updateLastSession,
    addAccessLog,
    setUserBlocked,
    getAccessLogs,
    incrementFailedAttempts,
    resetFailedAttempts,
    setResetToken,
    findUserByResetToken,
    resetPassword
}
