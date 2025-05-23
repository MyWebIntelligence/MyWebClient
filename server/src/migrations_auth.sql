-- Création de la table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    last_session DATETIME,
    is_blocked INTEGER DEFAULT 0,
    blocked_until DATETIME,
    failed_attempts INTEGER DEFAULT 0,
    reset_token TEXT,
    reset_token_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table des logs d'accès
CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip TEXT,
    status TEXT, -- 'success', 'failure', 'blocked', etc.
    reason TEXT, -- ex: 'bad password', 'blocked', 'success'
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Index pour accélérer les recherches sur les logs
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp);
