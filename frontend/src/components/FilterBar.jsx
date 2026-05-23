import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FiFilter,
  FiTruck,
  FiBox,
  FiDollarSign,
  FiChevronDown,
  FiInfo,
  FiStar,
  FiTag,
  FiArrowUp,
  FiArrowDown,
  FiX,
} from 'react-icons/fi'
import '../styles/FilterBar.css'

const defaultFilterOptions = {
  storage: ['128GB', '256GB', '512GB', '1TB', '2TB'],
  ram: ['4GB', '8GB', '16GB', '32GB', '64GB'],
  cpu: ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9'],
  screenSize: ['13 inch', '14 inch', '15.6 inch', '16 inch', '17 inch'],
  resolution: ['HD (1366x768)', 'Full HD (1920x1080)', '2K (2560x1440)', '4K (3840x2160)'],
  graphics: ['Intel UHD', 'Intel Iris Xe', 'NVIDIA GTX 1650', 'NVIDIA RTX 3050', 'NVIDIA RTX 4050', 'NVIDIA RTX 4060'],
  features: ['Màn hình cảm ứng', 'Bàn phím có đèn', 'Chống nước', 'Nhẹ', 'Pin trâu'],
  ai: ['Intel AI', 'NVIDIA AI', 'AMD AI'],
  brand: ['ASUS', 'Dell', 'HP', 'Lenovo', 'Acer', 'MSI', 'Apple'],
  series: ['Gaming', 'Văn phòng', 'Đồ họa', 'Cao cấp', 'Sinh viên'],
}

const defaultFilterConfig = [
  { id: 'toggle', label: 'Bộ lọc', icon: FiFilter, isToggle: true },
  { id: 'inStock', label: 'Sẵn hàng', icon: FiTruck },
  { id: 'newArrival', label: 'Hàng mới về', icon: FiBox },
  { id: 'priceRange', label: 'Xem theo giá', icon: FiDollarSign, hasDropdown: true, type: 'price' },
  { id: 'storage', label: 'Ổ cứng', hasDropdown: true, options: defaultFilterOptions.storage },
  { id: 'ram', label: 'Dung lượng RAM', hasDropdown: true, options: defaultFilterOptions.ram },
  { id: 'cpu', label: 'CPU', hasDropdown: true, options: defaultFilterOptions.cpu },
  { id: 'screenSize', label: 'Kích thước màn hình', hasDropdown: true, options: defaultFilterOptions.screenSize },
  { id: 'resolution', label: 'Độ phân giải', hasDropdown: true, options: defaultFilterOptions.resolution },
  { id: 'graphics', label: 'Card đồ họa', hasDropdown: true, options: defaultFilterOptions.graphics },
  { id: 'features', label: 'Tính năng đặc biệt', hasDropdown: true, options: defaultFilterOptions.features },
  { id: 'ai', label: 'Công nghệ AI', hasDropdown: true, options: defaultFilterOptions.ai },
  { id: 'brand', label: 'Hãng sản xuất', hasDropdown: true, options: defaultFilterOptions.brand },
  { id: 'series', label: 'Dòng sản phẩm', hasDropdown: true, options: defaultFilterOptions.series },
]

const defaultPriceRanges = [
  { label: 'Dưới 10 triệu', min: 0, max: 10000000 },
  { label: '10 - 15 triệu', min: 10000000, max: 15000000 },
  { label: '15 - 20 triệu', min: 15000000, max: 20000000 },
  { label: '20 - 25 triệu', min: 20000000, max: 25000000 },
  { label: '25 - 30 triệu', min: 25000000, max: 30000000 },
  { label: 'Trên 30 triệu', min: 30000000, max: Infinity },
]

const buildInitialFilters = (config) => {
  const initial = {}

  config.forEach((filter) => {
    if (filter.isToggle) return

    if (filter.hasDropdown) {
      initial[filter.id] = filter.type === 'price' ? null : []
      return
    }

    initial[filter.id] = false
  })

  return initial
}

export default function FilterBar({
  onFilterChange,
  title = 'Chọn theo tiêu chí',
  filterConfig = defaultFilterConfig,
  priceRanges = defaultPriceRanges,
}) {
  const [showFilters, setShowFilters] = useState(true)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [selectedFilters, setSelectedFilters] = useState(() => buildInitialFilters(filterConfig))
  const [sortBy, setSortBy] = useState('popular')
  const [dropdownStyle, setDropdownStyle] = useState({})
  const [portalReady, setPortalReady] = useState(false)
  const filterBarRef = useRef(null)
  const dropdownPortalRef = useRef(null)
  const triggerRefs = useRef({})

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideBar = filterBarRef.current?.contains(event.target)
      const clickedInsidePortal = dropdownPortalRef.current?.contains(event.target)

      if (!clickedInsideBar && !clickedInsidePortal) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!activeDropdown) return undefined

    const updateDropdownPosition = () => {
      const trigger = triggerRefs.current[activeDropdown]
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const width = Math.min(760, window.innerWidth - 32)
      const left = Math.min(
        Math.max(16, rect.left),
        Math.max(16, window.innerWidth - width - 16)
      )

      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 12,
        left: `${left}px`,
        width: `${width}px`,
      })
    }

    updateDropdownPosition()
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)

    return () => {
      window.removeEventListener('resize', updateDropdownPosition)
      window.removeEventListener('scroll', updateDropdownPosition, true)
    }
  }, [activeDropdown])

  const handleToggleFilter = () => {
    setShowFilters(!showFilters)
  }

  const handleQuickFilter = (filterId) => {
    const newFilters = {
      ...selectedFilters,
      [filterId]: !selectedFilters[filterId],
    }
    setSelectedFilters(newFilters)
    onFilterChange?.(newFilters, sortBy)
  }

  const handleDropdownToggle = (filterId) => {
    setActiveDropdown((current) => (current === filterId ? null : filterId))
  }

  const handleOptionSelect = (filterId, option) => {
    const newFilters = { ...selectedFilters }

    if (filterId === 'priceRange') {
      newFilters.priceRange = newFilters.priceRange?.label === option.label ? null : option
    } else {
      const currentValues = newFilters[filterId] || []
      newFilters[filterId] = currentValues.includes(option)
        ? currentValues.filter((value) => value !== option)
        : [...currentValues, option]
    }

    setSelectedFilters(newFilters)
    onFilterChange?.(newFilters, sortBy)
  }

  const handleSort = (sortType) => {
    setSortBy(sortType)
    onFilterChange?.(selectedFilters, sortType)
  }

  const clearAllFilters = () => {
    const clearedFilters = buildInitialFilters(filterConfig)
    setSelectedFilters(clearedFilters)
    onFilterChange?.(clearedFilters, sortBy)
  }

  const getActiveFilterCount = () => {
    let count = 0

    Object.keys(selectedFilters).forEach((key) => {
      const value = selectedFilters[key]
      if (Array.isArray(value)) {
        count += value.length
      } else if (value !== null && value !== false && value !== undefined) {
        count += 1
      }
    })

    return count
  }

  const getFilterSelectionCount = (filterId) => {
    if (filterId === 'priceRange') return selectedFilters.priceRange ? 1 : 0
    return Array.isArray(selectedFilters[filterId]) ? selectedFilters[filterId].length : 0
  }

  const renderDropdownOptions = (filter) => {
    if (filter.type === 'price') {
      return priceRanges.map((range) => {
        const isSelected = selectedFilters.priceRange?.label === range.label
        return (
          <button
            key={range.label}
            type="button"
            className={`filter-chip ${isSelected ? 'selected' : ''}`}
            onClick={() => handleOptionSelect(filter.id, range)}
          >
            {range.label}
          </button>
        )
      })
    }

    return (filter.options || []).map((option) => {
      const isSelected = selectedFilters[filter.id]?.includes(option)
      return (
        <button
          key={option}
          type="button"
          className={`filter-chip ${isSelected ? 'selected' : ''}`}
          onClick={() => handleOptionSelect(filter.id, option)}
        >
          {option}
        </button>
      )
    })
  }

  const activeFilter = filterConfig.find((filter) => filter.id === activeDropdown)

  const dropdownPortal = activeDropdown && activeFilter && portalReady
    ? createPortal(
        <div className="filter-dropdown-menu" style={dropdownStyle}>
          <div className="filter-dropdown-panel" ref={dropdownPortalRef}>
            <div className="filter-chip-grid">
              {renderDropdownOptions(activeFilter)}
            </div>
            <div className="filter-dropdown-actions">
              <button type="button" className="filter-panel-btn filter-panel-btn-light" onClick={() => setActiveDropdown(null)}>
                Đóng
              </button>
              <button type="button" className="filter-panel-btn filter-panel-btn-primary" onClick={() => setActiveDropdown(null)}>
                Xem kết quả
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <>
      <div className="filter-bar-wrapper" ref={filterBarRef}>
        <div className="filter-header">
          <h2 className="filter-title">{title}</h2>
          {getActiveFilterCount() > 0 && (
            <button className="clear-filters-btn" onClick={clearAllFilters}>
              <FiX /> Xóa bộ lọc ({getActiveFilterCount()})
            </button>
          )}
        </div>

        {showFilters && (
          <div className="filter-row">
            {filterConfig.map((filter) => {
              const Icon = filter.icon
              const selectedValue = selectedFilters[filter.id]
              const isActive = filter.hasDropdown
                ? (filter.type === 'price' ? selectedValue !== null : Array.isArray(selectedValue) && selectedValue.length > 0)
                : Boolean(selectedValue)

              if (filter.isToggle) {
                return (
                  <button
                    key={filter.id}
                    className={`filter-btn filter-toggle ${showFilters ? 'active' : ''}`}
                    onClick={handleToggleFilter}
                  >
                    {Icon && <Icon />}
                    {filter.label}
                  </button>
                )
              }

              if (filter.hasDropdown) {
                return (
                  <div key={filter.id} className="filter-dropdown-container">
                    <button
                      ref={(node) => {
                        triggerRefs.current[filter.id] = node
                      }}
                      className={`filter-btn ${isActive ? 'active' : ''} ${activeDropdown === filter.id ? 'dropdown-open' : ''}`}
                      onClick={() => handleDropdownToggle(filter.id)}
                    >
                      {Icon && <Icon />}
                      {filter.label}
                      <span className={`filter-info-badge ${isActive ? 'active' : ''}`}>
                        {getFilterSelectionCount(filter.id) || <FiInfo size={12} />}
                      </span>
                      <FiChevronDown className={activeDropdown === filter.id ? 'rotate' : ''} />
                    </button>
                  </div>
                )
              }

              return (
                <button
                  key={filter.id}
                  className={`filter-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleQuickFilter(filter.id)}
                >
                  {Icon && <Icon />}
                  {filter.label}
                </button>
              )
            })}
          </div>
        )}

        <div className="sort-row">
          <h2 className="sort-title">Sắp xếp theo</h2>
          <button
            className={`sort-btn ${sortBy === 'popular' ? 'selected' : ''}`}
            onClick={() => handleSort('popular')}
          >
            <FiStar />
            Phổ biến nhất
          </button>
          <button
            className={`sort-btn ${sortBy === 'promotion' ? 'selected' : ''}`}
            onClick={() => handleSort('promotion')}
          >
            <FiTag />
            Khuyến mãi HOT
          </button>
          <button
            className={`sort-btn ${sortBy === 'priceAsc' ? 'selected' : ''}`}
            onClick={() => handleSort('priceAsc')}
          >
            <FiArrowUp />
            Giá Thấp - Cao
          </button>
          <button
            className={`sort-btn ${sortBy === 'priceDesc' ? 'selected' : ''}`}
            onClick={() => handleSort('priceDesc')}
          >
            <FiArrowDown />
            Giá Cao - Thấp
          </button>
        </div>
      </div>
      {dropdownPortal}
    </>
  )
}
