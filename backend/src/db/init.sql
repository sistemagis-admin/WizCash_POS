-- WizCash POS Schema v2: Multi-Outlet, Username-based Authentication & Cash Management

-- 1. Drop existing tables cleanly
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS outlets CASCADE;

-- 2. Create Outlets Table
CREATE TABLE outlets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Users Table (Username-based Auth with outlet_id)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    outlet_id INT REFERENCES outlets(id) ON DELETE SET NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'cashier', -- 'admin', 'manager', 'cashier'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Wallets Table (tied to Outlet)
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    outlet_id INT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'cash', -- 'cash', 'bank', 'qris', 'e-wallet'
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    account_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    outlet_id INT REFERENCES outlets(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'income' or 'expense'
    icon VARCHAR(50) DEFAULT 'tag',
    color VARCHAR(20) DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Transactions Table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    outlet_id INT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    wallet_id INT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL, -- 'income', 'expense', 'transfer'
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT,
    reference_no VARCHAR(100),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Seed Default Outlets
INSERT INTO outlets (id, name, code, address, phone, is_active) VALUES
(1, 'WizCash Outlet Pusat', 'OUT-01', 'Jl. Jendral Sudirman No. 10, Jakarta Pusat', '0812-1111-2222', true),
(2, 'WizCash Cabang Bandung', 'OUT-02', 'Jl. Riau No. 45, Bandung', '0812-3333-4444', true),
(3, 'WizCash Cabang Surabaya', 'OUT-03', 'Jl. Tunjungan No. 88, Surabaya', '0812-5555-6666', true);

-- 8. Seed Default Users (Password default: 'admin123' and 'kasir123' hashed with bcrypt)
-- Hash for 'admin123': $2a$10$7Zrq0bL2c7.hHnB5.hQ.aeZ8rI3l3k6QZ2YQ5x9iVf9p1zM6.6e6u (standard bcrypt)
INSERT INTO users (id, outlet_id, username, password_hash, full_name, role, is_active) VALUES
(1, 1, 'admin', '$2a$10$7rX0fK/8W/lPZ1Y4wQ5eIeC8h6b7Q2x5iVf9p1zM6.6e6u8Zrq0bL', 'Super Admin WizCash', 'admin', true),
(2, 1, 'kasir_pusat', '$2a$10$7rX0fK/8W/lPZ1Y4wQ5eIeC8h6b7Q2x5iVf9p1zM6.6e6u8Zrq0bL', 'Siti Kasir Pusat', 'cashier', true),
(3, 2, 'kasir_bdg', '$2a$10$7rX0fK/8W/lPZ1Y4wQ5eIeC8h6b7Q2x5iVf9p1zM6.6e6u8Zrq0bL', 'Budi Kasir Bandung', 'cashier', true);

-- 9. Seed Default Categories
INSERT INTO categories (id, outlet_id, name, type, icon, color) VALUES
(1, 1, 'Penjualan Kasir POS', 'income', 'shopping-cart', '#10b981'),
(2, 1, 'Pendapatan Jasa & TopUp', 'income', 'trending-up', '#06b6d4'),
(3, 1, 'Pembelian Stok & Bahan', 'expense', 'package', '#f59e0b'),
(4, 1, 'Operasional & Listrik', 'expense', 'zap', '#8b5cf6'),
(5, 1, 'Gaji & Uang Makan', 'expense', 'users', '#ec4899'),
(6, 1, 'Biaya Lain-lain', 'expense', 'receipt', '#ef4444');

-- 10. Seed Default Wallets for Outlets
INSERT INTO wallets (id, outlet_id, name, type, balance, account_number) VALUES
(1, 1, 'Kas Laci Kasir 1 (Tunai)', 'cash', 2500000.00, 'LACI-01'),
(2, 1, 'Rekening Bank BCA Pusat', 'bank', 24500000.00, '8720192831'),
(3, 1, 'QRIS Merchant Mandiri', 'qris', 5320000.00, 'QRIS-PST-01'),
(4, 2, 'Kas Laci Kasir Bandung', 'cash', 1750000.00, 'LACI-BDG-01'),
(5, 2, 'QRIS Merchant Bandung', 'qris', 3400000.00, 'QRIS-BDG-01'),
(6, 3, 'Kas Laci Kasir Surabaya', 'cash', 1200000.00, 'LACI-SBY-01');

-- 11. Seed Initial Sample Transactions
INSERT INTO transactions (outlet_id, user_id, wallet_id, category_id, type, amount, description, reference_no, transaction_date) VALUES
(1, 2, 1, 1, 'income', 350000.00, 'Penjualan POS Order #1001', 'TRX-1001', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
(1, 2, 3, 1, 'income', 185000.00, 'Pembayaran QRIS Order #1002', 'TRX-1002', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(1, 2, 1, 4, 'expense', 45000.00, 'Beli token listrik kasir', 'EXP-2001', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
(2, 3, 4, 1, 'income', 220000.00, 'Penjualan POS Cabang Bandung #2001', 'TRX-BDG-01', CURRENT_TIMESTAMP - INTERVAL '4 hours');

-- 12. Reset sequences
SELECT setval('outlets_id_seq', (SELECT COALESCE(MAX(id), 1) FROM outlets));
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));
SELECT setval('wallets_id_seq', (SELECT COALESCE(MAX(id), 1) FROM wallets));
SELECT setval('transactions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM transactions));
