import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import Breadcrumb from "../components/Breadcrumb"
import ProductCard from "../components/ProductCard"
import {
  getBrandDetail,
  getCategoryDetail,
  getProductsByFilter
} from "../services/catalogBrowseApi"
import "../styles/TaxonomyProductsPage.css"

const TAXONOMY_CONFIG = {
  brand: {
    paramKey: "brandId",
    sectionLabel: "Thương hiệu",
    detailFetcher: getBrandDetail,
    nameField: "brand_name",
    toProductsFilter: (id) => ({ brandId: id })
  },
  category: {
    paramKey: "categoryId",
    sectionLabel: "Danh mục",
    detailFetcher: getCategoryDetail,
    nameField: "category_name",
    toProductsFilter: (id) => ({ categoryId: id })
  }
}

export default function TaxonomyProductsPage({ type }) {
  const cfg = TAXONOMY_CONFIG[type]
  const params = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const taxonomyId = params[cfg.paramKey]
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const limit = 12

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [items, setItems] = useState([])
  const [taxonomyName, setTaxonomyName] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 1
  })

  useEffect(() => {
    const load = async () => {
      if (!taxonomyId) return

      try {
        setLoading(true)
        setError("")

        const [detailRes, productRes] = await Promise.all([
          cfg.detailFetcher(taxonomyId),
          getProductsByFilter({
            ...cfg.toProductsFilter(taxonomyId),
            page,
            limit
          })
        ])

        setTaxonomyName(detailRes?.data?.[cfg.nameField] || `${cfg.sectionLabel} #${taxonomyId}`)
        setItems(Array.isArray(productRes?.data) ? productRes.data : [])
        setPagination(
          productRes?.pagination || {
            page,
            limit,
            totalItems: Array.isArray(productRes?.data) ? productRes.data.length : 0,
            totalPages: 1
          }
        )
      } catch (e) {
        setError(e.message || `Không tải được dữ liệu ${cfg.sectionLabel.toLowerCase()}`)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [taxonomyId, page, cfg, limit])

  const breadcrumbItems = useMemo(
    () => [
      { label: "Trang chủ", path: "/" },
      { label: cfg.sectionLabel },
      { label: taxonomyName || "Đang tải..." }
    ],
    [cfg.sectionLabel, taxonomyName]
  )

  const goToPage = (nextPage) => {
    const p = Math.max(1, Math.min(nextPage, pagination.totalPages || 1))
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev)
      n.set("page", String(p))
      return n
    })
  }

  return (
    <div className="taxonomy-page">
      <Breadcrumb items={breadcrumbItems} />

      <div className="taxonomy-header">
        <h1>
          {cfg.sectionLabel}: <span>{taxonomyName || "..."}</span>
        </h1>
        <p>{pagination.totalItems || 0} sản phẩm</p>
      </div>

      {loading ? (
        <div className="taxonomy-state">Đang tải...</div>
      ) : error ? (
        <div className="taxonomy-state taxonomy-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="taxonomy-state">Không có sản phẩm trong mục này.</div>
      ) : (
        <>
          <div className="taxonomy-grid">
            {items.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>

          <div className="taxonomy-pagination">
            <button onClick={() => goToPage(page - 1)} disabled={page <= 1}>
              ← Trước
            </button>
            <span>
              Trang {pagination.page || page}/{pagination.totalPages || 1}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= (pagination.totalPages || 1)}
            >
              Sau →
            </button>
          </div>
        </>
      )}

      <div className="taxonomy-back">
        <button onClick={() => navigate("/")}>Về trang chủ</button>
      </div>
    </div>
  )
}