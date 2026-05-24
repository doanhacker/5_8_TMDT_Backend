import "../styles/QASection.css"
import { useEffect, useState } from "react"
import { FiChevronDown } from "react-icons/fi"
import { getRealtimeClient } from "../lib/realtimeClient"
import { getCommunityQuestions, submitCommunityQuestion } from "../services/communityQaApi"

const fallbackQaItems = [
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

const normalizeQaItem = (item) => ({
  id: item?.id || item?.qa_id,
  user: String(item?.user || item?.user_name || "Khách hàng"),
  question: String(item?.question || item?.question_content || ""),
  answer: String(item?.answer || item?.answer_content || ""),
  time: String(item?.time || ""),
  createdAt: item?.createdAt || item?.created_at || null,
})

const formatRelativeTime = (value, fallback = "Vừa xong") => {
  if (!value) return fallback

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return fallback

  const diffMs = Date.now() - timestamp
  if (diffMs < 0) return fallback

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return "Vừa xong"
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} phút trước`
  if (diffMs < day) return `${Math.floor(diffMs / hour)} giờ trước`
  return `${Math.floor(diffMs / day)} ngày trước`
}

export default function QASection({ title = "Hỏi & Đáp - Giải đáp thắc mắc của bạn", subtitle = "Đặt câu hỏi cho chúng tôi và nhận câu trả lời từ cộng đồng", introTitle = "Hãy đặt câu hỏi cho chúng tôi", introText = "Chúng tôi sẽ phản hồi trong vòng 1 giờ. Nếu gửi sau 22h, chúng tôi sẽ trả lời vào sáng hôm sau.", listTitle = "Câu hỏi gần đây" } = {}) {
  const [question, setQuestion] = useState("")
  const [items, setItems] = useState(fallbackQaItems)
  const [expandedId, setExpandedId] = useState(fallbackQaItems[0]?.id || null)
  const [submitState, setSubmitState] = useState({ loading: false, message: "", error: false })

  useEffect(() => {
    let active = true

    const fetchQuestions = async () => {
      try {
        const data = await getCommunityQuestions(30)
        if (!active) return

        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map(normalizeQaItem).filter((item) => item.id && item.question)
          setItems(normalized)
          setExpandedId(normalized[0]?.id || null)
        }
      } catch {
        // Keep fallback data if API is unavailable.
      }
    }

    fetchQuestions()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const socket = getRealtimeClient()

    const handleQaChanged = (payload) => {
      if (!payload?.item) return

      const incoming = normalizeQaItem(payload.item)
      if (!incoming.id || !incoming.question) return

      setItems((prev) => {
        const existingIndex = prev.findIndex((item) => String(item.id) === String(incoming.id))
        if (existingIndex >= 0) {
          const next = [...prev]
          next[existingIndex] = {
            ...next[existingIndex],
            ...incoming,
            answer: incoming.answer,
          }
          return next
        }
        return [incoming, ...prev]
      })
      setExpandedId((current) => current || incoming.id)
    }

    socket.on("qa:changed", handleQaChanged)

    return () => {
      socket.off("qa:changed", handleQaChanged)
    }
  }, [])

  const handleSubmit = async () => {
    const content = question.trim()
    if (!content) {
      setSubmitState({ loading: false, message: "Vui lòng nhập câu hỏi", error: true })
      return
    }

    try {
      setSubmitState({ loading: true, message: "", error: false })
      const created = await submitCommunityQuestion({ question: content })
      const normalized = normalizeQaItem(created)

      setItems((prev) => {
        if (!normalized.id || prev.some((item) => String(item.id) === String(normalized.id))) {
          return prev
        }
        return [normalized, ...prev]
      })
      setExpandedId(normalized.id || null)
      setQuestion("")
      setSubmitState({ loading: false, message: "Đã gửi câu hỏi thành công", error: false })
    } catch (error) {
      setSubmitState({ loading: false, message: error.message || "Không thể gửi câu hỏi", error: true })
    }
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="qa-wrapper">
      <div className="qa-header">
        <h2>{title}</h2>
        <p className="qa-subtitle">{subtitle}</p>
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
          <h3>{introTitle}</h3>
          <p>{introText}</p>

          <div className="qa-input-group">
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button className="qa-submit-btn" onClick={handleSubmit} disabled={submitState.loading}>
              {submitState.loading ? "Đang gửi..." : "Gửi câu hỏi"}
            </button>
          </div>
          {submitState.message ? (
            <p className={`qa-form-message ${submitState.error ? "error" : "success"}`}>{submitState.message}</p>
          ) : null}
        </div>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="qa-list">
        <h3 className="qa-list-title">{listTitle}</h3>
        <div className="qa-items">
          {items.map((item) => (
            <div
              key={item.id}
              className={`qa-item ${expandedId === item.id ? "expanded" : ""}`}
            >
              <div
                className="qa-item-header"
                onClick={() => toggleExpand(item.id)}
              >
                <div className="qa-item-title">
                  <span className="qa-user-info">{item.user} • {formatRelativeTime(item.createdAt, item.time || "Vừa xong")}</span>
                  <p className="qa-question">{item.question}</p>
                </div>
                <FiChevronDown
                  className="qa-chevron"
                  size={24}
                />
              </div>

              {expandedId === item.id && (
                <div className="qa-item-body">
                  {item.answer ? (
                    <div className="qa-reply">
                      <div className="qa-reply-header">Quản Trị Viên</div>
                      <p className="qa-reply-text">{item.answer}</p>
                    </div>
                  ) : (
                    <div className="qa-reply pending">
                      <div className="qa-reply-header">Hệ thống</div>
                      <p className="qa-reply-text">Câu hỏi đang chờ phản hồi từ quản trị viên.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
