import { useEffect, useMemo, useState } from "react"
import { answerCommunityQuestion, getCommunityQuestions } from "../../services/communityQaApi"
import { getRealtimeClient } from "../../lib/realtimeClient"

const formatDateTime = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("vi-VN")
}

const normalizeItem = (item) => ({
  id: item?.id || item?.qa_id,
  user: String(item?.user || item?.user_name || "Khách hàng"),
  question: String(item?.question || item?.question_content || ""),
  answer: String(item?.answer || item?.answer_content || ""),
  createdAt: item?.createdAt || item?.created_at || null,
  updatedAt: item?.updatedAt || item?.updated_at || null,
})

export default function AdminCommunityQa() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [answerDrafts, setAnswerDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)

  const pendingCount = useMemo(() => items.filter((item) => !item.answer).length, [items])

  const loadItems = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await getCommunityQuestions(100)
      const normalized = Array.isArray(data) ? data.map(normalizeItem).filter((item) => item.id && item.question) : []
      setItems(normalized)
      setAnswerDrafts((prev) => {
        const next = { ...prev }
        for (const item of normalized) {
          if (next[item.id] == null) {
            next[item.id] = item.answer || ""
          }
        }
        return next
      })
    } catch (err) {
      setError(err.message || "Không tải được danh sách hỏi đáp")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    const socket = getRealtimeClient()

    const handleQaChanged = (payload) => {
      if (!payload?.item) return
      const incoming = normalizeItem(payload.item)
      if (!incoming.id || !incoming.question) return

      setItems((prev) => {
        const existingIndex = prev.findIndex((item) => String(item.id) === String(incoming.id))
        if (existingIndex === -1) {
          return [incoming, ...prev]
        }

        const next = [...prev]
        next[existingIndex] = {
          ...next[existingIndex],
          ...incoming,
          answer: incoming.answer,
        }
        return next
      })

      setAnswerDrafts((prev) => ({
        ...prev,
        [incoming.id]: incoming.answer || prev[incoming.id] || "",
      }))
    }

    socket.on("qa:changed", handleQaChanged)
    return () => {
      socket.off("qa:changed", handleQaChanged)
    }
  }, [])

  const handleAnswer = async (item) => {
    const content = String(answerDrafts[item.id] || "").trim()
    if (!content) {
      setError("Vui lòng nhập câu trả lời trước khi lưu")
      return
    }

    try {
      setSavingId(item.id)
      setError("")
      const updated = await answerCommunityQuestion({ id: item.id, answer: content })
      const normalized = normalizeItem(updated)

      setItems((prev) => prev.map((row) => (String(row.id) === String(normalized.id) ? { ...row, ...normalized } : row)))
      setAnswerDrafts((prev) => ({ ...prev, [item.id]: normalized.answer || content }))
    } catch (err) {
      setError(err.message || "Không thể trả lời câu hỏi")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="adm-card adm-card-pad">
      <div className="adm-card-title">
        <h3>Quản lý hỏi đáp người dùng</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="adm-pill">{items.length} câu hỏi</span>
          <span className="adm-pill adm-pill-muted">{pendingCount} chờ trả lời</span>
          <button type="button" className="adm-btn adm-btn-light" onClick={loadItems} disabled={loading}>
            {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
      </div>

      {error ? <p style={{ color: "#b42318", marginTop: 0 }}>{error}</p> : null}

      <div className="adm-table-wrap adm-product-list-scroll">
        <table className="adm-table2">
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>Người dùng</th>
              <th style={{ minWidth: 280 }}>Câu hỏi</th>
              <th style={{ minWidth: 320 }}>Câu trả lời</th>
              <th style={{ minWidth: 160 }}>Thời gian</th>
              <th style={{ minWidth: 140 }}>Trạng thái</th>
              <th style={{ minWidth: 130 }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#64748b" }}>Chưa có câu hỏi nào</td>
              </tr>
            ) : null}

            {items.map((item) => {
              const isSaving = savingId === item.id
              const hasAnswer = Boolean(item.answer)

              return (
                <tr key={item.id}>
                  <td>
                    <strong>{item.user}</strong>
                    <div style={{ color: "#64748b", fontSize: 12 }}>#{item.id}</div>
                  </td>
                  <td className="adm-ellipsis" style={{ maxWidth: 320 }}>{item.question}</td>
                  <td>
                    <textarea
                      value={answerDrafts[item.id] ?? item.answer ?? ""}
                      onChange={(event) => {
                        const next = event.target.value
                        setAnswerDrafts((prev) => ({ ...prev, [item.id]: next }))
                      }}
                      rows={3}
                      placeholder="Nhập câu trả lời cho người dùng..."
                      style={{ width: "100%", resize: "vertical", borderRadius: 8, border: "1px solid #d4c6ad", padding: 10 }}
                    />
                  </td>
                  <td>{formatDateTime(item.createdAt)}</td>
                  <td>
                    <span className={`adm-pill ${hasAnswer ? "" : "adm-pill-muted"}`}>
                      {hasAnswer ? "Đã trả lời" : "Chờ trả lời"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="adm-btn adm-btn-primary"
                      onClick={() => handleAnswer(item)}
                      disabled={isSaving}
                    >
                      {isSaving ? "Đang lưu..." : "Lưu trả lời"}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
