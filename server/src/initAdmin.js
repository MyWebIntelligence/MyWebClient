import AdminDB from "./AdminDB.js"
import bcrypt from "bcrypt"
import crypto from "crypto"
import fs from "fs"

const adminUsername = "admin"
const adminEmail = process.env.ADMIN_EMAIL || "admin@mywebclient.local"

// Permet de passer le mot de passe en argument d'env ou ligne de commande
const argPassword = process.env.ADMIN_PASSWORD || process.argv[2]

// Génère un mot de passe fort aléatoire
function generatePassword(length = 16) {
    return crypto.randomBytes(length).toString("base64").replace(/[^a-zA-Z0-9]/g, '').slice(0, length)
}

function logPassword(pwd) {
    // Affiche dans la console et écrit dans un fichier temporaire
    console.log(`Mot de passe admin généré : ${pwd}`)
    fs.writeFileSync("admin_password.txt", `admin:${pwd}\n`, { flag: "w" })
}

function createAdminIfNeeded() {
    // S'assurer que la connexion à admin.db est initialisée
    AdminDB.connectAdminDB()
    AdminDB.findUser(adminUsername, async (err, user) => {
        if (user) {
            // Admin déjà existant, rien à faire
            return
        }
        const password = argPassword || generatePassword()
        const hash = await bcrypt.hash(password, 10)
        AdminDB.addUser({
            username: adminUsername,
            password_hash: hash,
            email: adminEmail,
            role: "admin"
        }, (err2, id) => {
            if (!err2 && id) {
                logPassword(password)
            } else if (err2) {
                console.error("Erreur création admin :", err2)
            }
        })
    })
}

createAdminIfNeeded()
