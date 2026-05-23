# LaptopShop AI Service Setup

## Muc tieu

Tach phan AI thanh mot service Python rieng de:
- frontend chi goi mot API thong nhat qua backend Node
- backend Node co the lay du lieu san pham roi gui sang AI service
- de nang cap model sau nay ma khong can sua qua nhieu o frontend

## Mo hinh hien tai

Phien ban hien tai dung:

`hybrid_keyword_structured_ranker_v3`

Thanh phan chinh:
- phan tich cau hoi nguoi dung
- trich xuat budget, RAM, SSD, intent
- xep hang san pham bang keyword overlap + diem cau hinh + diem ngan sach + diem ton kho
- hoi lai khi thong tin chua du ro

## Kien truc

Frontend:
- `frontend/src/components/Chatbot.jsx`
- `frontend/src/services/aiApi.js`

Backend Node:
- route: `POST /api/ai/chat`
- file: `backend/routes/aiRoutes.js`
- controller: `backend/controllers/aiController.js`

Python AI service:
- `backend/ai_service/app.py`
- `backend/ai_service/engine.py`

## Cach chay nhanh

### Chay toan bo he thong

```powershell
cd .
.\start_all.ps1
```

De dung toan bo:

```powershell
cd .
.\stop_all.ps1
```

### 1. Khoi dong AI service

```powershell
cd backend/ai_service
.\start_ai_service.ps1
```

Script se:
- tao `.venv` neu chua co
- chay service nen tai `127.0.0.1:8001`
- ghi log vao file
- luu PID de dung service sau nay

### 2. Dung AI service

```powershell
cd backend/ai_service
.\stop_ai_service.ps1
```

### 3. Kiem tra service

Mo:

`http://127.0.0.1:8001/health`

Neu chay dung, service se tra ve JSON co `status: ok`.

## File quan trong

- `backend/ai_service/start_ai_service.ps1`
- `backend/ai_service/stop_ai_service.ps1`
- `backend/ai_service/ai_service.log`
- `backend/ai_service/ai_service.err.log`
- `backend/ai_service/ai_service.pid`

## Chay backend Node

```powershell
cd backend
npm run dev
```

Neu muon doi URL AI service:

```env
AI_SERVICE_URL=http://127.0.0.1:8001
```

## Chay frontend

```powershell
cd frontend
npm run dev
```

## Luong hoat dong

1. Nguoi dung nhap cau hoi trong chatbot.
2. Frontend goi `POST /api/ai/chat`.
3. Backend Node lay catalog san pham tu database.
4. Backend Node gui cau hoi + catalog sang Python AI service.
5. AI service phan tich va xep hang san pham.
6. Backend tra ket qua ve frontend.
7. Chatbot hien thi cau tra loi va cac goi y.

## Ghi chu tuong thich

Ban nay da duoc dieu chinh de chay tot trong moi truong Python `3.14` hien co tren may, khong con phu thuoc vao `numpy`, `scikit-learn`, `fastapi` hay `pydantic` cho buoc bootstrap.
