import React, { useState } from "react"

function Login({ onLogin }) {
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

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
