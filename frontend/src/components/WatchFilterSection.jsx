import { useSearchParams } from "react-router-dom"
import { WATCH_BRANDS, WATCH_NEED_ITEMS } from "../data/mockWatchProducts"
import "../styles/LaptopFilterSection.css"
import "../styles/WatchFilterSection.css"

export default function WatchFilterSection() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeBrand = searchParams.get("brand") || ""

  const setBrand = (brandId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (!brandId || activeBrand === brandId) {
        next.delete("brand")
      } else {
        next.set("brand", brandId)
      }
      next.set("page", "1")
      return next
    })
  }

  const setNeedCategory = (needId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("category", needId)
      next.set("page", "1")
      return next
    })
  }

  return (
    <div className="filter-wrapper watch-filter-wrapper">
      <h2 className="section-title">Đồng hồ — chọn thương hiệu</h2>
      <div className="brand-list watch-brand-list">
        {WATCH_BRANDS.map((b) => (
          <button
            type="button"
            key={b.id}
            className={`brand-item watch-brand-pill ${activeBrand === b.id ? "is-active" : ""}`}
            title={b.name}
            onClick={() => setBrand(b.id)}
          >
            <span className="watch-brand-name">{b.name}</span>
          </button>
        ))}
      </div>

      <h2 className="section-title">Chọn theo nhu cầu (đồng hồ)</h2>
      <div className="need-list watch-need-list">
        {WATCH_NEED_ITEMS.map((item) => (
          <button type="button" key={item.id} className="need-card watch-need-card" onClick={() => setNeedCategory(item.id)}>
            <p className="watch-need-title">{item.label}</p>
            <p className="watch-need-hint">{item.hint}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
