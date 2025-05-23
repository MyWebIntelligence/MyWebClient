// Fichier: server/src/initAdmin.js
// Description: Ce script est responsable de l'initialisation de l'utilisateur administrateur
// au démarrage du serveur. Il vérifie si un administrateur existe déjà dans la base de données `admin.db`.
// Si ce n'est pas le cas, il en crée un avec un nom d'utilisateur "admin", un email (configurable
// via la variable d'environnement ADMIN_EMAIL), et un mot de passe.
// Le mot de passe peut être fourni via la variable d'environnement ADMIN_PASSWORD ou en argument
// de ligne de commande ; sinon, un mot de passe aléatoire sécurisé est généré.
// Le mot de passe de l'administrateur (qu'il soit fourni ou généré) est ensuite affiché
// dans la console et sauvegardé dans un fichier `admin_password.txt`.

import AdminDB from "./AdminDB.js"
import bcrypt from "bcrypt"
import crypto from "crypto"
import fs from "fs"

const adminUsername = "admin"
const adminEmail = process.env.ADMIN_EMAIL || "admin@mywebclient.local"

// Permet de passer le mot de passe en argument d'env ou ligne de commande
const argPassword = process.env.ADMIN_PASSWORD || process.argv[2] // Mot de passe admin optionnel via env/CLI

/**
 * Génère un mot de passe aléatoire et sécurisé.
 * @param {number} [length=16] - La longueur souhaitée du mot de passe.
 * @returns {string} Le mot de passe généré.
 */
function generatePassword(length = 16) {
    return crypto.randomBytes(length).toString("base64").replace(/[^a-zA-Z0-9]/g, '').slice(0, length)
}

/**
 * Affiche le mot de passe administrateur dans la console et le sauvegarde dans un fichier `admin_password.txt`.
 * @param {string} pwd - Le mot de passe de l'administrateur.
 */
function logPassword(pwd) {
    // Affiche dans la console et écrit dans un fichier temporaire
    console.log(`Mot de passe admin généré : ${pwd}`)
    fs.writeFileSync("admin_password.txt", `admin:${pwd}\n`, { flag: "w" }) // Crée/écrase le fichier avec les identifiants
}

/**
 * Vérifie si un utilisateur administrateur existe et le crée si nécessaire.
 * Utilise le nom d'utilisateur "admin" et l'email configuré.
 * Le mot de passe est soit celui fourni en argument/variable d'environnement, soit généré aléatoirement.
 * Le mot de passe est ensuite haché avant d'être stocké.
 */
function createAdminIfNeeded() {
    // S'assurer que la connexion à admin.db est initialisée
    AdminDB.connectAdminDB() // Assure que la connexion à la DB admin est prête
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
