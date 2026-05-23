import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiArrowRight,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiEdit3,
  FiHome,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiPlus,
  FiShoppingCart,
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import * as userProfileApi from '../services/userProfileApi'
import '../styles/UserProfile.css'

const createEmptyAddressForm = () => ({
  receiver_name: '',
  receiver_phone: '',
  specific_address: '',
  ward: '',
  district: '',
  province: '',
  is_default: false,
})

export default function UserProfileEnhanced() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [profileForm, setProfileForm] = useState({ full_name: '', phone_number: '' })
  const [addresses, setAddresses] = useState([])
  const [addressForm, setAddressForm] = useState(createEmptyAddressForm())
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [profileEditorOpen, setProfileEditorOpen] = useState(false)
  const [addressEditorOpen, setAddressEditorOpen] = useState(false)

  const activeAddressCount = useMemo(() => addresses.length, [addresses])
  const defaultAddress = useMemo(
    () => addresses.find((address) => address.is_default) || null,
    [addresses]
  )
  const contactEmail = user?.email || 'Chua co email hien thi'
  const profileCompletion = useMemo(() => {
    const completedFields = [
      profileForm.full_name,
      profileForm.phone_number,
      contactEmail,
      defaultAddress?.specific_address,
    ].filter((value) => String(value || '').trim() && String(value || '').trim() !== 'Chua co email hien thi').length

    return Math.round((completedFields / 4) * 100)
  }, [contactEmail, defaultAddress?.specific_address, profileForm.full_name, profileForm.phone_number])
  const quickActions = [
    {
      title: 'Theo dõi đơn hàng',
      description: 'Xem tình trạng giao hàng và lịch sử mua sắm.',
      icon: FiPackage,
      onClick: () => navigate('/order-tracking'),
    },
    {
      title: 'Mở giỏ hàng',
      description: 'Kiểm tra sản phẩm đang lưu trước khi thanh toán.',
      icon: FiShoppingCart,
      onClick: () => navigate('/cart'),
    },
    {
      title: 'Về trang chủ',
      description: 'Tiếp tục khám phá sản phẩm và ưu đãi mới.',
      icon: FiHome,
      onClick: () => navigate('/'),
    },
  ]

  const loadData = async () => {
    try {
      setLoading(true)
      const [profileResponse, addressResponse] = await Promise.all([
        userProfileApi.getMyProfile(),
        userProfileApi.getMyAddresses(),
      ])

      const profile = profileResponse?.data || {}
      setProfileForm({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
      })

      setAddresses(Array.isArray(addressResponse?.data) ? addressResponse.data : [])
    } catch (error) {
      alert(`Không thể tải trang cá nhân: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/')
    }
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!authLoading && user) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user])

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    try {
      setSavingProfile(true)
      await userProfileApi.updateMyProfile(profileForm)
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          localStorage.setItem('user', JSON.stringify({
            ...parsed,
            full_name: profileForm.full_name,
            phone_number: profileForm.phone_number,
          }))
        } catch {
          // Ignore localStorage parse issue.
        }
      }
      alert('Đã cập nhật thông tin cá nhân')
    } catch (error) {
      alert(`Không thể cập nhật thông tin: ${error.message}`)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleAddressSubmit = async (event) => {
    event.preventDefault()

    try {
      setSavingAddress(true)

      if (editingAddressId) {
        await userProfileApi.updateMyAddress(editingAddressId, addressForm)
      } else {
        await userProfileApi.createMyAddress(addressForm)
      }

      setAddressForm(createEmptyAddressForm())
      setEditingAddressId(null)
      await loadData()
    } catch (error) {
      alert(`Không thể lưu địa chỉ: ${error.message}`)
    } finally {
      setSavingAddress(false)
    }
  }

  const handleEditAddress = (address) => {
    setEditingAddressId(address.address_id)
    setAddressEditorOpen(true)
    setAddressForm({
      receiver_name: address.receiver_name || '',
      receiver_phone: address.receiver_phone || '',
      specific_address: address.specific_address || '',
      ward: address.ward || '',
      district: address.district || '',
      province: address.province || '',
      is_default: Boolean(address.is_default),
    })
  }

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này không?')) return

    try {
      await userProfileApi.deleteMyAddress(addressId)
      await loadData()
    } catch (error) {
      alert(`Không thể xóa địa chỉ: ${error.message}`)
    }
  }

  const handleSetDefaultAddress = async (address) => {
    try {
      await userProfileApi.updateMyAddress(address.address_id, {
        ...address,
        is_default: true,
      })
      await loadData()
    } catch (error) {
      alert(`Không thể đặt địa chỉ mặc định: ${error.message}`)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading-card">
          <p>Đang tải trang cá nhân...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <section className="profile-actions-hero">
          <div className="profile-actions-hero-head">
            <div className="profile-actions-hero-title">
              <span className="profile-card-icon profile-card-icon-large"><FiArrowRight /></span>
              <div>
                
                <h1>Hồ sơ hoàn thiện {profileCompletion}%</h1>
              </div>
            </div>
            <div className="profile-actions-hero-note">
              <span><FiCheckCircle /> {defaultAddress ? 'sẵn sàng đặt hàng nhanh' : 'hãy thêm địa chỉ mặc định'}</span>
              <small>{defaultAddress ? 'Bạn đã có địa chỉ giao hàng ưu tiên cho các đơn hàng mới.' : 'Đặt địa chỉ mặc định để thanh toán gọn hơn.'}</small>
            </div>
          </div>

          <div className="profile-quick-actions profile-quick-actions-featured">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.title}
                  type="button"
                  className="profile-quick-action profile-quick-action-featured"
                  onClick={action.onClick}
                >
                  <span className="profile-quick-icon profile-quick-icon-featured"><Icon /></span>
                  <span className="profile-quick-copy">
                    <strong>{action.title}</strong>
                    <small>{action.description}</small>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="profile-main-grid">
            <section className="profile-card">
              <div className="profile-section-split profile-section-split-center">
                <div className="profile-card-head">
                  <span className="profile-card-icon"><FiEdit3 /></span>
                  <div >               
                    <h3>Thông tin tài khoản</h3>
                  </div>
                </div>
                <button
                  type="button"
                  className="profile-toggle-button"
                  onClick={() => setProfileEditorOpen((prev) => !prev)}
                >
                  {profileEditorOpen ? <FiChevronUp /> : <FiChevronDown />}
                  {profileEditorOpen ? 'Thu gọn' : 'Chỉnh sửa'}
                </button>
              </div>

              <div className="profile-compact-summary">
                <div className="profile-compact-item">
                  <span>Họ tên</span>
                  <strong>{profileForm.full_name || 'Chưa cập nhật'}</strong>
                </div>
                <div className="profile-compact-item">
                  <span>Số điện thoại</span>
                  <strong>{profileForm.phone_number || 'Chưa cập nhật'}</strong>
                </div>
                <div className="profile-compact-item">
                  <span>Email</span>
                  <strong>{contactEmail}</strong>
                </div>
              </div>

              {profileEditorOpen ? (
                <form className="profile-form profile-account-form profile-form-collapsible" onSubmit={handleSaveProfile}>
                  <label>
                    Họ và tên
                    <input
                      value={profileForm.full_name}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, full_name: event.target.value }))}
                      required
                    />
                  </label>

                  <label>
                    Số điện thoại
                    <input
                      value={profileForm.phone_number}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, phone_number: event.target.value }))}
                      placeholder="VD: 0901234567"
                    />
                  </label>

                  <div className="profile-readonly-field">
                    <span className="profile-readonly-label">Email đăng nhập</span>
                    <div className="profile-readonly-value">
                      <FiMail />
                      <strong>{contactEmail}</strong>
                    </div>
                  </div>

                  <div className="profile-inline-note">
                    <FiPhone />
                    <span>Thông tin này sẽ được dùng cho xác nhận giao hàng và liên hệ khi cần.</span>
                  </div>

                  <button type="submit" className="profile-primary-button" disabled={savingProfile}>
                    {savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
                  </button>
                </form>
              ) : null}
            </section>

            <section className="profile-card">
              <div className="profile-section-split profile-section-split-center">
                <div className="profile-card-head">
                  <span className="profile-card-icon"><FiHome /></span>
                  <div>
                    <h3>Địa chỉ giao hàng</h3>
                  </div>
                </div>
                <div className="profile-section-actions">
                  <span className="profile-count-badge">{activeAddressCount} địa chỉ</span>
                  <button
                    type="button"
                    className="profile-toggle-button"
                    onClick={() => setAddressEditorOpen((prev) => !prev)}
                  >
                    {addressEditorOpen ? <FiChevronUp /> : <FiChevronDown />}
                    {addressEditorOpen ? 'Thu gọn' : 'Thêm / Sửa'}
                  </button>
                </div>
              </div>

              {defaultAddress ? (
                <div className="profile-default-spotlight">
                  <div className="profile-default-spotlight-head">
                    <span className="profile-card-icon profile-card-icon-small"><FiMapPin /></span>
                    <div>
                      <p className="profile-kicker">Địa chỉ mặc định</p>
                    </div>
                  </div>
                  <p>{defaultAddress.specific_address}, {defaultAddress.ward}, {defaultAddress.district}, {defaultAddress.province}</p>
                  <div className="profile-default-meta">
                    <span><FiPhone /> {defaultAddress.receiver_phone}</span>
                    <span><FiCheckCircle /> Sẵn sàng cho đơn hàng tiếp theo</span>
                  </div>
                </div>
              ) : (
                <div className="profile-soft-banner">
                  <FiClock />
                  <span>Bạn chưa có địa chỉ mặc định. Hãy chọn một địa chỉ để thanh toán nhanh hơn.</span>
                </div>
              )}

              {addressEditorOpen ? (
                <form className="profile-form profile-form-grid profile-form-collapsible" onSubmit={handleAddressSubmit}>
                  <label>
                    Người nhận
                    <input
                      value={addressForm.receiver_name}
                      onChange={(event) => setAddressForm((prev) => ({ ...prev, receiver_name: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Số điện thoại
                    <input
                      value={addressForm.receiver_phone}
                      onChange={(event) => setAddressForm((prev) => ({ ...prev, receiver_phone: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="profile-span-2">
                    Địa chỉ cụ thể
                    <input
                      value={addressForm.specific_address}
                      onChange={(event) => setAddressForm((prev) => ({ ...prev, specific_address: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Phường/Xã
                    <input
                      value={addressForm.ward}
                      onChange={(event) => setAddressForm((prev) => ({ ...prev, ward: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Quận/Huyện
                    <input
                      value={addressForm.district}
                      onChange={(event) => setAddressForm((prev) => ({ ...prev, district: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="profile-span-2">
                    Tỉnh/Thành phố
                    <input
                      value={addressForm.province}
                      onChange={(event) => setAddressForm((prev) => ({ ...prev, province: event.target.value }))}
                      required
                    />
                  </label>

                  <label className="profile-checkbox profile-span-2">
                    <input
                      type="checkbox"
                      checked={addressForm.is_default}
                      onChange={(event) => setAddressForm((prev) => ({ ...prev, is_default: event.target.checked }))}
                    />
                    <span>Đặt làm địa chỉ mặc định</span>
                  </label>

                  <div className="profile-actions profile-span-2">
                    <button type="submit" className="profile-primary-button" disabled={savingAddress}>
                      {savingAddress ? 'Đang lưu...' : editingAddressId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
                    </button>
                    {editingAddressId ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setEditingAddressId(null)
                          setAddressEditorOpen(false)
                          setAddressForm(createEmptyAddressForm())
                        }}
                      >
                        Hủy chỉnh sửa
                      </button>
                    ) : (
                      <span className="profile-secondary-note"><FiPlus /> Bạn có thể lưu nhiều địa chỉ cho các nhu cầu khác nhau.</span>
                    )}
                  </div>
                </form>
              ) : null}

              <div className="address-list">
                {addresses.length === 0 ? (
                  <div className="profile-empty-state">
                    <FiMapPin />
                    <div>
                      <strong>Chưa có địa chỉ giao hàng</strong>
                      <p>Thêm địa chỉ đầu tiên để quá trình đặt hàng trở nên nhanh và chính xác hơn.</p>
                    </div>
                  </div>
                ) : null}

                {addresses.map((address) => (
                  <article key={address.address_id} className={`address-item ${address.is_default ? 'address-item-default' : ''}`}>
                    <header className="address-item-head">
                      <div>
                        <strong>{address.receiver_name}</strong>
                        <p>{address.receiver_phone}</p>
                      </div>
                      {address.is_default ? <span className="address-default">Mặc định</span> : null}
                    </header>

                    <div className="address-item-body">
                      <span className="address-line-icon"><FiMapPin /></span>
                      <p>{address.specific_address}, {address.ward}, {address.district}, {address.province}</p>
                    </div>

                    <div className="address-actions">
                      <button type="button" onClick={() => handleEditAddress(address)}>Chỉnh sửa</button>
                      {!address.is_default ? (
                        <button type="button" onClick={() => handleSetDefaultAddress(address)}>Đặt mặc định</button>
                      ) : null}
                      <button type="button" className="btn-danger" onClick={() => handleDeleteAddress(address.address_id)}>Xóa</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
        </section>
      </div>
    </div>
  )
}
