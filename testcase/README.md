# Thư mục kiểm thử (Testcase.xlsx)

## Chạy nhanh

```powershell
# Demo analytics (20 sản phẩm + doanh thu)
node testcase/seed_demo_analytics.mjs

# Mock data (tuỳ chọn)
Get-Content testcase\seed_mock_tc30_46.sql -Raw | D:\xampp\mysql\bin\mysql.exe -u root laptop_ecommerce_db

# Test TC30-46
node testcase/run_tc30_46.mjs

# Test 79 TC (API)
node testcase/run_testcases.mjs

# Tạo tài khoản admin test
node testcase/create-admin.js

# Trích xuất Excel → JSON
python testcase/extract_xlsx.py
```

## Nội dung chính

| File | Mô tả |
|------|--------|
| `Testcase.xlsx` | File testcase gốc |
| `KET_QUA_TC30_46.txt` | Kết quả TC30–46 |
| `cases/TC030.txt` … | Chi tiết từng testcase |
| `TAI_KHOAN_ADMIN.txt` | Tài khoản admin test |
| `seed_demo_analytics.mjs` | 20 SP demo + đơn doanh thu cho test Dashboard |
