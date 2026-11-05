-- ============================================================
-- Modelo Relacional PostgreSQL: API Financiera (Tarjetas de Crédito)
-- Relación 1:N -> Un usuario (users) puede tener múltiples tarjetas (credit_cards)
-- Soporta Eliminación Lógica (Soft Delete) mediante is_active y deleted_at
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    card_number VARCHAR(19) NOT NULL UNIQUE,
    credit_limit NUMERIC(12, 2) NOT NULL CHECK (credit_limit >= 0),
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED', 'FROZEN', 'CANCELLED')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_active ON credit_cards(status, is_active) WHERE deleted_at IS NULL;

-- Usuarios iniciales de prueba para el modelo relacional
INSERT INTO users (id, full_name, email)
VALUES
    (1, 'Cristopher Sarceño', 'cristopher@example.com'),
    (2, 'María Fernanda López', 'maria.lopez@example.com'),
    (3, 'Carlos Andrés Gómez', 'carlos.gomez@example.com')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), true);

-- Tarjetas iniciales de ejemplo
INSERT INTO credit_cards (user_id, card_number, credit_limit, balance, status, is_active)
SELECT 1, '4532-8910-2234-5678', 15000.00, 1200.50, 'ACTIVE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM credit_cards WHERE card_number = '4532-8910-2234-5678');

INSERT INTO credit_cards (user_id, card_number, credit_limit, balance, status, is_active)
SELECT 2, '5412-7534-9012-3456', 8000.00, 0.00, 'ACTIVE', TRUE
WHERE NOT EXISTS (SELECT 1 FROM credit_cards WHERE card_number = '5412-7534-9012-3456');

