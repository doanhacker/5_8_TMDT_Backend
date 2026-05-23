import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import CategoryBar from "../components/CategoryBar"
import BannerSlider from "../components/BannerSlider"
import LaptopFilterSection from "../components/LaptopFilterSection"
import FeaturedProducts from "../components/FeaturedProducts"
import FilterBar from "../components/FilterBar"
import ProductListSection from "../components/ProductListSection"
import HomeArticleSection from "../components/HomeArticleSection"
import QASection from "../components/QASection"
import Footer from "../components/Footer"
import "../styles/HomeContainer.css"

export default function Laptop() {
  const [filters, setFilters] = useState(null)
  const [sortBy, setSortBy] = useState('popular')
  const [searchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category') || ''

  const handleFilterChange = (newFilters, newSortBy) => {
    setFilters(newFilters)
    setSortBy(newSortBy)
  }

  return (
    <>
      <div className="home-page-shell">
        <CategoryBar />
        <BannerSlider />
        <LaptopFilterSection />
        <FeaturedProducts />
        <FilterBar onFilterChange={handleFilterChange} />
        <ProductListSection filters={filters} sortBy={sortBy} selectedCategory={selectedCategory} />
        <HomeArticleSection />
        <QASection />
      </div>
      <Footer />
    </>
  )
}