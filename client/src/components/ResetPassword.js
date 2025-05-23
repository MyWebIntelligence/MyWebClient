import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom'; // Remplacer useNavigate par useHistory

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

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const tokenFromQuery = queryParams.get('token');
        if (tokenFromQuery) {
            setToken(tokenFromQuery);
        } else {
            setError('Token de réinitialisation manquant ou invalide.');
        }
    }, [location]);

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
