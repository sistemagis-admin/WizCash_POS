# WizCash Backend API 💳

Backend REST API untuk aplikasi **WizCash** yang dibangun menggunakan **Node.js**, **Express.js**, **TypeScript**, dan **PostgreSQL (Docker)**.

---

## 🚀 Fitur & Arsitektur
- **Framework**: Express.js (TypeScript)
- **Database**: PostgreSQL 16 (Containerized via Docker Compose)
- **Connection Pool**: `pg` (node-postgres) dengan connection pooling & logging query
- **Database Management Tool**: pgAdmin 4 (opsional di port `5050`)
- **Fitur API**:
  - `GET /api/health` - Health check status API & koneksi PostgreSQL
  - `GET /api/wallets` & `POST /api/wallets` - Manajemen dompet/rekening
  - `GET /api/transactions` & `POST /api/transactions` - Catat transaksi & update saldo otomatis dengan ACID Transaction
  - `GET /api/transactions/summary` - Rekap total pemasukan, pengeluaran & net balance

---

## 🛠️ Persyaratan Sistem
- [Node.js](https://nodejs.org/) (v18+)
- [Docker & Docker Desktop](https://www.docker.com/)

---

## 📦 Cara Menjalankan

### 1. Masuk ke folder backend & Install Dependencies
```bash
cd backend
npm install
```

### 2. Jalankan PostgreSQL via Docker Compose
Jalankan perintah berikut untuk menyalakan database PostgreSQL & pgAdmin:
```bash
npm run docker:up
# atau: docker compose up -d
```

> **Catatan**: Script `src/db/init.sql` akan otomatis di-eksekusi saat container PostgreSQL pertama kali dibuat untuk membuat tabel (`users`, `wallets`, `categories`, `transactions`) dan data awal.

Jika ingin menjalankan inisialisasi / migrasi ulang database secara manual:
```bash
npm run db:init
```

### 3. Jalankan Server Backend (Development Mode)
```bash
npm run dev
```
Server akan berjalan di: **`http://localhost:5000`**

---

## ⚙️ Konfigurasi Environment (`.env`)
File `.env` sudah disediakan secara default:
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4200

DB_HOST=localhost
DB_PORT=5432
DB_USER=wizcash_user
DB_PASSWORD=wizcash_password
DB_NAME=wizcash_db
```

---

## 🌐 Akses pgAdmin 4 (Database GUI)
Jika ingin melihat & mengelola database secara visual melalui browser:
- **URL**: `http://localhost:5050`
- **Email**: `admin@wizcash.local`
- **Password**: `admin`
- **Koneksi ke PostgreSQL di pgAdmin**:
  - Host name: `postgres`
  - Port: `5432`
  - Maintenance database: `wizcash_db`
  - Username: `wizcash_user`
  - Password: `wizcash_password`

---

## 🛑 Perintah Docker Bermanfaat
- Menghentikan container: `npm run docker:down`
- Melihat log database: `npm run docker:logs`
