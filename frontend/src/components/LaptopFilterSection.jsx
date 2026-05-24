import "../styles/LaptopFilterSection.css"
import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { buildApiUrl } from "../config/api"
import { detectScopeByDeviceType, detectScopeByCategoryName } from "../utils/adminScope"
import { getRealtimeClient } from "../lib/realtimeClient"
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

  const loadLaptopFacets = useCallback(async () => {
    try {
      const normalizedDeviceType = String(deviceType || "").trim().toUpperCase()
      const [productsRes, brandsRes, categoriesRes] = await Promise.all([
        fetch(buildApiUrl(`/api/products?deviceType=${encodeURIComponent(normalizedDeviceType)}&limit=200`)),
        fetch(buildApiUrl("/api/brands")),
        fetch(buildApiUrl("/api/product-categories")),
      ])

      const productsData = await productsRes.json().catch(() => ({}))
      const brandsData = await brandsRes.json().catch(() => ({}))
      const categoriesData = await categoriesRes.json().catch(() => ({}))

      const products = Array.isArray(productsData?.data) ? productsData.data : []
      const allBrands = Array.isArray(brandsData?.data) ? brandsData.data : []
      const allCategories = Array.isArray(categoriesData?.data) ? categoriesData.data : []

      const laptopBrandNameSet = new Set(
        products.map((item) => normalizeText(item?.brand_name)).filter(Boolean)
      )
      const laptopCategoryNameSet = new Set(
        products.map((item) => normalizeText(item?.category_name)).filter(Boolean)
      )

      const targetScope = detectScopeByDeviceType(normalizedDeviceType)

      const taxonomyBrands = allBrands.filter((brand) => {
        const type = String(brand?.device_type || "").trim().toUpperCase()
        if (type === normalizedDeviceType) return true
        // Keep old laptop brands visible while data is gradually normalized.
        if (normalizedDeviceType === "LAPTOP" && type === "OTHER") return true
        return false
      })

      const taxonomyCategories = allCategories.filter((item) => {
        const type = String(item?.device_type || "").trim().toUpperCase()
        if (type === normalizedDeviceType) return true
        // Keep old laptop categories visible while data is gradually normalized.
        if (normalizedDeviceType === "LAPTOP" && type === "OTHER") return true
        return false
      })

      if (taxonomyBrands.length > 0) {
        setBrands(taxonomyBrands)
      } else {
        setBrands(
          allBrands.filter((brand) => laptopBrandNameSet.has(normalizeText(brand?.brand_name)))
        )
      }

      if (includeUnassigned && targetScope) {
        const scopedFallbackCategories = allCategories.filter((item) => {
          const name = item?.category_name
          return detectScopeByCategoryName(name) === targetScope || laptopCategoryNameSet.has(normalizeText(name))
        })

        const mergedCategories = [...taxonomyCategories, ...scopedFallbackCategories]
        const uniqueCategories = mergedCategories.filter(
          (item, index, arr) => index === arr.findIndex((candidate) => candidate.category_id === item.category_id)
        )

        setCategory(uniqueCategories)
        return
      }

      if (taxonomyCategories.length > 0) {
        setCategory(taxonomyCategories)
      } else {
        setCategory(
          allCategories.filter((item) => laptopCategoryNameSet.has(normalizeText(item?.category_name)))
        )
      }
    } catch {
      setBrands([])
      setCategory([])
    }
  }, [deviceType, includeUnassigned])

  useEffect(() => {
    loadLaptopFacets()

    const socket = getRealtimeClient()
    const handleCatalogChanged = (event) => {
      if (!event || !event.resource) return
      if (["brand", "category", "product"].includes(event.resource)) {
        loadLaptopFacets()
      }
    }
    socket.on("catalog:changed", handleCatalogChanged)

    return () => {
      socket.off("catalog:changed", handleCatalogChanged)
    }
  }, [loadLaptopFacets])

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