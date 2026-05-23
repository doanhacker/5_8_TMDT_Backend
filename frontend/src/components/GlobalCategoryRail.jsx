import { Link } from 'react-router-dom'
import {
  FiChevronDown,
  FiHeadphones,
  FiMonitor,
  FiRefreshCw,
  FiSmartphone,
  FiWatch,
} from 'react-icons/fi'
import {
  MdLaptopMac,
  MdOutlineMiscellaneousServices,
  MdOutlineSimCard,
  MdOutlineTabletMac,
  MdPrint,
  MdSell,
} from 'react-icons/md'

const categories = [
  { label: 'Điện thoại', path: '/phone', icon: FiSmartphone },
  { label: 'Laptop', path: '/laptop', icon: MdLaptopMac },
  { label: 'Phụ kiện', path: '/phu-kien', icon: FiHeadphones },
  { label: 'Smartwatch', path: '/smartwatch', icon: FiWatch },
  { label: 'Đồng hồ', path: '/dong-ho', icon: FiWatch },
  { label: 'Tablet', path: '/tablet', icon: MdOutlineTabletMac },
  { label: 'Máy cũ, Thu cũ', path: '/may-cu-thu-cu', icon: FiRefreshCw },
  { label: 'Màn hình, Máy in', path: '/man-hinh-may-in', icon: FiMonitor },
  { label: 'Sim, Thẻ cào', path: '/sim-the-cao', icon: MdOutlineSimCard },
  { label: 'Dịch vụ tiện ích', path: '/services', icon: MdOutlineMiscellaneousServices },
]

export default function GlobalCategoryRail() {
  return (
    <nav style={styles.rail} aria-label="Danh mục nổi bật">
      <div style={styles.inner}>
        {categories.map((category) => {
          const Icon = category.icon

          return (
            <Link key={category.label} to={category.path} style={styles.item}>
              <span style={styles.iconWrap}>
                <Icon size={17} />
              </span>
              <span style={styles.label}>{category.label}</span>
              {category.hasDropdown ? <FiChevronDown size={13} style={styles.chevron} /> : null}
            </Link>
          )
        })}
        <button type="button" style={styles.utilityButton}>
          <span style={styles.iconWrap}>
            <MdSell size={15} />
          </span>
        </button>
      </div>
    </nav>
  )
}

const styles = {
  rail: {
    background: '#db001b',
    borderTop: '1px solid rgba(255,255,255,0.14)',
    borderBottom: '1px solid rgba(140,0,14,0.28)',
  },
  inner: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 22px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  item: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1,
    padding: '12px 10px',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    borderRadius: 6,
    opacity: 0.98,
  },
  iconWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    display: 'inline-block',
  },
  chevron: {
    opacity: 0.9,
    marginTop: 1,
    flexShrink: 0,
  },
  utilityButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    minWidth: 32,
    height: 32,
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    cursor: 'pointer',
    flexShrink: 0,
  },
}
