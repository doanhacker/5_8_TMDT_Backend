# LaptopShop AI Beta

## Mục tiêu

Tạo một phiên bản LaptopShop AI có thể demo được ngay trong hệ thống hiện tại mà không phụ thuộc API AI bên ngoài.

## Thành phần đã làm

- Tạo model tại `frontend/src/lib/laptopShopAiModel.js`
- Nhúng model vào `frontend/src/components/Chatbot.jsx`
- Nâng cấp giao diện chatbot trong `frontend/src/styles/Chatbot.css`

## Model hiện tại là gì

Model hiện tại không còn chỉ là heuristic cộng điểm bằng các câu lệnh `if` đơn giản.

Nó đã được nâng lên thành một mô hình gợi ý kiểu `content-based recommendation` có thuật toán rõ ràng:

1. Chuẩn hóa câu hỏi người dùng về dạng không dấu để dễ phân tích
2. Trích xuất đặc trưng từ câu hỏi:
   - nhu cầu sử dụng
   - ngân sách
   - RAM tối thiểu
   - SSD tối thiểu
3. Biểu diễn mỗi sản phẩm thành một vector đặc trưng
4. Biểu diễn câu hỏi người dùng thành một vector truy vấn
5. Tính độ tương đồng bằng `cosine similarity`
6. Kết hợp thêm:
   - điểm phù hợp ngân sách
   - điểm phù hợp cấu hình tối thiểu
   - điểm trùng khớp từ khóa
   - điểm ưu tiên còn hàng
7. Xếp hạng và trả về top sản phẩm phù hợp nhất

## Đặc trưng đang dùng trong vector

- gaming
- office
- student
- programming
- design
- thinLight
- ai
- highRam
- highStorage
- discreteGpu
- premiumCpu
- value

## Khả năng hiện tại

- Hiểu các nhu cầu phổ biến như:
  - gaming
  - sinh viên
  - văn phòng
  - lập trình
  - đồ họa / video editing
  - mỏng nhẹ
  - AI
- Tách ngân sách từ câu hỏi, ví dụ:
  - `15 triệu`
  - `25tr`
  - `20000000`
- Tách yêu cầu cấu hình như:
  - `16GB RAM`
  - `512GB SSD`
- Xếp hạng sản phẩm từ dữ liệu thật trong `ProductContext`
- Trả về top gợi ý và cho phép bấm vào sản phẩm để mở trang chi tiết

## Giá trị để báo cáo tiến độ

Bạn có thể trình bày rằng:

- Hệ thống đã có một mô hình AI nội bộ chạy trực tiếp trên giao diện
- Model đã có thuật toán thực sự, không còn chỉ là chatbot trả lời cứng
- Đã dùng kỹ thuật vector hóa đặc trưng và cosine similarity
- Đã kết nối trực tiếp với dữ liệu sản phẩm thật của shop
- Có thể mở rộng tiếp lên backend logs, RAG hoặc LLM API ở giai đoạn sau

## Giới hạn hiện tại

- Đây chưa phải mô hình học sâu hoặc LLM
- Chưa có quá trình train từ dữ liệu lịch sử người dùng
- Chưa lưu lịch sử chat vào database
- Chưa gọi OpenAI, Gemini hoặc model bên ngoài
- Chưa có ngữ cảnh hội thoại nhiều lượt sâu

## Hướng mở rộng tiếp theo

1. Lưu lịch sử vào bảng `ai_chat_logs`
2. Tạo backend API cho chatbot
3. Huấn luyện / tinh chỉnh mô hình từ dữ liệu tương tác thật
4. Kết hợp RAG để lấy thông tin sản phẩm, đơn hàng, voucher theo ngữ cảnh
5. Kết nối LLM bên ngoài để xử lý hội thoại tự nhiên tốt hơn
