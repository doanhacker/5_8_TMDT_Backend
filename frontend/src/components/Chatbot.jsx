import { useEffect, useRef, useState } from 'react'
import { FiMessageCircle, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContextEnhanced'
import { chatWithLaptopShopAI, getLaptopShopAiHistory } from '../services/aiApi'
import '../styles/Chatbot.css'

const BOT_META = {
  name: 'TechMart AI Deep',
  version: '0.4.0',
}

const WELCOME_MESSAGE = {
  from: 'bot',
  text: 'Xin chào. Tôi có thể tư vấn laptop theo nhu cầu, ngân sách hoặc cấu hình bạn muốn.',
  suggestions: [
    'Laptop gaming tầm 25 triệu',
    'Laptop cho sinh viên dưới 15 triệu',
    'Tư vấn laptop lập trình RAM 16GB SSD 512GB',
  ],
  recommendations: [],
}

export default function Chatbot() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, isTyping, isLoadingHistory])

  useEffect(() => {
    if (loading) return

    let ignore = false

    const loadHistory = async () => {
      setIsLoadingHistory(true)
      setMessages([WELCOME_MESSAGE])

      try {
        const history = await getLaptopShopAiHistory()
        if (ignore) return

        if (Array.isArray(history) && history.length > 0) {
          setMessages(history.map((message) => ({
            from: message.from,
            text: message.text,
            suggestions: [],
            recommendations: [],
          })))
        } else {
          setMessages([WELCOME_MESSAGE])
        }
      } catch {
        if (!ignore) {
          setMessages([WELCOME_MESSAGE])
        }
      } finally {
        if (!ignore) {
          setIsLoadingHistory(false)
        }
      }
    }

    loadHistory()

    return () => {
      ignore = true
    }
  }, [user?.user_id, loading])

  const sendMessage = async (presetMessage) => {
    const content = String(presetMessage ?? input).trim()
    if (!content) return

    const nextHistory = [...messages, { from: 'user', text: content }]
    setMessages(nextHistory)
    setInput('')
    setIsTyping(true)

    try {
      const reply = await chatWithLaptopShopAI({
        message: content,
        history: nextHistory.map((message) => ({
          role: message.from === 'bot' ? 'assistant' : 'user',
          content: message.text,
        })),
      })

      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: reply.answer,
          suggestions: reply.follow_up_questions || [],
          recommendations: reply.recommendations || [],
          diagnostics: reply.diagnostics || null,
        },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: 'AI service hiện chưa phản hồi được. Bạn hãy kiểm tra backend Node và Python service rồi thử lại.',
          suggestions: ['Kiểm tra service AI', 'Laptop gaming tầm 20 triệu'],
          recommendations: [],
          diagnostics: { error: error.message },
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className={open ? 'chatbot-container open' : 'chatbot-container'}>
      <div className="chatbot-header" onClick={() => setOpen(!open)}>
        <span>TechMart AI</span>
        {open ? <FiX size={20} /> : <FiMessageCircle size={20} />}
      </div>

      {open && (
        <div className="chatbot-body">
          <div className="chatbot-subtitle">{BOT_META.name} v{BOT_META.version}</div>

          <div className="chatbot-messages">
            {isLoadingHistory ? <div className="chatmsg bot chatbot-typing">Đang tải lịch sử hội thoại...</div> : null}

            {messages.map((message, index) => (
              <div key={`${message.from}-${index}`} className={`chatmsg ${message.from}`}>
                <div>{message.text}</div>

                {Array.isArray(message.recommendations) && message.recommendations.length > 0 ? (
                  <div className="chatbot-recommendations">
                    {message.recommendations.map((item) => (
                      <button
                        key={`${message.text}-${item.id}`}
                        className="chatbot-product-card"
                        onClick={() => navigate(`/product/${item.id}`)}
                      >
                        <strong>{item.name}</strong>
                        <span>{item.price}</span>
                        <small>{item.config}</small>
                        {item.reasons?.length ? <em>{item.reasons.join(' • ')}</em> : null}
                        {item.tradeoffs?.length ? <p className="chatbot-tradeoff">{item.tradeoffs.join(' • ')}</p> : null}
                      </button>
                    ))}
                  </div>
                ) : null}

                {Array.isArray(message.suggestions) && message.suggestions.length > 0 ? (
                  <div className="chatbot-suggestion-list">
                    {message.suggestions.map((suggestion) => (
                      <button
                        key={`${index}-${suggestion}`}
                        className="chatbot-suggestion-chip"
                        onClick={() => sendMessage(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

             {isTyping ? <div className="chatmsg bot chatbot-typing">TechMart AI đang phân tích...</div> : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Ví dụ: laptop đồ họa dưới 30 triệu, RAM 16GB"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
            />
            <button onClick={() => sendMessage()}>Gửi</button>
          </div>
        </div>
      )}
    </div>
  )
}
