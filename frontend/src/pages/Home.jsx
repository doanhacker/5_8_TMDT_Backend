import FilterBar from '../components/FilterBar'
import ProductListSection from '../components/ProductListSection'
import FeaturedProducts from '../components/FeaturedProducts'
import Pagination from '../components/Pagination'
import QASection from '../components/QASection'
import "../styles/HomeContainer.css"

export default function Home() {
  return (
    <div className="home-page-shell">
      <FilterBar />
      <ProductListSection />
      <Pagination />
      <QASection title="Hỏi & Đáp - Hỗ trợ mua sắm" subtitle="Đặt câu hỏi về sản phẩm, cấu hình, bảo hành và nhận phản hồi từ cộng đồng" introTitle="Bạn cần tư vấn thêm?" introText="Gửi câu hỏi, admin và cộng đồng sẽ phản hồi trong thời gian sớm nhất." listTitle="Câu hỏi mới nhất" />
    </div>
  )
}