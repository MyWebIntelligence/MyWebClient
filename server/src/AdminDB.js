import sqlite from "sqlite3"

let adminDB

// Connexion à la base admin.db
const connectAdminDB = (dbPath = "admin.db") => {
    if (!adminDB) {
        adminDB = new sqlite.Database(dbPath, sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err) => {
            if (err) {
                console.error("Erreur connexion admin.db:", err.message)
            } else {
                adminDB.run('PRAGMA foreign_keys = ON')
                console.log(`Connecté à la base admin.db`)
            }
        })
    }
    return adminDB
}

/**
 * Ajout d'un utilisateur
 * Ajoute également le champ failed_attempts (par défaut 0)
 */
const addUser = (user, callback) => {
    const sql = `INSERT INTO users (username, password_hash, email, role, failed_attempts) VALUES (?, ?, ?, ?, 0)`
    adminDB.run(sql, [user.username, user.password_hash, user.email, user.role], function(err) {
        callback(err, this ? this.lastID : null)
    })
}

/**
 * Incrémente le compteur d'échecs de connexion
 * Si le compteur atteint maxAttempts, bloque l'utilisateur pour 1h
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
 * Réinitialise le compteur d'échecs après succès
 */
const resetFailedAttempts = (userId, callback) => {
    const sql = `UPDATE users SET failed_attempts = 0 WHERE id = ?`
    adminDB.run(sql, [userId], callback)
}

// Recherche d'un utilisateur par username ou email
const findUser = (identifier, callback) => {
    const sql = `SELECT * FROM users WHERE username = ? OR email = ?`
    adminDB.get(sql, [identifier, identifier], (err, row) => {
        callback(err, row)
    })
}

// Mise à jour de la date de dernière session
const updateLastSession = (userId, callback) => {
    const sql = `UPDATE users SET last_session = CURRENT_TIMESTAMP WHERE id = ?`
    adminDB.run(sql, [userId], callback)
}

// Ajout d'un log d'accès
const addAccessLog = (log, callback) => {
    const sql = `INSERT INTO access_logs (user_id, ip, status, reason) VALUES (?, ?, ?, ?)`
    adminDB.run(sql, [log.user_id, log.ip, log.status, log.reason], callback)
}

// Blocage/déblocage utilisateur
const setUserBlocked = (userId, blocked, until, callback) => {
    const sql = `UPDATE users SET is_blocked = ?, blocked_until = ? WHERE id = ?`
    adminDB.run(sql, [blocked ? 1 : 0, until, userId], callback)
}

// Récupération des logs d'accès d'un utilisateur
const getAccessLogs = (userId, callback) => {
    const sql = `SELECT * FROM access_logs WHERE user_id = ? ORDER BY timestamp DESC`
    adminDB.all(sql, [userId], callback)
}

/**
 * Génère et stocke un token de reset pour un utilisateur (par email)
 */
const setResetToken = (email, token, expires, callback) => {
    const sql = `UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?`
    adminDB.run(sql, [token, expires, email], callback)
}

/**
 * Trouve un utilisateur par token de reset valide
 */
const findUserByResetToken = (token, callback) => {
    const sql = `SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > CURRENT_TIMESTAMP`
    adminDB.get(sql, [token], callback)
}

/**
 * Réinitialise le mot de passe et efface le token
 */
const resetPassword = (userId, newHash, callback) => {
    const sql = `UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?`
    adminDB.run(sql, [newHash, userId], callback)
}

export default {
    connectAdminDB,
    addUser,
    findUser,
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
