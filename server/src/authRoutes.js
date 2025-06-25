// Fichier: server/src/authRoutes.js
// Description: Ce module définit les routes Express dédiées à l'authentification des utilisateurs.
// Il gère la connexion, la déconnexion, la vérification de l'état d'authentification,
// la demande de réinitialisation de mot de passe et la réinitialisation effective du mot de passe.
// Utilise express-session pour la gestion des sessions, bcrypt pour le hachage des mots de passe,
// et Resend pour l'envoi d'e-mails. Interagit avec AdminDB.js pour les opérations sur la base de données.

import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import AdminDB from "./AdminDB.js"

const router = express.Router() // Crée un nouveau routeur Express
const adminDB = AdminDB.connectAdminDB() // Initialise la connexion à la base de données admin

const JWT_SECRET = process.env.JWT_SECRET || "jwt_super_secret_key"
const JWT_EXPIRES_IN = "7d" // Durée de validité du token

// Suppression de la gestion de session : tout est géré par JWT désormais

/**
 * Route POST /api/auth/login
 * Gère la tentative de connexion d'un utilisateur.
 * Vérifie l'identifiant et le mot de passe, gère les tentatives échouées et le blocage de compte.
 * En cas de succès, initialise la session utilisateur et retourne les informations de l'utilisateur.
 * @param {object} req.body - Doit contenir `identifier` (username ou email) et `password`.
 * @returns {object} JSON avec `success: true` et `user` en cas de succès, ou `error` en cas d'échec.
 */
router.post("/login", (req, res) => {
    const { identifier, password } = req.body
    AdminDB.findUser(identifier, async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: "Utilisateur non trouvé" })
        }
        if (user.is_blocked && user.blocked_until && new Date(user.blocked_until) > new Date()) {
            return res.status(403).json({ error: "Compte bloqué temporairement" })
        }
        const match = await bcrypt.compare(password, user.password_hash)
        if (!match) {
            // Incrémenter compteur d'échecs, bloquer si besoin
            AdminDB.incrementFailedAttempts(user.id, 5, (err2) => {
                AdminDB.addAccessLog({ user_id: user.id, ip: req.ip, status: "failure", reason: "bad password" }, () => {})
                if (err2) {
                    return res.status(500).json({ error: "Erreur lors de la gestion du blocage" })
                }
                // Vérifier si l'utilisateur est maintenant bloqué
                AdminDB.findUser(user.id, (err3, updatedUser) => {
                    if (updatedUser && updatedUser.is_blocked && updatedUser.blocked_until && new Date(updatedUser.blocked_until) > new Date()) {
                        return res.status(403).json({ error: "Compte bloqué temporairement" })
                    }
                    return res.status(401).json({ error: "Mot de passe incorrect" })
                })
            })
            return
        }
        // Réinitialiser compteur d'échecs, générer le JWT, mettre à jour la session
        AdminDB.resetFailedAttempts(user.id, () => {})
        const payload = { id: user.id, username: user.username, role: user.role }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
        AdminDB.updateLastSession(user.id, () => {})
        AdminDB.addAccessLog({ user_id: user.id, ip: req.ip, status: "success", reason: "login" }, () => {})
        res.json({
            success: true,
            token,
            user: { id: user.id, username: user.username, role: user.role, last_session: user.last_session }
        })
    })
})

/**
 * Route POST /api/auth/logout
 * Gère la déconnexion de l'utilisateur en détruisant sa session.
 * @returns {object} JSON avec `success: true`.
 */
router.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true })
    })
})

/**
 * Route GET /api/auth/me
 * Récupère les informations de l'utilisateur actuellement authentifié via le JWT.
 * @returns {object} JSON avec les informations de l'utilisateur (id, username, role, last_session)
 * ou une erreur 401 si non authentifié, ou 404 si l'utilisateur n'est plus trouvé.
 */
router.get("/me", (req, res) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Non authentifié" })
    }
    const token = authHeader.split(" ")[1]
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        AdminDB.findUserById(decoded.id, (err, user) => {
            if (err || !user) return res.status(404).json({ error: "Utilisateur non trouvé" })
            res.json({ id: user.id, username: user.username, role: user.role, last_session: user.last_session })
        })
    } catch (e) {
        return res.status(401).json({ error: "Token invalide ou expiré" })
    }
})

import crypto from "crypto"
import { Resend } from "resend"

// Configuration Resend
// La clé API doit être définie dans la variable d'environnement RESEND_API_KEY.
// Exemple: export RESEND_API_KEY="votre_clé_api"
// Ou via la commande de démarrage: RESEND_API_KEY="votre_clé_api" yarn server
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

/**
 * Route POST /api/auth/recover
 * Gère la demande de réinitialisation de mot de passe.
 * Génère un token de réinitialisation unique et l'associe à l'email de l'utilisateur dans la base de données.
 * Envoie un e-mail à l'utilisateur contenant un lien avec ce token pour réinitialiser son mot de passe.
 * @param {object} req.body - Doit contenir `email`.
 * @returns {object} JSON avec `success: true` ou `error`.
 */
router.post("/recover", async (req, res) => {
    const { email } = req.body
    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1h
    AdminDB.setResetToken(email, token, expires, async (err) => {
        if (err) return res.status(500).json({ error: "Erreur lors de la génération du token" })

        const resetUrl = `http://localhost:3000/reset-password?token=${token}` // Modifié pour pointer vers le client React
        if (!resend) {
            // Si Resend n'est pas configuré, retournez une erreur claire ou simulez le succès pour debug local
            return res.status(501).json({ error: "Service d'envoi d'e-mail non configuré (RESEND_API_KEY manquant)" });
        }
        try {
            await resend.emails.send({
                from: "MyWebClient <no-reply@lakel.net>",
                to: email,
                subject: "Réinitialisation de votre mot de passe",
                html: `<p>Pour réinitialiser votre mot de passe, cliquez sur ce lien : <a href="${resetUrl}">${resetUrl}</a> (valable 1h)</p>`
            })
            res.json({ success: true })
        } catch (e) {
            console.error("Erreur Resend:", e)
            res.status(500).json({ error: "Erreur lors de l'envoi de l'email" })
        }
    })
})

/**
 * Route POST /api/auth/reset
 * Gère la soumission d'un nouveau mot de passe après qu'un utilisateur a cliqué sur le lien de réinitialisation.
 * Vérifie la validité du token, la complexité du nouveau mot de passe, puis met à jour le mot de passe
 * de l'utilisateur dans la base de données et invalide le token.
 * @param {object} req.body - Doit contenir `token` (le token de réinitialisation) et `newPassword`.
 * @returns {object} JSON avec `success: true` ou `error`.
 */
router.post("/reset", async (req, res) => {
    const { token, newPassword } = req.body
    if (!token || !newPassword) return res.status(400).json({ error: "Token ou mot de passe manquant" })
    // Politique de mot de passe : min 8, maj, min, chiffre, spécial
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
    if (!regex.test(newPassword)) return res.status(400).json({ error: "Mot de passe trop faible" })
    AdminDB.findUserByResetToken(token, async (err, user) => {
        if (err || !user) return res.status(400).json({ error: "Token invalide ou expiré" })
        const hash = await bcrypt.hash(newPassword, 10)
        AdminDB.resetPassword(user.id, hash, (err2) => {
            if (err2) {
                console.error("Erreur AdminDB.resetPassword:", err2); // Ajout du log de l'erreur
                return res.status(500).json({ error: "Erreur lors de la réinitialisation" });
            }
            res.json({ success: true })
        })
    })
})

export default router
