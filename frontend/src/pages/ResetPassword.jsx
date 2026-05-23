import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { resetPassword } = useAuth()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const token = searchParams.get("token") || ""

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setNotice("")

    if (!token) {
      setError("Thiếu token đặt lại mật khẩu")
      return
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    const result = await resetPassword(token, newPassword)
    if (!result.success) {
      setError(result.error || "Không thể đặt lại mật khẩu")
      return
    }

    setNotice(result.message || "Đặt lại mật khẩu thành công")
    setTimeout(() => {
      navigate("/", { replace: true })
    }, 1500)
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "20px" }}>
      <div style={{ maxWidth: "480px", width: "100%", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "24px", background: "#fff" }}>
        <h2 style={{ marginTop: 0 }}>Đặt lại mật khẩu</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <div style={{ color: "#b42318", background: "#fef3f2", border: "1px solid #fecdca", borderRadius: "6px", padding: "8px 10px" }}>{error}</div>}
          {notice && <div style={{ color: "#065f46", background: "#ecfdf3", border: "1px solid #abefc6", borderRadius: "6px", padding: "8px 10px" }}>{notice}</div>}
          <button type="submit" style={{ background: "#e30019", color: "#fff", border: "none", borderRadius: "6px", padding: "10px 12px", cursor: "pointer" }}>
            Xác nhận đổi mật khẩu
          </button>
        </form>
      </div>
    </div>
  )
}
