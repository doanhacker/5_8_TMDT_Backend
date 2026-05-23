# Development Feature Guide

Tai lieu :
- hieu nhanh luong he thong (frontend, backend, database)
- sua tinh nang hien tai an toan, khong vo regression
- phat trien them module moi theo mau thong nhat

## 1) Tong quan kien truc

### Backend
- Thu muc: `backend/`
- Stack: Express + MySQL + JWT
- Entry: `backend/server.js`
- Pattern: `routes -> controllers -> models -> database`

### Frontend
- Thu muc: `frontend/`
- Stack: React + Vite + Context API
- Entry: `frontend/src/main.jsx`, `frontend/src/App.jsx`
- Pattern: `pages/components -> services -> backend API`

### Database
- Script khoi tao: `backend/database/init.sql`
- Seed: `backend/database/seed.sql`

## 2) Cac module da duoc ket noi API that

### Admin
- San pham + bien the
- Voucher
- Don hang
- Ton kho
- Khach hang
- Noi dung danh gia (review)
- Banner, Tin tuc
- Thong bao
- Nguoi dung he thong (staff/admin)

### Nguoi dung
- Gio hang + checkout
- Ap dung voucher
- Thanh toan COD/MOMO/VNPAY
- Trang callback thanh toan
- Danh sach thong bao va danh dau da doc

## 3) File quan trong can biet truoc khi sua

### Frontend
- `frontend/src/pages/Admin.jsx`: trang dieu phoi tat ca module admin
- `frontend/src/context/ProductContext.jsx`: state san pham + API wrapper cho product/variant
- `frontend/src/context/NotificationContext.jsx`: state thong bao user
- `frontend/src/pages/Cart.jsx`: checkout, voucher, payment flow
- `frontend/src/components/admin/*`: UI tung module admin
- `frontend/src/services/*.js`: client API theo module

### Backend
- `backend/server.js`: dang ky tat ca route
- `backend/routes/*.js`: khai bao endpoint
- `backend/controllers/*.js`: xu ly request/response
- `backend/models/*.js`: SQL query
- `backend/helpers/*.js`: validate va query helper

## 4) Quy trinh luong du lieu (de debug nhanh)

1. User thao tac tren UI
2. Component/page goi function trong `services/*.js`
3. Backend route nhan request
4. Controller validate + goi model
5. Model query DB
6. Controller tra JSON
7. Frontend map du lieu backend -> UI state

Neu loi, debug theo dung thu tu tren. Khong nhay buoc.

## 5) Quy uoc phat trien trong du an

- Service frontend la nguon goi API duy nhat (tranh goi `fetch` truc tiep trong nhieu component)
- Truong enum phai map ro rang giua UI va backend
  - Vi du order status backend: `PENDING_CONFIRMATION`, `PROCESSING`, ...
- Khong hardcode du lieu mock trong module da co API that
- Truoc khi merge phai build frontend thanh cong
- Khong commit secret that vao `.env.example`

## 6) Huong dan sua tinh nang co san

### A. Sua UI nhung giu nguyen logic
1. Sua file trong `frontend/src/components/...`
2. Khong doi contract data cua props neu khong can
3. Chay build: `npm run build` (frontend)

### B. Sua logic nghiep vu
1. Tim module service trong `frontend/src/services/...`
2. Kiem tra endpoint backend tuong ung trong `backend/routes/...`
3. Neu can doi format data:
   - sua map o service hoac page
   - sua validate/controller backend
4. Test case thanh cong + case loi

### C. Sua API backend
1. Them/sua route trong `backend/routes/...`
2. Them/sua ham controller
3. Them/sua ham model (SQL)
4. Validate input o controller
5. Cap nhat frontend service de dung endpoint moi

## 7) Huong dan them tinh nang moi (end-to-end)

Vi du them module admin moi:

1. Backend
- Tao route moi trong `backend/routes/<module>Routes.js`
- Tao controller moi trong `backend/controllers/<module>Controller.js`
- Tao model moi trong `backend/models/<module>Model.js`
- Dang ky route trong `backend/server.js`

2. Frontend
- Tao API client trong `frontend/src/services/<module>Api.js`
- Tao component UI trong `frontend/src/components/admin/<Module>.jsx`
- Tich hop vao `frontend/src/pages/Admin.jsx`
  - them menu item
  - them state/load data
  - them render module

3. Kiem thu
- Kiem tra response success + error
- Kiem tra trang thai loading
- Kiem tra empty state
- Build frontend

## 8) Checklist truoc khi merge

- [ ] Frontend build pass (`frontend: npm run build`)
- [ ] Khong co syntax error trong file sua
- [ ] API tra message loi ro rang
- [ ] UI co loading/empty/error state
- [ ] Khong con du lieu mock cho module da ket noi API
- [ ] Khong commit thong tin nhay cam (SMTP, cloudinary secret, ...)

## 9) Lenh chay nhanh cho dev moi

### Backend
1. `cd laptop-ecommerce/backend`
2. Tao file `.env` tu `backend/.env.example`
3. `npm install`
4. `npm run dev`

### Frontend
1. `cd laptop-ecommerce/frontend`
2. Tao file `.env` voi bien `VITE_API_BASE_URL`
3. `npm install`
4. `npm run dev`

## 10) Loi thuong gap va cach xu ly

### 400/422 khi submit form
- Kiem tra ten field gui len co dung schema backend khong
- Kiem tra kieu du lieu (number/string/null)

### 401/403
- Kiem tra token
- Kiem tra role user co quyen vao API/module hay khong

### Don hang khong cap nhat trang thai
- Kiem tra enum status backend
- Kiem tra mapping label o frontend

### Khong hien thi du lieu
- Kiem tra route co dang ky trong `backend/server.js` khong
- Kiem tra service frontend goi dung URL khong
- Kiem tra map data tra ve UI

## 11) De xuat nang cap tiep theo

- Tach class/utility map du lieu backend <-> frontend de tranh duplicate
- Them test API tu dong cho route quan trong (orders, payments, vouchers)
- Them lint/test pipeline truoc merge
- Chuan hoa response JSON cho tat ca API theo 1 schema chung

---

Neu can onboarding nhanh, hay bat dau tu:
1. `frontend/src/pages/Admin.jsx`
2. `frontend/src/services/`
3. `backend/routes/` + `backend/controllers/` + `backend/models/`

Ba nhom file tren cho ban nhin duoc day du luong du lieu va cach mo rong tinh nang.
