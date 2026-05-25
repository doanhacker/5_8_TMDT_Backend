import "../styles/LaptopFilterSection.css"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { buildApiUrl } from "../config/api"
import { detectScopeByDeviceType, detectScopeByCategoryName } from "../utils/adminScope"
import {
  filterPaymentMockBrands,
  filterPaymentMockProducts,
  PAYMENT_MOCK_CATEGORY_NAME,
} from "../utils/paymentMockCatalog"
// const brands = [
//   "MacBook",
//   "ASUS",
//   "Lenovo",
//   "MSI",
//   "Acer",
//   "HP",
//   "Dell",
//   "LG",
//   "GIGABYTE",
//   "Masstel",
//   "SAMSUNG",
// ]
const resolveLogoUrl = (url) => {
  const raw = String(url || '').trim();
  if (!raw) return null;
  if(/^https?:\/\//.test(raw) || raw.startsWith("data:")) return raw; // URL đã đầy đủ hoặc data URI
  return buildApiUrl(raw.startsWith('/') ? raw : `/${raw}`); // Đảm bảo có dấu / ở đầu nếu cần
}
// const needs = [
//   { title: "Văn phòng", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:150:0/q:70/plain/https://cellphones.com.vn/media/wysiwyg/Group_846.png" },
//   { title: "Gaming", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:150:0/q:70/plain/https://cellphones.com.vn/media/wysiwyg/Group_848_2.png" },
//   { title: "Mỏng nhẹ", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:150:0/q:70/plain/https://cellphones.com.vn/media/wysiwyg/image_6__1.png" },
//   { title: "Đồ họa - kỹ thuật", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:150:0/q:70/plain/https://cellphones.com.vn/media/wysiwyg/image_1__4.png" },
//   { title: "Sinh viên", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:150:0/q:70/plain/https://cellphones.com.vn/media/wysiwyg/image_2__4.png" },
//   { title: "Cảm ứng", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:150:0/q:70/plain/https://cellphones.com.vn/media/wysiwyg/image_4__4.png" },
//   { title: "Laptop AI", img: "https://cdn2.cellphones.com.vn/insecure/rs:fill:150:0/q:70/plain/https://cellphones.com.vn/media/wysiwyg/image_5__3.png" },
// ]

export default function LaptopFilterSection({
  sectionTitle = "Máy tính laptop",
  deviceType = "LAPTOP",
  includeUnassigned = false,
}) {
  const [brands, setBrands] = useState([])
  const navigate = useNavigate()
  const [category, setCategory] = useState([])

  const normalizeText = (value) => String(value || "").trim().toLowerCase()

  useEffect(() => {
    const loadLaptopFacets = async () => {
      try {
        const [productsRes, brandsRes, categoriesRes] = await Promise.all([
          fetch(buildApiUrl(`/api/products?deviceType=${encodeURIComponent(deviceType)}&limit=200`)),
          fetch(buildApiUrl("/api/brands")),
          fetch(buildApiUrl("/api/product-categories")),
        ])

        const productsData = await productsRes.json().catch(() => ({}))
        const brandsData = await brandsRes.json().catch(() => ({}))
        const categoriesData = await categoriesRes.json().catch(() => ({}))

        const products = filterPaymentMockProducts(
          Array.isArray(productsData?.data) ? productsData.data : []
        )
        const allBrands = filterPaymentMockBrands(
          Array.isArray(brandsData?.data) ? brandsData.data : []
        )
        const allCategories = (Array.isArray(categoriesData?.data) ? categoriesData.data : []).filter(
          (item) => String(item?.category_name || "").trim() !== PAYMENT_MOCK_CATEGORY_NAME
        )

        const laptopBrandNameSet = new Set(
          products.map((item) => normalizeText(item?.brand_name)).filter(Boolean)
        )
        const laptopCategoryNameSet = new Set(
          products.map((item) => normalizeText(item?.category_name)).filter(Boolean)
        )

        const targetScope = detectScopeByDeviceType(deviceType)

        if (includeUnassigned && targetScope) {
          setBrands(allBrands)
          setCategory(
            allCategories.filter((item) => {
              const name = item?.category_name
              return detectScopeByCategoryName(name) === targetScope || laptopCategoryNameSet.has(normalizeText(name))
            })
          )
          return
        }

        setBrands(
          allBrands.filter((brand) => laptopBrandNameSet.has(normalizeText(brand?.brand_name)))
        )

        setCategory(
          allCategories.filter((item) => laptopCategoryNameSet.has(normalizeText(item?.category_name)))
        )
      } catch {
        setBrands([])
        setCategory([])
      }
    }

    loadLaptopFacets()
  }, [deviceType, includeUnassigned])

  return (
    <div className="filter-wrapper">
      <h2 className="section-title">{sectionTitle}</h2>
      <div className="brand-list">
        {brands.map((brand) => (
          <div
            className="brand-item"
            key={brand.brand_id}
            title={brand.brand_name}
            onClick={() => navigate(`/brands/${brand.brand_id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate(`/brands/${brand.brand_id}`)
            }}
          >
            {brand.logo_url ? (
              <img className="brand-logo" src={resolveLogoUrl(brand.logo_url)} alt={brand.brand_name} loading="lazy" />
            ) : (
              <span className="brand-fallback">{brand.brand_name}</span>
            )}
          </div>
        ))}
      </div>

      <h2 className="section-title">Chọn theo nhu cầu</h2>
      <div className="need-list">
        {category.map((item, index) => (
          <div className="need-card" key={index}>
            {/* <img src={item.img} alt={item.category_name} /> */}
            <p>{item.category_name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}