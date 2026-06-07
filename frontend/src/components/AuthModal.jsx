import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/AuthModal.css'

export default function AuthModal({ onClose }) {
  const [isRegister, setIsRegister] = useState(false)
  const [resetStep, setResetStep] = useState(0) // 0: không reset, 1: nhập email, 2: nhập mã, 3: nhập mật khẩu mới
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    resetCode: '',
    newPassword: '',
    confirmNewPassword: ''
  })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const { login, register, forgotPassword, verifyResetCode, resetPassword, loginWithFacebook } = useAuth()

  const toggleMode = () => {
    setIsRegister((prev) => !prev)
    setError('')
    setNotice('')
    setResetStep(0)
    setFormData({ name: '', email: '', password: '', phone: '', confirm: '', resetCode: '', newPassword: '', confirmNewPassword: '' })
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
    setNotice('')
  }

  // Bước 1: Gửi mã xác thực
  const handleSendResetCode = async () => {
    setError('')
    setNotice('')

    if (!formData.email) {
      setError('Vui lòng nhập email')
      return
    }

    const result = await forgotPassword(formData.email)
    if (result.success) {
      setNotice(result.message || 'Mã xác thực đã được gửi đến email của bạn')
      setResetStep(2) // Chuyển sang bước nhập mã
    } else {
      setError(result.error)
    }
  }

  // Bước 2: Xác thực mã
  const handleVerifyCode = async () => {
    setError('')
    setNotice('')

    if (!formData.resetCode) {
      setError('Vui lòng nhập mã xác thực')
      return
    }

    if (formData.resetCode.length !== 6) {
      setError('Mã xác thực phải có 6 số')
      return
    }

    const result = await verifyResetCode(formData.email, formData.resetCode)
    if (result.success) {
      setNotice('Mã xác thực hợp lệ')
      setResetStep(3) // Chuyển sang bước nhập mật khẩu mới
    } else {
      setError(result.error)
    }
  }

  // Bước 3: Đặt lại mật khẩu
  const handleResetPassword = async () => {
    setError('')
    setNotice('')

    if (!formData.newPassword || !formData.confirmNewPassword) {
      setError('Vui lòng nhập đầy đủ mật khẩu mới')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    const result = await resetPassword(formData.email, formData.resetCode, formData.newPassword)
    if (result.success) {
      setNotice(result.message || 'Đặt lại mật khẩu thành công!')
      setTimeout(() => {
        onClose() // Đóng modal sau khi thành công
      }, 1500)
    } else {
      setError(result.error)
    }
  }

  const handleFacebookLogin = () => {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID
    if (!appId || appId === 'your_facebook_app_id' || appId === '123456789') {
      setError('Thiếu cấu hình VITE_FACEBOOK_APP_ID hợp lệ trong file .env')
      return
    }

    const redirectUri = `${window.location.origin}/auth/facebook-callback`
    const scope = encodeURIComponent("email,public_profile")
    const facebookOauthUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}`
    window.location.href = facebookOauthUrl
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')

  if (isRegister) {
    if (formData.password !== formData.confirm) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.phone
    )

    if (result.success) {
      onClose()
    } else {
      setError(result.error)
    }

  } else {
    const result = await login(
      formData.email,
      formData.password
    )

    if (result.success) {
      onClose()
    } else {
      setError(result.error)
    }
  }
}

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-container" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>&times;</button>
        
        {/* Hiển thị form dựa theo resetStep */}
        {resetStep === 0 && (
          <>
            <h2>{isRegister ? 'Đăng ký' : 'Đăng nhập'}</h2>
            <form className="auth-form" onSubmit={handleSubmit}>
              {isRegister && (
                <input 
                  type="text" 
                  placeholder="Họ tên" 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange}
                  required 
                />
              )}
              <input 
                type="email" 
                placeholder="Email" 
                name="email" 
                value={formData.email}
                onChange={handleChange}
                required 
              />
              {isRegister && (
                <input
                  type="text"
                  placeholder="Số điện thoại"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              )}
              <input
                type="password"
                placeholder="Mật khẩu"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {isRegister && (
                <input
                  type="password"
                  placeholder="Xác nhận mật khẩu"
                  name="confirm"
                  value={formData.confirm}
                  onChange={handleChange}
                  required
                />
              )}
              {error && <div className="auth-error">{error}</div>}
              {notice && <div className="auth-notice">{notice}</div>}
              <button type="submit" className="auth-submit">
                {isRegister ? 'Đăng ký' : 'Đăng nhập'}
              </button>
              {!isRegister && (
                <>
                  <button type="button" className="auth-submit auth-fb-btn" onClick={handleFacebookLogin}>
                    Đăng nhập với Facebook
                  </button>
                  <button
                    type="button"
                    className="auth-forgot"
                    onClick={() => {
                      setResetStep(1)
                      setError('')
                      setNotice('')
                    }}
                  >
                    Quên mật khẩu?
                  </button>
                </>
              )}
            </form>
            <p className="auth-switch">
              {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
              <button type="button" onClick={toggleMode} className="auth-toggle">
                {isRegister ? 'Đăng nhập' : 'Đăng ký'}
              </button>
            </p>
            <div className="auth-demo">
              <p style={{ fontSize: '12px', color: '#666', marginTop: '15px' }}>
                <strong>Tài khoản test (ô Email / ô Mật khẩu):</strong><br/>
                Admin: admin.test@laptop-shop.com / Admin@123<br/>
                (hoặc admin@laptop-shop.com / Admin@123)<br/>
                Khách: khachhang01@example.com / P@ssword123<br/>
              </p>
            </div>
          </>
        )}

        {/* Bước 1: Nhập email để nhận mã */}
        {resetStep === 1 && (
          <>
            <h2>Quên mật khẩu</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Nhập email để nhận mã xác thực
            </p>
            <div className="auth-form">
              <input 
                type="email" 
                placeholder="Email" 
                name="email" 
                value={formData.email}
                onChange={handleChange}
                required 
              />
              {error && <div className="auth-error">{error}</div>}
              {notice && <div className="auth-notice">{notice}</div>}
              <button type="button" className="auth-submit" onClick={handleSendResetCode}>
                Gửi mã xác thực
              </button>
              <button
                type="button"
                className="auth-forgot"
                onClick={() => {
                  setResetStep(0)
                  setError('')
                  setNotice('')
                }}
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </>
        )}

        {/* Bước 2: Nhập mã xác thực */}
        {resetStep === 2 && (
          <>
            <h2>Xác thực mã</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Nhập mã 6 số đã được gửi đến email: <strong>{formData.email}</strong>
            </p>
            <div className="auth-form">
              <input 
                type="text" 
                placeholder="Mã xác thực (6 số)" 
                name="resetCode" 
                value={formData.resetCode}
                onChange={handleChange}
                maxLength={6}
                pattern="[0-9]{6}"
                required 
              />
              {error && <div className="auth-error">{error}</div>}
              {notice && <div className="auth-notice">{notice}</div>}
              <button type="button" className="auth-submit" onClick={handleVerifyCode}>
                Xác nhận mã
              </button>
              <button
                type="button"
                className="auth-forgot"
                onClick={handleSendResetCode}
              >
                Gửi lại mã
              </button>
              <button
                type="button"
                className="auth-forgot"
                onClick={() => {
                  setResetStep(0)
                  setError('')
                  setNotice('')
                }}
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </>
        )}

        {/* Bước 3: Nhập mật khẩu mới */}
        {resetStep === 3 && (
          <>
            <h2>Đặt lại mật khẩu</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Nhập mật khẩu mới cho tài khoản của bạn
            </p>
            <div className="auth-form">
              <input 
                type="password" 
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" 
                name="newPassword" 
                value={formData.newPassword}
                onChange={handleChange}
                required 
              />
              <input 
                type="password" 
                placeholder="Xác nhận mật khẩu mới" 
                name="confirmNewPassword" 
                value={formData.confirmNewPassword}
                onChange={handleChange}
                required 
              />
              {error && <div className="auth-error">{error}</div>}
              {notice && <div className="auth-notice">{notice}</div>}
              <button type="button" className="auth-submit" onClick={handleResetPassword}>
                Đặt lại mật khẩu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
