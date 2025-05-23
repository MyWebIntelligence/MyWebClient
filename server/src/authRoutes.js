import express from "express"
import bcrypt from "bcrypt"
import session from "express-session"
import AdminDB from "./AdminDB.js"

const router = express.Router()
const adminDB = AdminDB.connectAdminDB()

// Middleware session (à intégrer dans app.js/server.js principal)
export const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // à mettre true en prod HTTPS
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 30 // 30 jours
    }
})

// Login utilisateur
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
        // Réinitialiser compteur d'échecs, mettre à jour session
        AdminDB.resetFailedAttempts(user.id, () => {})
        req.session.userId = user.id
        AdminDB.updateLastSession(user.id, () => {})
        AdminDB.addAccessLog({ user_id: user.id, ip: req.ip, status: "success", reason: "login" }, () => {})
        res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, last_session: user.last_session } })
    })
})

// Déconnexion
router.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true })
    })
})

// Infos utilisateur courant
router.get("/me", (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Non authentifié" })
    AdminDB.findUser(req.session.userId, (err, user) => {
        if (err || !user) return res.status(404).json({ error: "Utilisateur non trouvé" })
        res.json({ id: user.id, username: user.username, role: user.role, last_session: user.last_session })
    })
})

import crypto from "crypto"
import { Resend } from "resend"

// Configuration Resend
// La clé API doit être définie dans la variable d'environnement RESEND_API_KEY.
// Exemple: export RESEND_API_KEY="votre_clé_api"
// Ou via la commande de démarrage: RESEND_API_KEY="votre_clé_api" yarn server
const resend = new Resend(process.env.RESEND_API_KEY)

// Route de demande de récupération de mot de passe
router.post("/recover", async (req, res) => {
    const { email } = req.body
    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1h
    AdminDB.setResetToken(email, token, expires, async (err) => {
        if (err) return res.status(500).json({ error: "Erreur lors de la génération du token" })

        const resetUrl = `http://localhost:3000/reset-password?token=${token}` // Modifié pour pointer vers le client React
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

// Route de soumission du nouveau mot de passe
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
