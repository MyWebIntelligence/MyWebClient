// Fichier: client/src/app/Util.js
// Description: Ce fichier fournit des fonctions utilitaires génériques
// pouvant être utilisées à travers l'application frontend.

let timer = null

/**
 * Exécute une fonction callback après un délai spécifié.
 * Si cette fonction est appelée à nouveau avant la fin du délai précédent,
 * le minuteur précédent est annulé et un nouveau est démarré.
 * Ceci est utile pour "débouncer" des actions (ex: saisie utilisateur).
 * @param {number} time - Le délai en millisecondes.
 * @param {Function} callback - La fonction à exécuter après le délai.
 * @param {*} arg - L'argument à passer à la fonction callback.
 */
const delay = (time, callback, arg) => {
    clearTimeout(timer)
    timer = setTimeout((value) => {
        callback(value)
    }, time, arg)
}

module.exports = {delay}
