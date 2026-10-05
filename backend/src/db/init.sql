-- WizCash PostgreSQL Initial Schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'cash', -- 'cash', 'bank', 'e-wallet', 'crypto'
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'income' or 'expense'
    icon VARCHAR(50) DEFAULT 'tag',
    color VARCHAR(20) DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    wallet_id INT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL, -- 'income', 'expense', 'transfer'
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial default data if not exists
INSERT INTO users (id, name, email) 
VALUES (1, 'Admin WizCash', 'admin@wizcash.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, type, icon, color) VALUES
(1, 'Gaji / Salary', 'income', 'cash', '#10b981'),
(2, 'Investasi', 'income', 'trending-up', '#06b6d4'),
(3, 'Makanan & Minuman', 'expense', 'utensils', '#f59e0b'),
(4, 'Transportasi', 'expense', 'car', '#8b5cf6'),
(5, 'Belanja', 'expense', 'shopping-bag', '#ec4899'),
(6, 'Tagihan & Utilitas', 'expense', 'receipt', '#ef4444')
ON CONFLICT (id) DO NOTHING;

INSERT INTO wallets (id, user_id, name, type, balance, currency) VALUES
(1, 1, 'Dompet Utama (Cash)', 'cash', 1500000.00, 'IDR'),
(2, 1, 'Rekening BCA', 'bank', 12500000.00, 'IDR'),
(3, 1, 'GoPay / OVO', 'e-wallet', 350000.00, 'IDR')
ON CONFLICT (id) DO NOTHING;

INSERT INTO transactions (wallet_id, category_id, type, amount, description, transaction_date) VALUES
(2, 1, 'income', 10000000.00, 'Gaji Bulanan', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(1, 3, 'expense', 45000.00, 'Makan Siang', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(3, 4, 'expense', 25000.00, 'Transport Ojek Online', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Reset serial sequences to avoid conflict with seeded IDs
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));
SELECT setval('wallets_id_seq', (SELECT COALESCE(MAX(id), 1) FROM wallets));
SELECT setval('transactions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM transactions));
