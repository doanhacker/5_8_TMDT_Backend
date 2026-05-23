import FilterBar from '../components/FilterBar'
import ProductListSection from '../components/ProductListSection'
import FeaturedProducts from '../components/FeaturedProducts'
import Pagination from '../components/Pagination'
import "../styles/HomeContainer.css"

export default function Home() {
  return (
    <div className="home-page-shell">
      <FilterBar />
      <ProductListSection />
      <Pagination />
    </div>
  )
}