## Pull and Run Guide

Muc tieu: pull code ve va chay duoc ngay, khong can sua URL/API trong source code.

### 1. Pull dung nhanh

```bash
git fetch origin
git checkout SCRUM-6-Hoan-thanh-giao-dien
git pull origin SCRUM-6-Hoan-thanh-giao-dien
```

Neu branch local cua ban dung Unicode (`SCRUM-6-Hoàn-thành-giao-diện`) thi dung:

```bash
git checkout "SCRUM-6-Hoàn-thành-giao-diện"
git pull origin "SCRUM-6-Hoàn-thành-giao-diện"
```

### 2. Backend setup

```bash
cd backend
copy .env.example .env
npm install
npm start
```

Gia tri can kiem tra trong `backend/.env`:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- `PORT` (mac dinh 5000)
- `FRONTEND_ORIGIN` (mac dinh http://localhost:5173)

### 3. Frontend setup

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Gia tri can kiem tra trong `frontend/.env`:
- `VITE_API_BASE_URL=http://localhost:5000`

### 4. Kiem tra nhanh

- Backend API docs: `http://localhost:5000/api-docs`
- Frontend: `http://localhost:5173` (hoac port Vite tu dong chon)

### 5. Team pull ve khong can sua code

Project da duoc chuyen sang dung bien moi truong:
- Frontend URL API dung `VITE_API_BASE_URL`
- Backend DB va CORS dung bien `.env`

Vi vay moi thanh vien chi can tao file `.env` tu `.env.example` la chay duoc.
