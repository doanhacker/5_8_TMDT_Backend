# 5_8_TMDT_Backend

Backend cho hệ thống thương mại điện tử bán thiết bị công nghệ, xây dựng bằng `Node.js`, `Express` và `MySQL`, được định hướng để mở rộng thêm hệ thống gợi ý sản phẩm, trợ lý AI và tích hợp giao hàng bên thứ 3.

## Tong Quan

Dự án này đóng vai trò là phần backend cho một nền tảng bán thiết bị công nghệ trực tuyến. Hệ thống được thiết kế để hỗ trợ các nhóm chức năng chính:

- Quản lý tài khoản người dùng và phân quyền
- Quản lý sản phẩm, danh mục, biến thể và thuộc tính kỹ thuật
- Giỏ hàng, đơn hàng, thanh toán, pre-order
- Đánh giá sản phẩm, hỏi đáp, wishlist và so sánh
- Hệ thống gợi ý sản phẩm
- Trợ lý AI và chat hỗ trợ
- Mở rộng tích hợp đơn vị vận chuyển bên thứ 3

## Diem Noi Bat

- Kiến trúc module rõ ràng theo hướng `routes -> controllers -> services -> models`
- Có sẵn tài liệu Swagger để test API
- Có schema SQL nền tảng cho dự án thương mại điện tử công nghệ
- Có file SQL riêng cho phần mở rộng giao hàng bên thứ 3
- Dễ mở rộng sang JWT auth, recommendation engine, AI assistant, webhook shipping

## Cong Nghe Su Dung

- `Node.js >= 20`
- `Express.js`
- `MySQL`
- `mysql2`
- `dotenv`
- `swagger-jsdoc`
- `swagger-ui-express`

## Cau Truc Thu Muc

```text
src/
  config/          Cau hinh he thong, ket noi database
  controllers/     Controller co ban
  database/        File SQL khoi tao va mo rong CSDL
  middlewares/     Middleware xu ly loi va 404
  models/          Thu muc model dung chung
  modules/         Module nghiep vu chinh
    auth/
    products/
    orders/
    ai/
    recommendation/
  routes/          Route tong va route co ban
  services/        Thu muc service dung chung
  utils/           Helper va utility
  app.js           Cau hinh express app
  server.js        Diem khoi dong server
  swagger.js       Cau hinh Swagger
```

## Kien Truc Module

Mỗi module được tổ chức theo 4 lớp chính:

- `Routes`: định nghĩa endpoint
- `Controller`: nhận request, trả response
- `Service`: chứa business logic
- `Model`: thao tác với database

Các module hiện có:

- `auth`: đăng ký, đăng nhập, token, xác thực tài khoản
- `products`: danh sách sản phẩm, so sánh, mở rộng tìm kiếm và filter
- `orders`: tạo đơn, xem đơn, quản lý trạng thái đơn hàng
- `ai`: trợ lý AI, knowledge base, ngữ cảnh hội thoại
- `recommendation`: gợi ý sản phẩm và log tương tác

## Database

Thư mục [src/database](/c:/Users/Win%2011/ecommerce-website/5_8_TMDT_Backend/src/database) hiện có 2 file chính:

- [init.sql](/c:/Users/Win%2011/ecommerce-website/5_8_TMDT_Backend/src/database/init.sql)
  Dùng để khởi tạo database nền tảng cho hệ thống thương mại điện tử thiết bị công nghệ.

- [add_third_party_shipping.sql](/c:/Users/Win%2011/ecommerce-website/5_8_TMDT_Backend/src/database/add_third_party_shipping.sql)
  Dùng để bổ sung các bảng và quan hệ phục vụ tích hợp đơn vị vận chuyển bên thứ 3 mà không cần import lại schema gốc.

Schema hiện đã bao phủ các nhóm dữ liệu:

- Người dùng, vai trò, địa chỉ
- Danh mục, thương hiệu, sản phẩm, biến thể, thuộc tính
- Wishlist, so sánh, sản phẩm đã xem
- Giỏ hàng, khuyến mãi, đơn hàng, thanh toán
- Pre-order, hoàn trả, lịch sử trạng thái đơn
- Kho và tồn kho
- Chat hỗ trợ và tài liệu AI
- Recommendation model và recommendation log

## Cai Dat Moi Truong

### 1. Cai dependency

```bash
npm install
```

### 2. Tao file moi truong

Sao chép từ `.env.example` và cấu hình lại các biến cần thiết:

```env
PORT=5000
DB_ENABLED=false
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=tech_ecommerce_db
```

### 3. Khoi tao database

Chạy file [init.sql](/c:/Users/Win%2011/ecommerce-website/5_8_TMDT_Backend/src/database/init.sql) để tạo schema gốc.

Nếu cần tích hợp giao hàng bên thứ 3, chạy tiếp file:

[add_third_party_shipping.sql](/c:/Users/Win%2011/ecommerce-website/5_8_TMDT_Backend/src/database/add_third_party_shipping.sql)

### 4. Chay server

```bash
npm run dev
```

Server mặc định chạy tại:

- API: `http://localhost:5000`
- Swagger Docs: `http://localhost:5000/api-docs`

## API Hien Tai

Các endpoint scaffold hiện đang có:

- `GET /`
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `POST /api/products/compare`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/ai/context`
- `POST /api/ai/ask`
- `GET /api/recommendations`
- `POST /api/recommendations/log`

## Tich Hop Giao Hang Ben Thu 3

File SQL bổ sung đã hỗ trợ cấu trúc dữ liệu cho:

- Danh sách hãng vận chuyển
- Dịch vụ vận chuyển theo từng hãng
- Gắn đơn hàng với hãng giao hàng
- Quản lý vận đơn
- Tracking log
- Webhook log từ hệ thống giao hàng

Thiết kế này phù hợp để tích hợp với các đơn vị như:

- GHN
- GHTK
- Viettel Post

## Dinh Huong Phat Trien

Các phần nên triển khai tiếp theo:

1. Hoàn thiện `auth` với JWT, refresh token, xác thực email, quên mật khẩu
2. Hoàn thiện `products` với search, filter, sort, chi tiết sản phẩm
3. Hoàn thiện `orders` với checkout, thanh toán và lịch sử trạng thái
4. Tạo module `shipping` để làm việc với các bảng giao hàng mới
5. Kết nối AI thật cho module `ai`
6. Xây dựng logic recommendation theo `content-based` và `collaborative`

## Nhanh Git De Xuat

Chiến lược branch phù hợp cho repo này:

- `main`: branch ổn định
- `dev`: branch tích hợp chính
- `feature/*`: branch phát triển tính năng riêng

Ví dụ:

```bash
git checkout dev
git checkout -b feature/auth-jwt
```

## Ghi Chu

- Hiện tại nhiều endpoint mới ở mức scaffold để định hình kiến trúc
- Dự án đã sẵn sàng để phát triển thành backend hoàn chỉnh cho đồ án hoặc sản phẩm thử nghiệm
- Nếu `DB_ENABLED=false`, server vẫn chạy mà chưa cần kết nối MySQL

## Tac Gia

Phát triển cho đồ án hệ thống thương mại điện tử bán thiết bị công nghệ tích hợp AI và recommendation.
