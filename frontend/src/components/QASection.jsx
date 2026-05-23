import "../styles/QASection.css"
import { useState } from "react"
import { FiChevronDown } from "react-icons/fi"

const qaItems = [
  {
    id: 1,
    user: "Nguyễn Trọng Vinh",
    time: "6 ngày trước",
    question: "Tôi đang là sinh viên, cần laptop nhẹ, pin lâu, ngân sách dưới 15tr?",
    answer: "Anh có thể tham khảo dòng ASUS Vivobook hoặc Lenovo IdeaPad 3. Chúng có cấu hình vừa đủ cho học tập, pin 10+ giờ và giá khá mềm.",
  },
  {
    id: 2,
    user: "Trần Minh Hùng",
    time: "4 ngày trước",
    question: "Laptop có thể chơi Elden Ring ở setting cao không? Budget 25tr?",
    answer: "Với budget 25 triệu, bạn có thể mua được ROG Strix G16 hoặc TUF Gaming F16 với RTX 4050, hoàn toàn có thể chơi Elden Ring ở setting Ultra.",
  },
  {
    id: 3,
    user: "Phạm Thị Hương",
    time: "2 ngày trước",
    question: "Laptop nào tốt nhất cho làm video editing và 3D modeling?",
    answer: "Tôi khuyến nghị MacBook Pro 14 inch hoặc Dell XPS 15 với RTX 4070. Cả hai có CPU mạnh, RAM lớn và GPU tốt cho công việc sáng tạo.",
  },
  {
    id: 4,
    user: "Lê Anh Tuấn",
    time: "1 ngày trước",
    question: "Nên mua laptop hãng nào? ASUS, Lenovo, HP hay Dell?",
    answer: "Các hãng đều tốt, tùy nhu cầu. ASUS tốt cho gaming, Lenovo cho giá tốt, HP cho thiết kế đẹp, Dell cho hiệu suất. Hãy xem spec trước khi quyết định.",
  },
  {
    id: 5,
    user: "Vũ Thị Lan",
    time: "hôm qua",
    question: "Laptop mua ở đâu rẻ nhất và an toàn nhất?",
    answer: "Mua ở những cửa hàng uy tín như TechMart, Thế Giới Di Động, FPT Shop. Nên mua bảo hành chính hãng để có quyền lợi tốt nhất.",
  },
  {
    id: 6,
    user: "Đặng Quốc Huy",
    time: "2 giờ trước",
    question: "Laptop cũ hay mới? Có nên mua laptop cũ?",
    answer: "Nên mua mới nếu có điều kiện. Laptop cũ có rủi ro pin hỏng, linh kiện worn out. Nếu mua cũ, chọn từ những đã sử dụng ít, có bảo hành.",
  },
]

export default function QASection() {
  const [question, setQuestion] = useState("")
  const [expandedId, setExpandedId] = useState(1)

  const handleSubmit = () => {
    if (!question.trim()) return alert("Vui lòng nhập câu hỏi")
    alert("Câu hỏi đã được gửi!")
    setQuestion("")
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="qa-wrapper">
      <div className="qa-header">
        <h2>Hỏi & Đáp - Giải đáp thắc mắc của bạn</h2>
        <p className="qa-subtitle">Đặt câu hỏi cho chúng tôi và nhận câu trả lời từ cộng đồng</p>
      </div>

      {/* Form đặt câu hỏi */}
      <div className="qa-form">
        <div className="qa-form-left">
          <img
            src="https://cdn2.cellphones.com.vn/insecure/rs:fill:160:0/q:90/plain/https://cellphones.com.vn/media/wysiwyg/ant-hello-2025.png"
            alt="support"
          />
        </div>

        <div className="qa-form-right">
          <h3>Hãy đặt câu hỏi cho chúng tôi</h3>
          <p>
            Chúng tôi sẽ phản hồi trong vòng <strong>1 giờ</strong>. Nếu gửi sau 22h,
            chúng tôi sẽ trả lời vào sáng hôm sau.
          </p>

          <div className="qa-input-group">
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button className="qa-submit-btn" onClick={handleSubmit}>
              Gửi câu hỏi
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="qa-list">
        <h3 className="qa-list-title">Câu hỏi thường gặp</h3>
        <div className="qa-items">
          {qaItems.map((item) => (
            <div
              key={item.id}
              className={`qa-item ${expandedId === item.id ? "expanded" : ""}`}
            >
              <div
                className="qa-item-header"
                onClick={() => toggleExpand(item.id)}
              >
                <div className="qa-item-title">
                  <span className="qa-user-info">{item.user} • {item.time}</span>
                  <p className="qa-question">{item.question}</p>
                </div>
                <FiChevronDown
                  className="qa-chevron"
                  size={24}
                />
              </div>

              {expandedId === item.id && (
                <div className="qa-item-body">
                  <div className="qa-reply">
                    <div className="qa-reply-header">Quản Trị Viên</div>
                    <p className="qa-reply-text">{item.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
