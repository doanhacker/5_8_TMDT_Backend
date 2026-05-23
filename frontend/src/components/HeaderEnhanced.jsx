import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiBell,
  FiChevronRight,
  FiList,
  FiLogOut,
  FiPackage,
  FiShoppingCart,
  FiUser
} from 'react-icons/fi'
import {
  MdFiberNew,
  MdHeadset,
  MdLaptopMac,  
  MdLocalOffer,
  MdLocalShipping,
  MdLocationOn,
  MdPhone,
  MdPhoneIphone,
  MdVerifiedUser,
  MdWatch
} from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { buildApiUrl } from '../config/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useNotifications } from '../context/NotificationContext'
import AuthModal from './AuthModal'
import SearchSuggestBox from './SearchSuggestBox'
import '../styles/header.css'

export default function Header() {
  const [showAuth, setShowAuth] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [categoryItems, setCategoryItems] = useState([])
  const categoryMenuRef = useRef(null)
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()
  const { getTotalItems } = useCart()
  const { unreadCount } = useNotifications()

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(buildApiUrl('/api/product-categories'))
        const data = await res.json().catch(() => ({}))
        setCategoryItems(Array.isArray(data?.data) ? data.data : [])
      } catch {
        setCategoryItems([])
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!categoryMenuRef.current?.contains(event.target)) {
        setShowCategoryMenu(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const topBarContent = [
    { icon: MdLocalOffer, text: 'Thu cũ giá ngon - Lên đời tiết kiệm' },
    { icon: MdVerifiedUser, text: 'Sản phẩm chính hãng - Xuất VAT đầy đủ' },
    { icon: MdLocalShipping, text: 'Giao nhanh - Miễn phí cho đơn 300K' },
    { icon: MdLocationOn, text: 'Cửa hàng gần bạn' },
    { icon: FiPackage, text: 'Tra cứu đơn hàng' },
    { icon: MdPhone, text: '1800 2097' }
  ]

     const categoryMenuGroups = [
    { label: 'Laptop',          icon: MdLaptopMac,   route: '/laptop', keywords: ['laptop'], fallbackPath: '/laptop' },
    { label: 'Điện thoại',      icon: MdPhoneIphone, keywords: ['phone', 'điện thoại'], fallbackPath: '/products?category=phone' },
    { label: 'Đồng hồ thông minh', icon: MdWatch,    keywords: ['watch', 'đồng hồ'], fallbackPath: '/products?category=watch' },
    { label: 'Tai nghe',        icon: MdHeadset,     keywords: ['headphone', 'tai nghe'], fallbackPath: '/products?category=headphone' },
    { label: 'Phụ kiện',        icon: MdLocalOffer,  keywords: ['accessory', 'phụ kiện'], fallbackPath: '/products?category=accessory' },
  ]
  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  const handleAdminClick = () => {
    setShowUserMenu(false)
    navigate('/admin')
  }

  const handleUserClick = () => {
    navigate('/laptop')
  }

  const normalize = (value) =>
    String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const navigateByKeywords = (item) => {
    const matchedCategory = categoryItems.find((category) => {
      const name = normalize(category.category_name)
      return item.keywords?.some((keyword) => name.includes(normalize(keyword)))
    })

    if (matchedCategory) {
      navigate(`/categories/${matchedCategory.category_id}`)
      return true
    }

    if (item.route) {
      navigate(item.route)
      return true
    }

    if (item.fallbackPath) {
      navigate(item.fallbackPath)
      return true
    }

    return false
  }

  const handleCategoryGroupClick = (item) => {
    setShowCategoryMenu(false)
    if (!navigateByKeywords(item)) {
      navigate('/')
    }
  }

  return (  
    <>
      <div style={styles.headerShell}>
        <div style={styles.topBar}>
          <div style={styles.topBarTrack}>
            <div style={styles.topBarGroup}>
              {topBarContent.map((item, index) => {
                const IconComponent = item.icon
                return (
                  <span style={styles.topBarItem} key={`topbar-1-${index}`}>
                    <IconComponent size={16} style={{ marginRight: 6, flexShrink: 0 }} />
                    {item.text}
                    <span style={styles.topBarDivider}>•</span>
                  </span>
                )
              })}
            </div>
            <div style={styles.topBarGroup} aria-hidden="true">
              {topBarContent.map((item, index) => {
                const IconComponent = item.icon
                return (
                  <span style={styles.topBarItem} key={`topbar-2-${index}`}>
                    <IconComponent size={16} style={{ marginRight: 6, flexShrink: 0 }} />
                    {item.text}
                    <span style={styles.topBarDivider}>•</span>
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        <header style={styles.header} className="header-enhanced-main">
          <div style={styles.headerInner} className="header-enhanced-inner">
            <div style={styles.headerLeading} className="header-enhanced-leading">
              <div style={styles.logo} onClick={() => navigate('/')}>TechMart</div>

              <div style={styles.leftGroup}>
                <div style={styles.categoryMenuWrap} ref={categoryMenuRef}>
                  <button
                    type="button"
                    style={styles.categoryBtn}
                    className="header-enhanced-category-btn"
                    aria-expanded={showCategoryMenu}
                    onClick={() => setShowCategoryMenu((prev) => !prev)}
                  >
                    <FiList size={20} aria-hidden />
                    <span>Danh mục</span>
                  </button>
                {showCategoryMenu ? (
                  <div style={styles.categoryDropdown}>
                    {categoryMenuGroups.map((item) => {
                      const IconComponent = item.icon
                      return (
                        <button
                          key={item.label}
                          style={styles.categoryPanelItem}
                          className="header-enhanced-dropdown-item"
                          type="button"
                          onClick={() => handleCategoryGroupClick(item)}
                        >
                          <span style={styles.categoryPanelIcon}>
                            <IconComponent size={22} />
                          </span>
                          <span style={styles.categoryPanelLabel}>{item.label}</span>
                          <FiChevronRight size={18} style={styles.categoryPanelArrow} />
                        </button>
                      )
                    })}
                  </div>
                ) : null}
                </div>

                <button
                  type="button"
                  style={styles.newsWrapper}
                  className="header-enhanced-news"
                  onClick={() => navigate('/news')}
                >
                  <span style={styles.actionLabel}>Tin tức</span>
                  <div style={styles.newsIcon}>
                    <MdFiberNew size={26} aria-hidden />
                    <span style={styles.newsBadge}>0</span>
                  </div>
                </button>
              </div>
            </div>

            <div style={styles.midColumn} className="header-enhanced-mid">
              <div className="header-search-area header-enhanced-search" style={styles.searchInMid}>
                <SearchSuggestBox />
              </div>
            </div>

            <div style={styles.actions} className="header-enhanced-actions">
              <button
                type="button"
                style={styles.cartWrapper}
                className="header-enhanced-action-tile"
                onClick={() => navigate('/cart')}
              >
                <span style={styles.actionLabel}>Giỏ hàng</span>
                <div style={styles.cartIcon}>
                  <FiShoppingCart size={24} aria-hidden />
                  <span style={styles.cartBadge}>{getTotalItems()}</span>
                </div>
              </button>

              <button
                type="button"
                style={styles.notificationWrapper}
                className="header-enhanced-action-tile"
                onClick={() => navigate('/notifications')}
              >
                <span style={styles.actionLabel}>Thông báo</span>
                <div style={styles.notificationIcon}>
                  <FiBell size={24} aria-hidden />
                  {user && unreadCount > 0 ? <span style={styles.notificationBadge}>{unreadCount}</span> : null}
                </div>
              </button>

              {user ? (
                <div style={styles.userMenu}>
                  <button
                    type="button"
                    style={styles.userBtn}
                    className="header-enhanced-user-btn"
                    onClick={() => setShowUserMenu((prev) => !prev)}
                  >
                    <span style={styles.userBtnText}>{user.name}</span>
                    <FiUser size={22} aria-hidden />
                  </button>
                  {showUserMenu ? (
                    <div style={styles.userDropdown}>
                    
                      {isAdmin() ? (
                        <button className="user-dropdown-item" onClick={handleAdminClick}>
                          Trang quản trị
                        </button>
                      ) : null}
                      {isAdmin() ? (
                        <button className="user-dropdown-item" onClick={handleUserClick}>
                          Trang người dùng
                        </button>
                      ) : null}
                      <button
                        className="user-dropdown-item"
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/profile')
                        }}
                      >
                        <FiUser size={16} />
                        Trang cá nhân
                      </button>
                      <button
                        className="user-dropdown-item"
                        onClick={() => {
                          setShowUserMenu(false)
                          navigate('/order-tracking')
                        }}
                      >
                        <FiPackage size={16} />
                        Theo dõi đơn hàng
                      </button>
                      <button className="user-dropdown-item" onClick={handleLogout}>
                        <FiLogOut size={16} />
                        Đăng xuất
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <button type="button" style={styles.loginBtn} className="header-enhanced-login" onClick={() => setShowAuth(true)}>
                  Đăng nhập
                  <FiUser size={22} aria-hidden />
                </button>
              )}
            </div>
          </div>
        </header>
      </div>
      {showAuth ? <AuthModal onClose={() => setShowAuth(false)} /> : null}
    </>
  )
}

const styles = {
  headerLeading: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexShrink: 0,
    flexWrap: 'wrap',
    rowGap: '10px'
  },

  headerShell: {
    fontFamily: '"Roboto", "Helvetica Neue", Arial, sans-serif'
  },

  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
    flexWrap: 'wrap'
  },

  actionLabel: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.03em',
    opacity: 0.95,
    textAlign: 'center',
    lineHeight: 1.2
  },

  userBtnText: {
    maxWidth: '132px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  midColumn: {
    flex: '1 1 300px',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center'
  },

  searchInMid: {
    width: '100%',
    maxWidth: '560px',
    margin: '0 auto',
    minWidth: 0
  },

  topBar: {
    background: 'linear-gradient(90deg, #c41e3a 0%, #d70018 45%, #b30f25 100%)',
    color: '#fff',
    fontSize: '12px',
    padding: '8px 20px',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
  },

  topBarTrack: {
    display: 'flex',
    alignItems: 'center',
    width: 'max-content',
    animation: 'topBarScroll 20s linear infinite'
  },

  topBarGroup: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0
  },

  topBarItem: {
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: '600',
    marginRight: '2px'
  },

  topBarDivider: {
    opacity: 0.45,
    margin: '0 14px'
  },

  header: {
    background: 'linear-gradient(180deg, #ff0f2f 0%, #e30019 52%, #cf0015 100%)',
    color: '#fff',
    width: '100%'
  },

  headerInner: {
    width: '100%',
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '14px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    rowGap: '14px',
    flexWrap: 'wrap'
  },

  logo: {
    fontSize: '28px',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    cursor: 'pointer',
    userSelect: 'none',
    lineHeight: 1,
    textShadow: '0 1px 2px rgba(0,0,0,0.12)'
  },

  categoryBtn: {
    background: 'linear-gradient(180deg, #ff5a5c 0%, #e0182f 100%)',
    border: '1px solid rgba(255,255,255,0.28)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
    padding: '12px 18px',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 700
  },

  categoryMenuWrap: {
    position: 'relative'
  },

  categoryDropdown: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    left: 0,
    width: 'min(300px, calc(100vw - 32px))',
    maxHeight: '420px',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.18)',
    zIndex: 1300,
    padding: '8px'
  },

  categoryPanelItem: {
    width: '100%',
    border: 'none',
    borderRadius: '12px',
    background: 'transparent',
    color: '#2b2f36',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 14px',
    textAlign: 'left',
    cursor: 'pointer'
  },

  categoryPanelIcon: {
    color: '#ff1f3d',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },

  categoryPanelLabel: {
    flex: 1,
    fontSize: '15px',
    fontWeight: '700',
    lineHeight: 1.35
  },

  categoryPanelArrow: {
    color: '#a6acb7',
    flexShrink: 0
  },

  actions: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    flexShrink: 0,
    flexWrap: 'wrap'
  },

  cartWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 10px',
    borderRadius: '12px',
    color: '#fff'
  },

  cartIcon: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },

  cartBadge: {
    position: 'absolute',
    top: '-6px',
    right: '-10px',
    background: '#ffb800',
    color: '#1a1a1a',
    fontSize: '11px',
    fontWeight: 800,
    borderRadius: '999px',
    padding: '2px 6px',
    minWidth: '18px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  },

  newsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 10px',
    borderRadius: '12px',
    color: '#fff'
  },

  newsIcon: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },

  newsBadge: {
    position: 'absolute',
    top: '-6px',
    right: '-10px',
    background: '#ffb800',
    color: '#1a1a1a',
    fontSize: '11px',
    fontWeight: 800,
    borderRadius: '999px',
    padding: '2px 6px',
    minWidth: '18px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  },

  notificationWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 10px',
    borderRadius: '12px',
    color: '#fff'
  },

  notificationIcon: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },

  notificationBadge: {
    position: 'absolute',
    top: '-6px',
    right: '-10px',
    background: '#ffb800',
    color: '#1a1a1a',
    fontSize: '11px',
    fontWeight: 800,
    borderRadius: '999px',
    padding: '2px 6px',
    minWidth: '20px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  },

  loginBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255,255,255,0.22)',
    border: '1px solid rgba(255,255,255,0.35)',
    padding: '11px 18px',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
  },

  userMenu: {
    position: 'relative'
  },

  userBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255,255,255,0.22)',
    border: '1px solid rgba(255,255,255,0.35)',
    padding: '11px 16px',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    maxWidth: '220px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
  },

  userDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    background: '#fff',
    borderRadius: '14px',
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
    minWidth: '220px',
    zIndex: 1000,
    overflow: 'hidden'
  },

  userInfo: {
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },

  userRole: {
    fontSize: '12px',
    color: '#666'
  }
}
