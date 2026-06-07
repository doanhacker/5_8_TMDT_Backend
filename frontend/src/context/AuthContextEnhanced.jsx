import { createContext, useContext, useState, useEffect, useRef } from "react"
import { buildApiUrl } from "../config/api"
import { clearAuthToken, getAuthToken, setAuthToken, setUnauthorizedHandler } from "../lib/authToken"

const AuthContext = createContext()

export function AuthProvider({ children, onAuthChange }) {
  // onAuthChange là prop tùy chọn — được truyền từ file gốc nơi AuthProvider
  // và CartProvider được khai báo (thường là App.jsx hoặc main.jsx).
  // Xem hướng dẫn tích hợp ở cuối file.

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Giữ ref để dùng trong các hàm async mà không cần re-render
  const onAuthChangeRef = useRef(onAuthChange)
  useEffect(() => {
    onAuthChangeRef.current = onAuthChange
  }, [onAuthChange])

  // ── Normalize user ──────────────────────────────────────────────────────────
  const normalizeUser = (userData) => {
    if (!userData) return null
    const primaryRole =
      userData.roles && userData.roles.length > 0
        ? userData.roles[0].role_name.toLowerCase()
        : "customer"
    return {
      ...userData,
      name: userData.full_name || userData.name,
      role: primaryRole,
    }
  }

  // ── Helper: set user + thông báo CartContext ────────────────────────────────
  const applyUser = async (userData) => {
    const normalized = normalizeUser(userData)
    setUser(normalized)
    // Gọi callback nếu có — CartContext sẽ merge + fetch cart
    if (onAuthChangeRef.current) {
      await onAuthChangeRef.current(normalized)
    }
    return normalized
  }

  const clearSession = async () => {
    clearAuthToken()
    localStorage.removeItem("user")
    setUser(null)
    if (onAuthChangeRef.current) {
      await onAuthChangeRef.current(null)
    }
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
    })

    return () => setUnauthorizedHandler(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Khôi phục session khi load app ─────────────────────────────────────────
  // THAY ĐỔI: Gọi onAuthChange sau khi restore để CartContext fetch cart
  // đúng theo user (thay vì chỉ dùng session_id của khách)
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken()

      if (!token) {
        localStorage.removeItem("user")
        if (onAuthChangeRef.current) {
          await onAuthChangeRef.current(null)
        }
        setLoading(false)
        return
      }

      try {
        const res = await fetch(buildApiUrl("/api/profile/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          await clearSession()
          setLoading(false)
          return
        }

        const payload = await res.json()
        if (payload.success && payload.data) {
          localStorage.setItem("user", JSON.stringify(payload.data))
          await applyUser(payload.data)
        } else {
          await clearSession()
        }
      } catch (error) {
        console.error("Error validating auth session:", error)
        await clearSession()
      }

      setLoading(false)
    }

    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── login ───────────────────────────────────────────────────────────────────
  // THAY ĐỔI: Gọi applyUser thay vì setUser trực tiếp
  const login = async (email, password) => {
    try {
      const res = await fetch(buildApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) return { success: false, error: data.message }

      if (data.data?.token) {
        setAuthToken(data.data.token)
        localStorage.setItem("user", JSON.stringify(data.data.user))
        // applyUser sẽ: setUser + gọi onAuthChange → CartContext merge + fetch
        await applyUser(data.data.user)
      }

      return { success: true, data: data.data }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Lỗi kết nối server" }
    }
  }

  // ── loginWithFacebook ───────────────────────────────────────────────────────
  // THAY ĐỔI: Gọi applyUser thay vì setUser trực tiếp
  const loginWithFacebook = async (accessToken) => {
    try {
      const res = await fetch(buildApiUrl("/api/auth/facebook"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      })

      const data = await res.json()
      if (!res.ok) return { success: false, error: data.message }

      if (data.data?.token) {
        setAuthToken(data.data.token)
        localStorage.setItem("user", JSON.stringify(data.data.user))
        await applyUser(data.data.user)
      }

      return { success: true, data: data.data }
    } catch (error) {
      console.error("Facebook login error:", error)
      return { success: false, error: "Lỗi kết nối server" }
    }
  }

  // ── register ────────────────────────────────────────────────────────────────
  // THAY ĐỔI: Gọi applyUser thay vì setUser trực tiếp
  const register = async (name, email, password, phone) => {
    try {
      const res = await fetch(buildApiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          email,
          password,
          phone_number: phone,
        }),
      })

      const data = await res.json()
      if (!res.ok) return { success: false, error: data.message }

      if (data.data?.token) {
        setAuthToken(data.data.token)
        localStorage.setItem("user", JSON.stringify(data.data.user))
        await applyUser(data.data.user)
      }

      return { success: true, data: data.data }
    } catch (error) {
      console.error("Register error:", error)
      return { success: false, error: "Lỗi kết nối server" }
    }
  }

  // ── logout ──────────────────────────────────────────────────────────────────
  // THAY ĐỔI: Gọi onAuthChange(null) trong finally để CartContext reset về cart
  // của session khách ngay cả khi API logout thất bại
  const logout = async () => {
    try {
      const token = getAuthToken()
      if (token) {
        await fetch(buildApiUrl("/api/auth/logout"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      // ignore network/logout API errors
    } finally {
      await clearSession()
    }
  }

  // ── forgotPassword, verifyResetCode, resetPassword ─────────────────────────
  // Không thay đổi — các hàm này không liên quan đến cart
  const forgotPassword = async (email) => {
    try {
      const res = await fetch(buildApiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.message }
      return { success: true, message: data.message }
    } catch (error) {
      console.error("Forgot password error:", error)
      return { success: false, error: "Lỗi kết nối server" }
    }
  }

  const verifyResetCode = async (email, code) => {
    try {
      const res = await fetch(buildApiUrl("/api/auth/verify-reset-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.message }
      return { success: true, message: data.message }
    } catch (error) {
      console.error("Verify reset code error:", error)
      return { success: false, error: "Lỗi kết nối server" }
    }
  }

  const resetPassword = async (email, code, newPassword) => {
    try {
      const res = await fetch(buildApiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.message }
      return { success: true, message: data.message }
    } catch (error) {
      console.error("Reset password error:", error)
      return { success: false, error: "Lỗi kết nối server" }
    }
  }

  const isAdmin = () => {
    if (!user) return false
    return user.role === "admin" || user.role === "staff"
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithFacebook,
        register,
        forgotPassword,
        verifyResetCode,
        resetPassword,
        logout,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

// ─── HƯỚNG DẪN TÍCH HỢP ─────────────────────────────────────────────────────
//
// Vì AuthProvider cần gọi onAuthChange từ CartContext, nhưng hai context
// không thể import lẫn nhau, dùng pattern "bridge" ở App.jsx hoặc main.jsx:
//
//   import { CartProvider, useCart } from './context/CartContext'
//   import { AuthProvider } from './context/AuthContext'
//
//   function AppProviders({ children }) {
//     // CartProvider bao ngoài để tồn tại trước
//     return (
//       <CartProvider>
//         <AuthBridge>{children}</AuthBridge>
//       </CartProvider>
//     )
//   }
//
//   // Component trung gian: lấy onAuthChange từ CartContext rồi truyền vào AuthProvider
//   function AuthBridge({ children }) {
//     const { onAuthChange } = useCart()
//     return (
//       <AuthProvider onAuthChange={onAuthChange}>
//         {children}
//       </AuthProvider>
//     )
//   }
//
//   // Sau đó trong App hoặc main.jsx:
//   <AppProviders>
//     <RouterProvider router={router} />  {/* hoặc <App /> */}
//   </AppProviders>
//
// ─────────────────────────────────────────────────────────────────────────────