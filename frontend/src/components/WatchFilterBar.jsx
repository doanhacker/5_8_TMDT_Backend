import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
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
  FiX
} from "react-icons/fi"
import "../styles/FilterBar.css"

const WATCH_BRAND_OPTIONS = [
  "Apple",
  "Samsung",
  "Garmin",
  "Xiaomi",
  "Huawei",
  "Amazfit",
  "Fossil",
  "Casio",
  "Orient"
]

const STRAP_OPTIONS = ["Da", "Silicon", "Kim loại", "Cao su"]

const FEATURE_OPTIONS = [
  "GPS",
  "Chống nước",
  "Nhịp tim",
  "NFC",
  "eSIM",
  "Pin trâu",
  "Màn AMOLED",
  "Wear OS"
]

const priceRanges = [
  { label: "Dưới 2 triệu", min: 0, max: 2000000 },
  { label: "2 - 5 triệu", min: 2000000, max: 5000000 },
  { label: "5 - 10 triệu", min: 5000000, max: 10000000 },
  { label: "10 - 20 triệu", min: 10000000, max: 20000000 },
  { label: "Trên 20 triệu", min: 20000000, max: Infinity }
]

const filterConfig = [
  { id: "toggle", label: "Bộ lọc", icon: FiFilter, isToggle: true },
  { id: "inStock", label: "Sẵn hàng", icon: FiTruck },
  { id: "newArrival", label: "Hàng mới về", icon: FiBox },
  { id: "priceRange", label: "Xem theo giá", icon: FiDollarSign, hasDropdown: true, type: "price" },
  { id: "brand", label: "Thương hiệu", hasDropdown: true, options: WATCH_BRAND_OPTIONS },
  { id: "strap", label: "Chất liệu dây", hasDropdown: true, options: STRAP_OPTIONS },
  { id: "features", label: "Tính năng", hasDropdown: true, options: FEATURE_OPTIONS }
]

const defaultFilters = () => ({
  inStock: false,
  newArrival: false,
  priceRange: null,
  brand: [],
  strap: [],
  features: []
})

export default function WatchFilterBar({ onFilterChange }) {
  const [showFilters, setShowFilters] = useState(true)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [selectedFilters, setSelectedFilters] = useState(defaultFilters)
  const [sortBy, setSortBy] = useState("popular")
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

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!activeDropdown) return undefined

    const updateDropdownPosition = () => {
      const trigger = triggerRefs.current[activeDropdown]
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const width = Math.min(760, window.innerWidth - 32)
      const left = Math.min(Math.max(16, rect.left), Math.max(16, window.innerWidth - width - 16))

      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 12,
        left: `${left}px`,
        width: `${width}px`
      })
    }

    updateDropdownPosition()
    window.addEventListener("resize", updateDropdownPosition)
    window.addEventListener("scroll", updateDropdownPosition, true)

    return () => {
      window.removeEventListener("resize", updateDropdownPosition)
      window.removeEventListener("scroll", updateDropdownPosition, true)
    }
  }, [activeDropdown])

  const handleToggleFilter = () => {
    setShowFilters(!showFilters)
  }

  const handleQuickFilter = (filterId) => {
    const newFilters = {
      ...selectedFilters,
      [filterId]: !selectedFilters[filterId]
    }
    setSelectedFilters(newFilters)
    onFilterChange?.(newFilters, sortBy)
  }

  const handleDropdownToggle = (filterId) => {
    setActiveDropdown((current) => (current === filterId ? null : filterId))
  }

  const handleOptionSelect = (filterId, option) => {
    const newFilters = { ...selectedFilters }

    if (filterId === "priceRange") {
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
    const clearedFilters = defaultFilters()
    setSelectedFilters(clearedFilters)
    onFilterChange?.(clearedFilters, sortBy)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (selectedFilters.inStock) count += 1
    if (selectedFilters.newArrival) count += 1
    if (selectedFilters.priceRange) count += 1
    ;["brand", "strap", "features"].forEach((key) => {
      count += selectedFilters[key]?.length || 0
    })
    return count
  }

  const getFilterSelectionCount = (filterId) => {
    if (filterId === "priceRange") return selectedFilters.priceRange ? 1 : 0
    return Array.isArray(selectedFilters[filterId]) ? selectedFilters[filterId].length : 0
  }

  const renderDropdownOptions = (filter) => {
    if (filter.type === "price") {
      return priceRanges.map((range) => {
        const isSelected = selectedFilters.priceRange?.label === range.label
        return (
          <button
            key={range.label}
            type="button"
            className={`filter-chip ${isSelected ? "selected" : ""}`}
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
          className={`filter-chip ${isSelected ? "selected" : ""}`}
          onClick={() => handleOptionSelect(filter.id, option)}
        >
          {option}
        </button>
      )
    })
  }

  const activeFilter = filterConfig.find((filter) => filter.id === activeDropdown)

  const dropdownPortal =
    activeDropdown && activeFilter && portalReady
      ? createPortal(
          <div className="filter-dropdown-menu" style={dropdownStyle}>
            <div className="filter-dropdown-panel" ref={dropdownPortalRef}>
              <div className="filter-chip-grid">{renderDropdownOptions(activeFilter)}</div>
              <div className="filter-dropdown-actions">
                <button
                  type="button"
                  className="filter-panel-btn filter-panel-btn-light"
                  onClick={() => setActiveDropdown(null)}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="filter-panel-btn filter-panel-btn-primary"
                  onClick={() => setActiveDropdown(null)}
                >
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
          <h2 className="filter-title">Lọc đồng hồ theo tiêu chí</h2>
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
              const isActive =
                filter.id === "inStock"
                  ? selectedFilters.inStock
                  : filter.id === "newArrival"
                    ? selectedFilters.newArrival
                    : filter.id === "priceRange"
                      ? selectedFilters.priceRange !== null
                      : selectedFilters[filter.id]?.length > 0

              if (filter.isToggle) {
                return (
                  <button
                    key={filter.id}
                    type="button"
                    className={`filter-btn filter-toggle ${showFilters ? "active" : ""}`}
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
                      type="button"
                      ref={(node) => {
                        triggerRefs.current[filter.id] = node
                      }}
                      className={`filter-btn ${isActive ? "active" : ""} ${activeDropdown === filter.id ? "dropdown-open" : ""}`}
                      onClick={() => handleDropdownToggle(filter.id)}
                    >
                      {Icon && <Icon />}
                      {filter.label}
                      <span className={`filter-info-badge ${isActive ? "active" : ""}`}>
                        {getFilterSelectionCount(filter.id) || <FiInfo size={12} />}
                      </span>
                      <FiChevronDown className={activeDropdown === filter.id ? "rotate" : ""} />
                    </button>
                  </div>
                )
              }

              return (
                <button
                  key={filter.id}
                  type="button"
                  className={`filter-btn ${isActive ? "active" : ""}`}
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
            type="button"
            className={`sort-btn ${sortBy === "popular" ? "selected" : ""}`}
            onClick={() => handleSort("popular")}
          >
            <FiStar />
            Phổ biến nhất
          </button>
          <button
            type="button"
            className={`sort-btn ${sortBy === "promotion" ? "selected" : ""}`}
            onClick={() => handleSort("promotion")}
          >
            <FiTag />
            Khuyến mãi HOT
          </button>
          <button
            type="button"
            className={`sort-btn ${sortBy === "priceAsc" ? "selected" : ""}`}
            onClick={() => handleSort("priceAsc")}
          >
            <FiArrowUp />
            Giá Thấp - Cao
          </button>
          <button
            type="button"
            className={`sort-btn ${sortBy === "priceDesc" ? "selected" : ""}`}
            onClick={() => handleSort("priceDesc")}
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
