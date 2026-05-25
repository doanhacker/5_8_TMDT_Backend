# Thư mục kiểm thử Testcase.xlsx

## Chạy test TC30–46

```powershell
# 1. Mock data (tuỳ chọn)
Get-Content test\seed_mock_tc30_46.sql -Raw | D:\xampp\mysql\bin\mysql.exe -u root laptop_ecommerce_db

# 2. Chạy test API
node test/run_tc30_46.mjs
```

## Kết quả

| File | Mô tả |
|------|--------|
| `KET_QUA_TC30_46.txt` | Bảng kết quả tổng hợp |
| `cases/TC030.txt` … `TC046.txt` | Từng testcase + cách kiểm tra |
| `TAI_KHOAN_ADMIN.txt` | Tài khoản admin test |
| `seed_mock_tc30_46.sql` | Đơn #920, review #920, chat room mock |

## Tài khoản

- Admin: `admin.test@laptop-shop.com` / `Admin@123`
- Khách: `khachhang01@example.com` / `P@ssword123`
