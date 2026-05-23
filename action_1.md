# Cách khởi động code

Tài liệu này hướng dẫn cách chạy dự án TMDT trên máy Windows.

## 1. Chuẩn bị trước

- Cài Node.js LTS.
- Cài và bật MySQL Server.
- Tạo database theo hướng dẫn trong `backend/DATABASE_SETUP.md`.
- Đảm bảo file `backend/.env` đã có đúng thông tin kết nối MySQL.

## 2. Chạy backend

Mở PowerShell tại thư mục gốc dự án rồi chạy:

```powershell
cd "D:\TMDT\TMDT\backend"
npm install
npm start
```

Nếu chạy đúng, backend sẽ hiện:

- `Server đang chạy tại port 5000`
- `Swagger UI: http://localhost:5000/api-docs`

## 3. Chạy frontend

Mở một terminal mới và chạy:

```powershell
cd "D:\TMDT\TMDT\frontend"
npm install
npm run dev
```

Sau đó mở trình duyệt tại địa chỉ mà Vite in ra, thường là:

- `http://localhost:5173`

## 4. Chạy toàn bộ hệ thống

Ở thư mục gốc dự án, bạn có thể dùng script sẵn có:

```powershell
cd "D:\TMDT\TMDT"
.\start_all.ps1
```

Script này sẽ khởi động:

- AI service
- Backend
- Frontend

## 5. Tắt hệ thống

Nếu chạy bằng `start_all.ps1`, dùng:

```powershell
.\stop_all.ps1
```

## 6. Nếu frontend không lên

- Kiểm tra đã chạy `npm install` trong thư mục `frontend` chưa.
- Kiểm tra backend có chạy ở `http://localhost:5000` không.
- Kiểm tra file `.env` của frontend/backend nếu có biến API base URL.
- Nếu gặp lỗi port, thử đóng tiến trình đang chiếm `5173` hoặc `5000`.

## 7. Trình tự khuyến nghị

1. Bật MySQL.
2. Chạy backend.
3. Chạy frontend.
4. Mở `http://localhost:5173` để kiểm tra giao diện.
