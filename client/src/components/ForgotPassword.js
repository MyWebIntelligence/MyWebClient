// Fichier: client/src/components/ForgotPassword.js
// Description: Composant React pour la fonctionnalité "Mot de passe oublié".
// Permet à l'utilisateur de saisir son adresse e-mail pour recevoir un lien de réinitialisation de mot de passe.
// Gère l'état du formulaire, les appels API et l'affichage des messages de succès ou d'erreur.

import React, { useState } from 'react';

/**
 * Composant ForgotPassword.
 * Affiche un formulaire où l'utilisateur peut entrer son email pour demander
 * la réinitialisation de son mot de passe.
 * Gère l'envoi de la requête à l'API et affiche les messages correspondants.
 */
function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    /**
     * Gère la soumission du formulaire de demande de réinitialisation.
     * Envoie l'adresse e-mail à l'API /api/auth/recover.
     * Met à jour l'état pour afficher les messages de succès/erreur et l'indicateur de chargement.
     * @param {React.SyntheticEvent} e - L'événement de soumission du formulaire.
     */
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
