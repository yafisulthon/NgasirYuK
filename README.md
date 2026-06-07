# NgasirYuK - Panduan Setup & Menjalankan Sistem

## 📋 Prerequisites

- Python 3.11+ ✅ (Python 3.12 terdeteksi)
- Node.js 18+ (perlu diinstall)
- PostgreSQL 14+ (perlu diinstall & running)

---

## 🗄️ 1. Setup PostgreSQL

### Install PostgreSQL
Download dari: https://www.postgresql.org/download/windows/

### Buat Database
```sql
CREATE DATABASE ngasiryuk;
```

### Update .env
Edit file `backend/.env`:
```
DATABASE_URL=postgresql://postgres:PASSWORD_ANDA@localhost:5432/ngasiryuk
```
Ganti `PASSWORD_ANDA` dengan password PostgreSQL Anda.

---

## 🐍 2. Jalankan Backend (FastAPI)

```powershell
# Di folder backend/
cd backend

# Install dependencies (sudah dijalankan otomatis)
pip install -r requirements.txt

# Jalankan seed data (pertama kali saja)
python seed.py

# Jalankan server
python -m uvicorn app.main:app --reload --port 8000
```

Backend akan berjalan di: http://localhost:8000
API Docs: http://localhost:8000/docs

---

## ⚛️ 3. Jalankan Frontend (Next.js)

### Install Node.js terlebih dahulu
Download dari: https://nodejs.org/en/download (versi LTS)

```powershell
# Di folder frontend/
cd frontend

# Install dependencies
npm install

# Jalankan dev server
npm run dev
```

Frontend akan berjalan di: http://localhost:3000

---

## 🔐 Default Login

| Role  | Username | Password  |
|-------|----------|-----------|
| Owner | owner    | owner123  |
| Admin | admin    | admin123  |
| Kasir | kasir    | kasir123  |

---

## 📁 Struktur Proyek

```
SIMKasir/
├── backend/          # FastAPI (Python)
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── services/
│   ├── seed.py
│   └── .env
└── frontend/         # Next.js (React)
    ├── app/
    ├── components/
    └── lib/
```
