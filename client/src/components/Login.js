// Fichier: client/src/components/Login.js
// Description: Composant React pour la fonctionnalité de connexion des utilisateurs.
// Affiche un formulaire permettant à l'utilisateur de saisir son identifiant (ou email) et son mot de passe.
// Gère l'état du formulaire, l'appel à l'API d'authentification et l'affichage des messages d'erreur.
// Exécute un callback `onLogin` en cas de succès.

import React, { useState } from "react"

/**
 * Composant Login.
 * Affiche un formulaire de connexion (identifiant/email et mot de passe).
 * Gère la soumission du formulaire, l'appel à l'API de connexion,
 * et appelle la fonction `onLogin` passée en props en cas de succès.
 * @param {object} props - Les propriétés du composant.
 * @param {Function} props.onLogin - Callback exécuté après une connexion réussie, reçoit les données utilisateur.
 */
function Login({ onLogin }) {
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    /**
     * Gère la soumission du formulaire de connexion.
     * Envoie l'identifiant et le mot de passe à l'API /api/auth/login.
     * Si la connexion est réussie, appelle `onLogin` avec les données de l'utilisateur.
     * Sinon, affiche un message d'erreur.
     * @param {React.SyntheticEvent} e - L'événement de soumission du formulaire.
     */
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password })
            })
            const data = await res.json()
            if (data.success) {
                if (data.token) {
                    localStorage.setItem("auth_token", data.token)
                }
                onLogin(data.user)
            } else {
                setError(data.error || "Erreur d'authentification")
            }
        } catch (err) {
            setError("Erreur réseau")
        }
        setLoading(false)
    }

    return (
        <div className="container" style={{ maxWidth: 400, marginTop: 100 }}>
            <h2>Connexion</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Identifiant ou email</label>
                    <input className="form-control" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Mot de passe</label>
                    <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Connexion..." : "Se connecter"}
                </button>
                <div style={{ marginTop: "15px", textAlign: "center" }}>
                    <a href="/forgot-password">Mot de passe oublié ?</a>
                </div>
            </form>
        </div>
    )
}

export default Login
