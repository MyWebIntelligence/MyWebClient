import React, { useState } from 'react';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch('/api/auth/recover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setMessage('Si un compte est associé à cet email, un lien de réinitialisation a été envoyé.');
                setEmail('');
            } else {
                setError(data.error || 'Erreur lors de la demande de réinitialisation.');
            }
        } catch (err) {
            setError('Erreur réseau. Veuillez réessayer.');
        }
        setLoading(false);
    };

    return (
        <div className="container" style={{ maxWidth: 400, marginTop: 100 }}>
            <h2>Mot de passe oublié</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Adresse e-mail</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}
                <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                </button>
            </form>
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <a href="/login">Retour à la connexion</a>
            </div>
        </div>
    );
}

export default ForgotPassword;
