# Hướng Dẫn Báo Cáo Chức Năng Hệ Thống

## Tài liệu này dùng để làm gì

Tài liệu này dùng để trả lời câu hỏi kiểu:

- "Em làm chức năng này như thế nào?"
- "Luồng xử lý của chức năng này ra sao?"
- "Frontend, backend và database phối hợp thế nào?"
- "Vì sao em thiết kế chức năng theo cách này?"

Tài liệu được viết theo hướng:

- Chi tiết hơn để bạn có chất liệu nói.
- Nhưng vẫn đủ gọn để học và trình bày trong buổi báo cáo.

## Cách trả lời chuẩn cho hầu hết mọi chức năng

Khi bị hỏi một chức năng bất kỳ, bạn nên trả lời theo 5 ý:

1. Chức năng đó dùng để làm gì.
2. Frontend thu thập hoặc hiển thị gì.
3. Backend xử lý nghiệp vụ gì.
4. Dữ liệu được lưu ở đâu.
5. Vì sao em chọn cách làm đó.

Mẫu trả lời chung:

> Chức năng này em làm theo mô hình frontend gọi API, backend xử lý nghiệp vụ rồi thao tác database thông qua model. Ở frontend em tách giao diện, service gọi API và context quản lý state. Ở backend em tách `routes -> controllers -> models` để dễ bảo trì, dễ debug và dễ mở rộng sau này.

## Tổng quan kiến trúc để mở đầu phần trả lời

Khi cần giới thiệu hệ thống trước, bạn có thể nói:

> Hệ thống của em gồm 3 phần chính. Frontend dùng React + Vite để xây giao diện và quản lý trải nghiệm người dùng. Backend dùng ExpressJS để xử lý nghiệp vụ và kết nối MySQL. Ngoài ra em tách riêng một AI service bằng Python để xử lý phần tư vấn laptop, còn backend Node đóng vai trò trung gian truyền dữ liệu sản phẩm và lưu lịch sử chat.

### Các file quan trọng nên nhớ

- Frontend entry: `frontend/src/App.jsx`, `frontend/src/AppEnhanced.jsx`
- Backend entry: `backend/serverEnhanced.js`
- Auth context: `frontend/src/context/AuthContextEnhanced.jsx`
- Product context: `frontend/src/context/ProductContextEnhanced.jsx`
- Cart context: `frontend/src/context/CartContext.jsx`
- Notification context: `frontend/src/context/NotificationContextEnhanced.jsx`
- AI controller: `backend/controllers/aiController.js`

## 1. Chức năng phía người dùng

## 1.1. Hiển thị danh sách sản phẩm

### Mục đích

Chức năng này giúp người dùng xem toàn bộ sản phẩm đang bán trong hệ thống, đồng thời hiển thị các thông tin quan trọng như giá, cấu hình đại diện, ảnh và trạng thái còn hàng.

### Em làm như thế nào

- Ở frontend, em dùng `ProductContextEnhanced.jsx` làm nơi quản lý dữ liệu sản phẩm dùng chung cho toàn app.
- Context này gọi API lấy danh sách sản phẩm từ backend thông qua `productApi`.
- Sau khi nhận dữ liệu, em map dữ liệu backend sang dạng phù hợp cho UI như:
  - ảnh đại diện
  - giá hiển thị
  - giá cũ
  - cấu hình đại diện
  - trạng thái còn hàng
- Dữ liệu sau đó được dùng lại ở nhiều nơi như trang chủ, sản phẩm nổi bật, danh sách laptop, gợi ý so sánh.

### Luồng xử lý

1. Trang hoặc component cần danh sách sản phẩm.
2. `ProductContext` gọi API lấy dữ liệu.
3. Backend nhận request ở route sản phẩm.
4. Controller gọi model truy vấn database.
5. Kết quả trả về frontend.
6. Frontend chuẩn hóa dữ liệu rồi render.

### Điểm kỹ thuật nên nói

- Em không để UI phụ thuộc trực tiếp vào raw response từ database.
- Em có bước "normalize" dữ liệu để các component phía trên dùng ổn định hơn.
- Em chọn một `representative variant` để hiển thị nhanh giá và cấu hình đại diện cho mỗi dòng laptop.

### Vì sao làm như vậy

Vì sản phẩm laptop có nhiều biến thể cấu hình, nếu không chuẩn hóa dữ liệu từ đầu thì giao diện sẽ rất khó quản lý và dễ lỗi khi dùng lại ở nhiều trang.

### Trả lời ngắn mẫu

> Em quản lý danh sách sản phẩm bằng một context chung. Context sẽ gọi API từ backend, sau đó map dữ liệu thành dạng UI chuẩn như ảnh, giá, cấu hình và trạng thái tồn kho trước khi hiển thị.

## 1.2. Tìm kiếm và gợi ý tìm kiếm

### Mục đích

Giúp người dùng tìm sản phẩm nhanh hơn và giảm số thao tác lọc thủ công.

### Em làm như thế nào

- Em đặt ô tìm kiếm ở header bằng component `SearchSuggestBox`.
- Khi người dùng nhập từ khóa, frontend không gọi API ngay mà chờ một khoảng ngắn bằng debounce.
- Sau đó frontend gọi API lấy gợi ý.
- Kết quả gợi ý được chia thành:
  - danh mục phù hợp
  - sản phẩm phù hợp

### Luồng xử lý

1. Người dùng nhập từ khóa.
2. Frontend debounce để tránh spam request.
3. Gọi search API.
4. Backend xử lý truy vấn.
5. Trả về danh mục và sản phẩm liên quan.
6. Frontend hiển thị dropdown gợi ý.

### Điểm kỹ thuật nên nói

- Có debounce để tối ưu hiệu năng.
- Có tách riêng component tìm kiếm để tái sử dụng và dễ sửa.
- Có phân tách kết quả theo nhóm giúp UX rõ hơn.

### Vì sao làm như vậy

Vì tìm kiếm là tính năng được dùng thường xuyên. Nếu gọi API liên tục theo từng ký tự sẽ làm tăng tải hệ thống và trải nghiệm không mượt.

### Trả lời ngắn mẫu

> Em làm tìm kiếm theo hướng search suggest. Frontend debounce input rồi gọi API lấy danh mục và sản phẩm phù hợp để hiển thị gợi ý ngay trên header.

## 1.3. Lọc và hiển thị sản phẩm theo tiêu chí

### Mục đích

Giúp người dùng thu hẹp danh sách laptop theo nhu cầu như gaming, học tập, văn phòng hoặc theo các tiêu chí cấu hình và mức giá.

### Em làm như thế nào

- Em tách khu vực chọn bộ lọc riêng với khu vực hiển thị danh sách.
- Khi người dùng thay đổi điều kiện lọc, frontend cập nhật state lọc.
- Danh sách sản phẩm nhận điều kiện này và chỉ hiển thị phần phù hợp.

### Điểm kỹ thuật nên nói

- Tách biệt phần chọn điều kiện và phần render kết quả.
- Bộ lọc có thể mở rộng thêm nhiều tiêu chí mà không phải sửa lại toàn bộ màn hình.

### Trả lời ngắn mẫu

> Em tách phần filter ra thành một lớp độc lập. Khi người dùng đổi điều kiện, danh sách sản phẩm chỉ nhận bộ lọc mới và render lại dữ liệu phù hợp.

## 1.4. Xem chi tiết sản phẩm

### Mục đích

Giúp người dùng xem đầy đủ thông tin một laptop trước khi mua, bao gồm cấu hình, giá, màu sắc, hình ảnh, mô tả và đánh giá.

### Em làm như thế nào

- Ở trang chi tiết, frontend lấy `product id` từ URL.
- Sau đó gọi API `getProductById`.
- Backend trả về đầy đủ dữ liệu của sản phẩm và các biến thể liên quan.
- Frontend xử lý thêm logic:
  - chọn variant
  - chọn màu
  - đổi ảnh đang xem
  - tính giá hiển thị theo variant
  - hiển thị thông số kỹ thuật

### Luồng xử lý

1. Người dùng vào `/product/:id`.
2. Frontend gọi API lấy chi tiết sản phẩm.
3. Backend query product, variant, image, review.
4. Frontend lọc các variant không còn bán.
5. Frontend hiển thị dữ liệu theo variant đang được chọn.

### Điểm kỹ thuật nên nói

- Em xử lý theo `variant` chứ không chỉ theo product chung.
- Điều này rất quan trọng với bài toán laptop, vì một dòng máy có thể có nhiều cấu hình RAM, SSD, GPU khác nhau.
- Giá, tồn kho và ảnh có thể khác nhau theo từng variant.

### Vì sao làm như vậy

Nếu chỉ quản lý ở mức product chung thì sẽ không phản ánh đúng tình huống thực tế của laptop thương mại điện tử.

### Trả lời ngắn mẫu

> Em làm trang chi tiết theo hướng product là lớp cha, còn variant là lớp cấu hình thực tế. Khi người dùng chọn màu hoặc cấu hình, frontend cập nhật đúng giá, ảnh và trạng thái theo variant tương ứng.

## 1.5. So sánh sản phẩm

### Mục đích

Cho phép người dùng so sánh nhiều laptop trên cùng một màn hình để hỗ trợ ra quyết định mua hàng.

### Em làm như thế nào

- Chức năng này nằm chủ yếu ở frontend.
- Khi người dùng chọn sản phẩm để so sánh, frontend gọi API lấy chi tiết từng sản phẩm.
- Sau đó em chuẩn hóa dữ liệu về cùng một cấu trúc để render bảng so sánh.

### Các tiêu chí em dùng để so sánh

- CPU
- GPU
- RAM
- SSD
- màn hình
- hệ điều hành
- giá
- tồn kho

### Điểm kỹ thuật nên nói

- Có giới hạn số lượng sản phẩm so sánh cùng lúc để tránh nặng UI.
- Dữ liệu được đưa về cùng schema trước khi hiển thị để bảng so sánh không bị lệch cột.

### Trả lời ngắn mẫu

> Em làm so sánh bằng cách chuẩn hóa dữ liệu của nhiều sản phẩm về cùng một schema thông số rồi hiển thị song song trên cùng một bảng.

## 1.6. Đăng ký tài khoản

### Mục đích

Cho phép người dùng tạo tài khoản mới để lưu thông tin cá nhân, địa chỉ, đơn hàng và thông báo.

### Em làm như thế nào

- Frontend dùng modal đăng ký để nhập:
  - họ tên
  - email
  - số điện thoại
  - mật khẩu
- Dữ liệu được gửi tới API đăng ký.
- Backend kiểm tra:
  - thiếu trường bắt buộc hay không
  - email đã tồn tại hay chưa
  - dữ liệu có hợp lệ không
- Sau đó backend mã hóa mật khẩu, tạo user và trả token.

### Điểm kỹ thuật nên nói

- Mật khẩu không lưu thô mà phải hash trước khi lưu.
- Sau khi đăng ký thành công, frontend có thể giữ luôn phiên đăng nhập bằng token.

### Trả lời ngắn mẫu

> Chức năng đăng ký của em làm theo hướng backend validate và tạo tài khoản, còn frontend chỉ chịu trách nhiệm nhập dữ liệu và nhận token sau khi tạo thành công.

## 1.7. Đăng nhập

### Mục đích

Cho phép người dùng truy cập vào khu vực cá nhân và sử dụng các chức năng cần xác thực.

### Em làm như thế nào

- Frontend gọi API login với email và mật khẩu.
- Backend kiểm tra tài khoản, mật khẩu và trạng thái user.
- Nếu hợp lệ, backend trả về JWT token cùng thông tin user.
- Frontend lưu token và user.
- `AuthContext` cập nhật trạng thái đăng nhập cho toàn bộ ứng dụng.

### Điểm kỹ thuật nên nói

- Em dùng context để mọi màn hình đều biết người dùng đang đăng nhập hay không.
- Sau khi login, em đồng bộ luôn giỏ hàng với `CartContext`.
- Em dùng JWT để lưu trạng thái xác thực thay vì lưu session đăng nhập truyền thống ở server.

### Trả lời ngắn mẫu

> Sau khi đăng nhập, em không chỉ lưu token mà còn cập nhật state đăng nhập toàn app và đồng bộ giỏ hàng để trải nghiệm người dùng liền mạch hơn.

## 1.7.1. JWT là gì và em dùng JWT như thế nào

### JWT là gì

JWT là một chuỗi token dùng để xác thực người dùng sau khi đăng nhập. Thay vì backend phải lưu session đăng nhập của từng người, backend chỉ cần phát hành token, còn frontend giữ token đó và gửi lại trong các request cần xác thực.

### Trong hệ thống của em, JWT được dùng như thế nào

- Sau khi đăng nhập thành công, backend tạo JWT bằng `jsonwebtoken`.
- Token được ký bằng `JWT_SECRET`.
- Thời gian sống hiện tại là `7 ngày`.
- Payload hiện đang chứa các thông tin chính:
  - `user_id`
  - `email`
  - `token_version`
- Frontend lưu token và gửi lại qua header:
  - `Authorization: Bearer <token>`

### Backend kiểm tra JWT ra sao

- Middleware `authMiddleware.js` sẽ:
  - lấy token từ header `Authorization`
  - dùng `jwt.verify(...)` để giải mã và kiểm tra chữ ký
  - lấy `user_id` và `token_version` từ token
  - so sánh `token_version` trong token với `token_version` trong database
- Nếu hợp lệ thì gắn `req.user` để các API phía sau dùng.
- Nếu không hợp lệ thì trả `401 Unauthorized`.

### Vì sao em thêm `token_version`

Đây là điểm khá hay để trả lời hội đồng.

Trong hệ thống của em, khi người dùng logout, backend sẽ tăng `token_version` trong database lên 1. Khi đó các token cũ sẽ không còn hợp lệ nữa, dù token vẫn chưa hết hạn theo thời gian.

Điều này giúp:

- vô hiệu hóa token cũ sau khi đăng xuất
- tăng độ an toàn
- không phải lưu blacklist token phức tạp

### Vì sao em chọn JWT

- Dễ tích hợp giữa frontend và backend
- Phù hợp kiến trúc API
- Không cần lưu session truyền thống ở server
- Dễ mở rộng cho mobile app hoặc client khác sau này

### Trả lời ngắn mẫu

> Em dùng JWT để xác thực người dùng sau khi đăng nhập. Backend tạo token chứa `user_id`, `email` và `token_version`, frontend lưu token rồi gửi lại trong header cho các API cần bảo vệ. Ở backend em kiểm tra chữ ký token và đối chiếu `token_version` với database để vô hiệu hóa token cũ khi logout.

## 1.8. Quên mật khẩu và đặt lại mật khẩu

### Mục đích

Hỗ trợ người dùng lấy lại quyền truy cập tài khoản nếu quên mật khẩu.

### Em làm như thế nào

Em chia thành 3 bước:

1. Nhập email để nhận mã xác thực.
2. Nhập mã xác thực để kiểm tra hợp lệ.
3. Nhập mật khẩu mới.

### Luồng xử lý

1. Frontend gọi API quên mật khẩu.
2. Backend sinh mã reset và gửi qua email.
3. Frontend gọi API xác minh mã.
4. Nếu đúng, cho phép nhập mật khẩu mới.
5. Frontend gọi API reset password.
6. Backend cập nhật mật khẩu mới trong database.

### Vì sao làm như vậy

Chia nhiều bước giúp tăng tính an toàn và giảm nguy cơ đổi mật khẩu trái phép.

### Trả lời ngắn mẫu

> Em chia quên mật khẩu thành 3 bước: gửi mã, xác minh mã, rồi mới cho đổi mật khẩu để đảm bảo an toàn hơn.

## 1.8.1. Mật khẩu đang được mã hóa kiểu gì

### Cách hệ thống hiện tại xử lý mật khẩu

Hệ thống của em hiện không mã hóa mật khẩu theo kiểu có thể giải ngược, mà dùng `bcrypt` để băm mật khẩu trước khi lưu vào database.

Nói chính xác hơn:

- thư viện đang dùng là `bcrypt`
- khi đăng ký, backend tạo `salt` với `10 rounds`
- sau đó dùng `bcrypt.hash(password, salt)` để tạo `password_hash`
- database chỉ lưu `password_hash`, không lưu mật khẩu gốc

### Khi đăng nhập thì kiểm tra thế nào

- Backend lấy `password_hash` đã lưu trong database
- Dùng `bcrypt.compare(password, user.password_hash)`
- Nếu kết quả đúng thì cho đăng nhập
- Nếu sai thì trả lỗi tài khoản hoặc mật khẩu không đúng

### Khi reset mật khẩu thì sao

- Mật khẩu mới cũng tiếp tục được băm bằng `bcrypt`
- Sau đó mới update lại vào cột `password_hash`

### Vì sao em dùng bcrypt

- Đây là cách an toàn hơn nhiều so với tự mã hóa đơn giản hoặc dùng MD5/SHA1 thuần
- `bcrypt` có salt nên giảm nguy cơ bị dò bằng rainbow table
- Đây là chuẩn rất phổ biến cho xác thực người dùng

### Cách trả lời cho đúng từ ngữ

Khi báo cáo, nên nói:

> Em không lưu mật khẩu dạng plain text. Hệ thống dùng `bcrypt` để băm mật khẩu với `salt rounds = 10`, sau đó lưu vào cột `password_hash`. Khi đăng nhập, backend dùng `bcrypt.compare` để đối chiếu mật khẩu người dùng nhập với hash đã lưu trong database.

Không nên nói:

> Em mã hóa mật khẩu rồi giải mã ra.

Vì trong hệ thống này, mật khẩu đang được **băm** chứ không phải **mã hóa hai chiều**.

## 1.9. Đăng nhập bằng Facebook

### Mục đích

Giúp người dùng đăng nhập nhanh mà không cần tạo tài khoản theo cách truyền thống.

### Em làm như thế nào

- Frontend điều hướng sang luồng OAuth của Facebook.
- Sau khi nhận access token, frontend gửi token đó về backend.
- Backend dùng token này để xác minh với Facebook.
- Nếu hợp lệ, backend tạo mới hoặc tìm user tương ứng trong hệ thống rồi trả token nội bộ.

### Trả lời ngắn mẫu

> Em dùng chuẩn OAuth. Frontend lấy access token từ Facebook, còn backend mới là nơi xác thực và đồng bộ user vào hệ thống của mình.

## 1.10. Giỏ hàng

### Mục đích

Cho phép người dùng lưu sản phẩm tạm thời trước khi đặt hàng, kể cả khi chưa đăng nhập.

### Em làm như thế nào

- Em quản lý giỏ hàng bằng `CartContext`.
- Hỗ trợ 2 trường hợp:
  - khách chưa đăng nhập thì dùng `session_id`
  - người dùng đã đăng nhập thì dùng `user_id`
- Khi thêm hoặc sửa số lượng, frontend cập nhật giao diện trước bằng optimistic update.
- Sau đó mới gọi API để đồng bộ với backend.

### Luồng xử lý

1. App khởi động, cart đọc cache local trước.
2. Sau đó cart sync với backend.
3. Khi thêm sản phẩm, frontend cộng ngay vào giỏ.
4. Gọi API thêm cart item.
5. Nếu thành công thì fetch lại cart chuẩn từ backend.
6. Nếu người dùng vừa login, backend merge cart guest vào cart user.

### Điểm kỹ thuật nên nói

- Có `session cart` cho khách vãng lai.
- Có `merge cart` khi đăng nhập.
- Có fallback localStorage để UI không trống nếu API lỗi.

### Vì sao làm như vậy

Vì nếu bắt người dùng đăng nhập ngay từ đầu thì trải nghiệm mua hàng sẽ kém hơn. Session cart giúp người dùng duyệt và chọn hàng trước.

### Trả lời ngắn mẫu

> Giỏ hàng của em hỗ trợ cả khách và người dùng đăng nhập. Em dùng `session_id` cho khách, `user_id` cho tài khoản và có cơ chế merge cart khi đăng nhập để không mất dữ liệu đã chọn trước đó.

## 1.11. Áp voucher

### Mục đích

Cho phép người dùng giảm giá đơn hàng theo các chương trình khuyến mãi.

### Em làm như thế nào

- Frontend cho nhập mã voucher.
- Khi người dùng bấm áp dụng, frontend gọi API kiểm tra mã.
- Backend kiểm tra:
  - voucher có tồn tại không
  - còn số lượng không
  - còn hạn không
  - đơn hàng có đạt mức tối thiểu không
- Nếu hợp lệ, frontend tính lại tổng tiền hiển thị.

### Điểm kỹ thuật nên nói

- Backend là nơi quyết định voucher hợp lệ hay không.
- Frontend chỉ dùng kết quả từ backend để hiển thị.

### Trả lời ngắn mẫu

> Em luôn kiểm tra voucher ở backend thay vì chỉ tính ở frontend, vì đây là phần nghiệp vụ cần đảm bảo đúng và tránh bị gian lận.

## 1.12. Đặt hàng

### Mục đích

Biến các item trong giỏ hàng thành một đơn hàng chính thức.

### Em làm như thế nào

- Frontend lấy:
  - danh sách sản phẩm trong giỏ
  - địa chỉ giao hàng
  - voucher đang áp dụng
  - loại đơn hàng
- Sau đó gửi request tạo order lên backend.
- Backend tạo đơn hàng và các dòng chi tiết đơn hàng trong database.

### Luồng xử lý

1. Người dùng chọn địa chỉ.
2. Frontend chuẩn hóa cart items thành danh sách variant và số lượng.
3. Gọi API tạo order.
4. Backend kiểm tra dữ liệu và tạo đơn.
5. Trả về `order_id`.
6. Frontend dùng `order_id` cho bước thanh toán tiếp theo.

### Vì sao em tách order và payment

Vì đơn hàng là nghiệp vụ mua bán, còn thanh toán là nghiệp vụ giao dịch. Tách ra sẽ rõ ràng hơn và dễ xử lý lỗi hơn.

### Trả lời ngắn mẫu

> Em tách bước tạo đơn hàng và bước thanh toán. Hệ thống phải có order trước, sau đó payment mới xử lý trên order đó.

## 1.13. Thanh toán COD, MoMo, VNPay

### Mục đích

Cho phép người dùng chọn nhiều hình thức thanh toán khác nhau.

### Em làm như thế nào

- Sau khi có `order_id`, frontend gọi payment API.
- Backend xử lý theo từng cổng:
  - COD thì cập nhật trạng thái thanh toán trong hệ thống
  - MoMo và VNPay thì sinh payment URL để redirect người dùng sang cổng thanh toán
- Sau khi giao dịch xong, hệ thống có trang success hoặc failed để phản hồi cho người dùng.

### Điểm kỹ thuật nên nói

- Payment được tách module riêng.
- Mỗi order có thể đi kèm một payment record.
- Cách này giúp dễ theo dõi giao dịch và mở rộng thêm cổng thanh toán sau này.

### Trả lời ngắn mẫu

> Em thiết kế payment thành một module riêng. Với COD thì xử lý trong hệ thống, còn MoMo và VNPay thì backend tạo link thanh toán rồi frontend chuyển hướng sang cổng tương ứng.

## 1.14. Theo dõi đơn hàng

### Mục đích

Cho phép người dùng xem trạng thái và chi tiết các đơn đã đặt.

### Em làm như thế nào

- Frontend lấy danh sách đơn theo user.
- Khi người dùng chọn một đơn, frontend gọi thêm API lấy chi tiết đơn.
- Trạng thái từ backend được map sang tên hiển thị dễ hiểu hơn cho người dùng.

### Điểm kỹ thuật nên nói

- Em tách `backend status` và `UI status`.
- Có timeline theo dõi đơn hàng.
- Có thể hiển thị cả địa chỉ giao hàng, ngày đặt, tổng tiền và hình thức thanh toán.

### Trả lời ngắn mẫu

> Em lấy trạng thái chuẩn từ backend rồi map sang nhãn dễ hiểu ở frontend để vừa giữ đúng logic nghiệp vụ vừa giúp người dùng dễ theo dõi.

## 1.15. Đổi địa chỉ giao hàng khi đơn chưa xử lý

### Mục đích

Cho phép người dùng chỉnh lại địa chỉ giao hàng nếu đơn vẫn còn ở giai đoạn sớm.

### Em làm như thế nào

- Chỉ cho phép sửa với các trạng thái như:
  - chờ xác nhận
  - chờ có hàng
- Frontend gọi API cập nhật địa chỉ đơn.
- Backend kiểm tra:
  - đơn đó có thuộc user không
  - trạng thái có cho phép cập nhật không

### Vì sao làm như vậy

Nếu cho sửa địa chỉ khi đơn đã xử lý hoặc đã giao thì sẽ gây sai lệch vận hành.

### Trả lời ngắn mẫu

> Em có ràng buộc nghiệp vụ là chỉ cho đổi địa chỉ khi đơn chưa vào quy trình xử lý thực tế để tránh lỗi vận hành.

## 1.16. Hồ sơ cá nhân và địa chỉ giao hàng

### Mục đích

Giúp người dùng quản lý thông tin cá nhân và nhiều địa chỉ nhận hàng khác nhau.

### Em làm như thế nào

- Frontend có trang profile riêng.
- Gọi API lấy:
  - thông tin user
  - danh sách địa chỉ
- Cho phép:
  - cập nhật profile
  - thêm địa chỉ
  - sửa địa chỉ
  - xóa địa chỉ
  - đặt địa chỉ mặc định

### Điểm kỹ thuật nên nói

- Em tách phần profile và phần address thành các API riêng vì đây là hai nhóm dữ liệu khác nhau.
- Địa chỉ mặc định được dùng lại khi checkout.

### Trả lời ngắn mẫu

> Em tách profile và địa chỉ thành hai lớp dữ liệu riêng. Profile là thông tin cá nhân, còn địa chỉ là dữ liệu phục vụ giao hàng và có thể có nhiều bản ghi.

## 1.17. Thông báo

### Mục đích

Cho phép người dùng nhận thông báo về đơn hàng, khuyến mãi, sản phẩm, hệ thống và tin tức.

### Em làm như thế nào

- Em dùng `NotificationContext` để quản lý thông báo chung.
- Khi user đăng nhập, context sẽ gọi API lấy danh sách thông báo.
- Có polling định kỳ để lấy cập nhật mới.
- Có chức năng đánh dấu đã đọc từng thông báo hoặc tất cả.

### Điểm kỹ thuật nên nói

- Có `unread_count` để hiển thị số chưa đọc trên icon header.
- Có filter theo loại thông báo.
- Có liên kết điều hướng khi người dùng bấm vào thông báo.

### Trả lời ngắn mẫu

> Em quản lý thông báo bằng context riêng, có polling định kỳ và có đồng bộ số lượng chưa đọc giữa trang thông báo và icon ở header.

## 1.18. Tin tức / blog

### Mục đích

Giúp hệ thống có phần nội dung marketing, hướng dẫn, đánh giá công nghệ và hỗ trợ SEO.

### Em làm như thế nào

- Frontend có trang danh sách bài viết và trang chi tiết.
- Backend có module blog riêng:
  - danh mục bài viết
  - bài viết
  - media cho blog
- Khi người dùng xem bài chi tiết, backend có thể tăng lượt xem.

### Vì sao làm như vậy

Vì website bán laptop không chỉ cần bán hàng mà còn cần nội dung để tăng độ tin cậy và thu hút người dùng từ tìm kiếm.

### Trả lời ngắn mẫu

> Em xây blog thành một module độc lập để phục vụ content marketing và SEO, đồng thời vẫn kết nối được với phần quản trị nội dung bên admin.

## 1.19. Chatbot AI tư vấn laptop

### Mục đích

Giúp người dùng mô tả nhu cầu bằng ngôn ngữ tự nhiên rồi nhận gợi ý laptop phù hợp.

### Em làm như thế nào

- Frontend có widget chatbot để nhập câu hỏi.
- Khi người dùng gửi tin nhắn, frontend gửi:
  - nội dung câu hỏi
  - lịch sử hội thoại
- Backend Node nhận request này.
- Backend lấy danh sách sản phẩm thực tế từ database.
- Sau đó backend gửi message, history và products sang AI service Python.
- Python service phân tích rồi trả về:
  - câu trả lời
  - câu hỏi gợi ý tiếp theo
  - danh sách laptop đề xuất
- Backend lưu log chat và trả dữ liệu về frontend.

### Điểm kỹ thuật nên nói

- Em tách AI service riêng để có thể nâng cấp độc lập.
- Backend Node làm tầng trung gian để AI không truy cập trực tiếp vào DB.
- Có lưu lịch sử hội thoại để phục vụ theo dõi và phát triển tiếp.

### Trả lời ngắn mẫu

> AI của em hoạt động theo kiểu frontend gửi câu hỏi lên backend Node, backend lấy dữ liệu sản phẩm thật rồi gửi sang Python AI service để phân tích. Sau đó backend lưu log chat và trả câu trả lời cùng danh sách gợi ý về lại giao diện.

## 2. Chức năng phía quản trị

## 2.1. Cấu trúc trang quản trị

### Em làm như thế nào

- Em dùng một trang admin trung tâm để điều phối nhiều module.
- Mỗi module được tách thành component riêng như:
  - sản phẩm
  - đơn hàng
  - kho
  - voucher
  - tin tức
  - banner
  - thông báo
- Dùng `activeModule` để chuyển giữa các khu vực.

### Vì sao làm như vậy

Vì admin có nhiều chức năng khác nhau. Nếu viết tất cả trong một file lớn thì rất khó maintain.

### Trả lời ngắn mẫu

> Em làm admin theo kiểu một trang điều phối và nhiều module con độc lập để dễ mở rộng và dễ bảo trì hơn.

## 2.2. Dashboard tổng quan

### Mục đích

Cho quản trị viên nhìn nhanh tình hình hệ thống mà không phải đi vào từng module.

### Em làm như thế nào

- Em tổng hợp dữ liệu từ đơn hàng và các module liên quan.
- Hiển thị các chỉ số như:
  - doanh thu
  - số đơn hoàn tất
  - tỷ lệ hủy
  - giá trị đơn trung bình

### Trả lời ngắn mẫu

> Dashboard của em là lớp tổng hợp dữ liệu vận hành để admin nắm nhanh toàn cảnh hệ thống.

## 2.3. Quản lý sản phẩm và variant

### Mục đích

Cho phép admin tạo và cập nhật laptop theo đúng cấu trúc sản phẩm thực tế.

### Em làm như thế nào

- Em tách 2 lớp:
  - product là thông tin chung
  - variant là từng phiên bản cấu hình cụ thể
- Ở frontend admin, form cũng chia thành:
  - thông tin sản phẩm
  - quản lý phiên bản
- Khi lưu, frontend chuẩn hóa từng variant rồi gửi lên backend.

### Dữ liệu của variant gồm

- SKU
- CPU
- GPU
- RAM
- loại RAM
- SSD
- màu sắc
- giá gốc
- giá giảm
- tồn kho
- trạng thái
- ảnh riêng

### Vì sao làm như vậy

Vì laptop là sản phẩm có nhiều cấu hình khác nhau trên cùng một model. Nếu không tách variant thì sẽ không quản lý đúng giá, tồn kho và ảnh của từng cấu hình.

### Trả lời ngắn mẫu

> Em không lưu laptop như một bản ghi đơn giản mà tách product và variant. Product là lớp chung, còn variant là cấu hình thực tế dùng để bán.

## 2.4. Quản lý thương hiệu

### Em làm như thế nào

- Admin có thể tạo, sửa, xóa thương hiệu.
- Có thể upload logo thương hiệu.
- Backend có route riêng cho brand và route upload media liên quan.

### Vì sao làm như vậy

Thương hiệu là dữ liệu nền dùng ở nhiều nơi như bộ lọc, trang sản phẩm và quản trị.

### Trả lời ngắn mẫu

> Em tách thương hiệu thành module riêng để dễ tái sử dụng và đảm bảo dữ liệu đồng nhất toàn hệ thống.

## 2.5. Quản lý danh mục

### Em làm như thế nào

- Hỗ trợ danh mục cha và danh mục con.
- Frontend admin cho phép tạo danh mục gốc hoặc gắn vào danh mục cha.
- Backend lưu quan hệ qua `parent_category_id`.

### Vì sao làm như vậy

Vì cấu trúc cha-con dễ mở rộng, phù hợp nếu sau này hệ thống có thêm nhiều nhóm sản phẩm hơn.

### Trả lời ngắn mẫu

> Em thiết kế danh mục theo cây cha-con để hệ thống có thể mở rộng lâu dài mà không phải thay đổi cấu trúc dữ liệu lớn.

## 2.6. Quản lý tồn kho

### Em làm như thế nào

- Admin nhập kho theo `variant_id`.
- Backend cập nhật tồn kho của đúng phiên bản sản phẩm.
- Có danh sách cảnh báo sản phẩm dưới mức tối thiểu.

### Điểm kỹ thuật nên nói

- Tồn kho quản lý theo variant chứ không theo product chung.
- Điều này phản ánh đúng thực tế vận hành bán laptop.

### Trả lời ngắn mẫu

> Em quản lý tồn kho theo variant vì mỗi cấu hình laptop có số lượng hàng riêng.

## 2.7. Quản lý đơn hàng

### Em làm như thế nào

- Admin lấy danh sách đơn hàng từ backend.
- Có thể:
  - xem chi tiết đơn
  - đổi trạng thái đơn
  - xác nhận
  - hoàn tất
  - hủy đơn
- Frontend chỉ gửi thao tác, còn backend là nơi cập nhật trạng thái chính thức.

### Vì sao làm như vậy

Vì trạng thái đơn hàng là phần nghiệp vụ cốt lõi, cần được kiểm soát ở server để tránh sai lệch logic.

### Trả lời ngắn mẫu

> Em chuẩn hóa trạng thái đơn ở backend, còn frontend chỉ hiển thị và gửi yêu cầu thay đổi trạng thái để đảm bảo đúng nghiệp vụ.

## 2.8. Quản lý voucher

### Em làm như thế nào

- Admin tạo voucher với các trường:
  - mã
  - loại giảm giá
  - giá trị giảm
  - đơn tối thiểu
  - số lượt còn lại
  - hạn dùng
- Frontend có CRUD voucher.
- Backend dùng dữ liệu này để kiểm tra ở bước checkout.

### Trả lời ngắn mẫu

> Em làm voucher thành một module riêng ở admin, nhưng việc voucher có dùng được hay không thì backend mới là nơi quyết định.

## 2.9. Quản lý khách hàng

### Em làm như thế nào

- Admin lấy danh sách khách hàng từ backend.
- Frontend hiển thị thêm một số phân loại như:
  - mới
  - thân thiết
  - VIP
- Có thể khóa hoặc mở khóa tài khoản.

### Vì sao làm như vậy

Vì ngoài dữ liệu thô, admin cần một lớp nhìn nhanh để đánh giá hành vi mua hàng.

### Trả lời ngắn mẫu

> Em kết hợp dữ liệu từ backend với một lớp phân tích nhẹ ở frontend để admin dễ nhìn nhóm khách hàng hơn.

## 2.10. Quản lý đánh giá và nội dung người dùng

### Em làm như thế nào

- Admin lấy danh sách review từ backend.
- Có thể xóa các review không phù hợp.
- Phần review này tách riêng với phần blog và banner.

### Trả lời ngắn mẫu

> Em tách review moderation thành một khu riêng để admin kiểm soát nội dung do người dùng tạo ra.

## 2.11. Quản lý tin tức

### Em làm như thế nào

- Đây là một module kiểu mini CMS.
- Gồm:
  - danh mục bài viết
  - bài viết
  - editor soạn nội dung
  - upload media
  - trạng thái xuất bản
- Em hỗ trợ các trạng thái như:
  - nháp
  - đã đăng
  - ẩn

### Điểm kỹ thuật nên nói

- Có editor rich text.
- Có upload ảnh/video cho nội dung.
- Có API riêng cho admin và API riêng cho phía user xem bài đã publish.

### Trả lời ngắn mẫu

> Em xây phần tin tức như một mini CMS để admin có thể tự quản lý nội dung mà không cần sửa code.

## 2.12. Quản lý banner

### Em làm như thế nào

- Admin có thể tạo banner bằng upload file hoặc nhập URL ảnh.
- Có thể chỉnh:
  - tiêu đề
  - link điều hướng
  - thứ tự hiển thị
  - trạng thái hiển thị

### Trả lời ngắn mẫu

> Em làm banner thành module riêng để nội dung trang chủ có thể thay đổi động từ admin.

## 2.13. Gửi thông báo

### Em làm như thế nào

- Admin nhập:
  - tiêu đề
  - nội dung
  - loại thông báo
  - đối tượng nhận
  - link điều hướng
- Backend tạo notification record cho user cụ thể hoặc cho toàn bộ người dùng.

### Trả lời ngắn mẫu

> Em tách rõ phía phát thông báo ở admin và phía nhận thông báo ở user, để hai bên hoạt động độc lập nhưng đồng bộ qua backend.

## 2.14. Quản lý tài khoản hệ thống

### Em làm như thế nào

- Admin tạo tài khoản nội bộ với vai trò tương ứng.
- Backend lưu role để phục vụ phân quyền.

### Trả lời ngắn mẫu

> Em tách tài khoản nội bộ khỏi khách hàng và gắn role để sau này mở rộng phân quyền dễ hơn.

## 2.15. Theo dõi AI trong admin

### Em làm như thế nào

- Em có khu vực admin để theo dõi:
  - log AI
  - số lượt tương tác
  - ghi chú dữ liệu
- Đây là lớp nền cho việc mở rộng hệ thống recommendation và AI sau này.

### Trả lời ngắn mẫu

> Em đã chuẩn bị một module quản trị AI để theo dõi tương tác và làm nền cho các phiên bản AI nâng cao hơn về sau.

## 3. Các câu hỏi kỹ thuật hay gặp

## 3.1. Vì sao em dùng Context ở frontend?

> Vì các dữ liệu như đăng nhập, giỏ hàng, sản phẩm và thông báo được dùng ở nhiều nơi. Dùng context giúp chia sẻ state toàn ứng dụng mà không phải truyền props quá sâu.

## 3.2. Vì sao em tách `routes -> controllers -> models`?

> Để tách phần định nghĩa API, phần xử lý nghiệp vụ và phần truy vấn database. Cách này giúp code rõ ràng, dễ debug và dễ mở rộng hơn.

## 3.3. Vì sao em tách AI service riêng?

> Vì AI có thể thay đổi công nghệ và model nhanh hơn phần web app. Tách riêng giúp nâng cấp AI mà ít ảnh hưởng đến backend chính.

## 3.4. Vì sao giỏ hàng phải có `session_id`?

> Vì khách chưa đăng nhập vẫn cần thêm hàng. Nếu chỉ dùng `user_id` thì trải nghiệm mua hàng sẽ bị gò bó hơn.

## 3.5. Vì sao tồn kho phải quản lý theo variant?

> Vì cùng một dòng laptop có thể có nhiều cấu hình khác nhau. Mỗi cấu hình phải có tồn kho, giá và SKU riêng.

## 3.6. Vì sao voucher phải kiểm tra ở backend?

> Vì voucher là nghiệp vụ quan trọng. Nếu chỉ kiểm tra ở frontend thì có thể bị sửa request hoặc giả mạo điều kiện.

## 3.7. Vì sao em tách order và payment?

> Vì đơn hàng là nghiệp vụ bán hàng, còn payment là nghiệp vụ giao dịch tài chính. Tách ra giúp dễ kiểm soát trạng thái và dễ xử lý lỗi.

## 3.8. Em đang dùng JWT hay session?

> Em đang dùng JWT. Sau khi đăng nhập, backend phát hành token, frontend lưu token và gửi lại trong header ở các request cần xác thực.

## 3.9. Mật khẩu của em lưu như thế nào?

> Em không lưu mật khẩu gốc. Hệ thống dùng `bcrypt` với `salt rounds = 10` để băm mật khẩu rồi lưu vào `password_hash`.

## 3.10. Khi logout thì JWT cũ có còn dùng được không?

> Trong hệ thống của em, khi logout backend sẽ tăng `token_version` trong database. Middleware xác thực sẽ so sánh `token_version` trong token với database, nên token cũ sẽ bị vô hiệu hóa.

## 4. Kết luận ngắn để dùng khi chốt phần trả lời

Bạn có thể chốt bằng đoạn này:

> Với mỗi chức năng, em đều cố gắng thiết kế theo nguyên tắc frontend lo giao diện và trải nghiệm, backend lo nghiệp vụ và dữ liệu, còn database lưu trạng thái cuối cùng. Riêng phần AI em tách service riêng để dễ nâng cấp. Cách tổ chức này giúp hệ thống rõ ràng, dễ bảo trì và có thể phát triển tiếp trong tương lai.
