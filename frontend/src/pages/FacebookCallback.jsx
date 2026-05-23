import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const parseAccessTokenFromHash = (hash) => {
  const hashValue = (hash || "").replace(/^#/, "")
  const params = new URLSearchParams(hashValue)
  return params.get("access_token")
}

export default function FacebookCallback() {
  const navigate = useNavigate()
  const { loginWithFacebook } = useAuth()
  const [status, setStatus] = useState("Đang xử lý đăng nhập Facebook...")

  useEffect(() => {
    const processFacebookLogin = async () => {
      const accessToken = parseAccessTokenFromHash(window.location.hash)

      if (!accessToken) {
        setStatus("Không nhận được access token từ Facebook")
        return
      }

      const result = await loginWithFacebook(accessToken)
      if (!result.success) {
        setStatus(result.error || "Đăng nhập Facebook thất bại")
        return
      }

      setStatus("Đăng nhập Facebook thành công, đang chuyển hướng...")
      navigate("/", { replace: true })
    }

    processFacebookLogin()
  }, [loginWithFacebook, navigate])

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "20px" }}>
      <div style={{ maxWidth: "520px", width: "100%", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "24px", background: "#fff" }}>
        <h2 style={{ marginTop: 0 }}>Facebook Login</h2>
        <p style={{ marginBottom: 0 }}>{status}</p>
      </div>
    </div>
  )
}
