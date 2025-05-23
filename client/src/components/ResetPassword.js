// Fichier: client/src/components/ResetPassword.js
// Description: Composant React pour la fonctionnalité de réinitialisation de mot de passe.
// Permet à l'utilisateur de définir un nouveau mot de passe après avoir validé un token reçu par e-mail.
// Gère l'extraction du token de l'URL, la validation du nouveau mot de passe, l'appel à l'API
// et l'affichage des messages de succès ou d'erreur.

import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom'; // Remplacer useNavigate par useHistory

/**
 * Composant ResetPassword.
 * Affiche un formulaire où l'utilisateur peut saisir et confirmer son nouveau mot de passe.
 * Le token de réinitialisation est récupéré depuis les paramètres de l'URL.
 * Gère la soumission du formulaire, la validation des mots de passe, l'appel à l'API
 * et la redirection vers la page de connexion en cas de succès.
 */
function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');

    const location = useLocation();
    const history = useHistory(); // Initialiser useHistory

    // Effet pour extraire le token de réinitialisation des paramètres de l'URL au chargement du composant.
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tokenFromQuery = queryParams.get('token');
        if (tokenFromQuery) {
            setToken(tokenFromQuery);
        } else {
            setError('Token de réinitialisation manquant ou invalide.');
        }
    }, [location]);

    /**
     * Gère la soumission du formulaire de réinitialisation de mot de passe.
     * Vérifie que les mots de passe correspondent et respectent les critères de complexité.
     * Envoie le token et le nouveau mot de passe à l'API /api/auth/reset.
     * Affiche les messages de succès/erreur et redirige vers la connexion si succès.
     * @param {React.SyntheticEvent} e - L'événement de soumission du formulaire.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        // Ajout d'une validation basique de la force du mot de passe (exemple)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!passwordRegex.test(password)) {
            setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/auth/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setMessage('Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.');
                // Rediriger vers la page de connexion après un court délai
                setTimeout(() => {
                    history.push('/login'); // Utiliser history.push pour la redirection
                }, 3000);
            } else {
                setError(data.error || 'Erreur lors de la réinitialisation du mot de passe.');
            }
        } catch (err) {
            setError('Erreur réseau. Veuillez réessayer.');
        }
        setLoading(false);
    };

    /**
     * Bascule la visibilité du mot de passe dans les champs de saisie.
     */
    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="container" style={{ maxWidth: 400, marginTop: 100 }}>
            <h2>Réinitialiser le mot de passe</h2>
            {token ? (
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nouveau mot de passe</label>
                        <div className="input-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <div className="input-group-append">
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onMouseDown={toggleShowPassword}
                                    onMouseUp={toggleShowPassword}
                                    onTouchStart={toggleShowPassword}
                                    onTouchEnd={toggleShowPassword}
                                >
                                    {showPassword ? 'Cacher' : 'Voir'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Confirmer le nouveau mot de passe</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className="form-control"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    {message && <div className="alert alert-success">{message}</div>}
                    {error && <div className="alert alert-danger">{error}</div>}
                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
                    </button>
                </form>
            ) : (
                <div className="alert alert-danger">
                    {error || 'Token invalide ou expiré.'}
                </div>
            )}
             <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <a href="/login">Retour à la connexion</a>
            </div>
        </div>
    );
}

export default ResetPassword;
