export default function AdminRecommendation({ 
  recommendationStats, 
  recommendationStrategy, 
  setRecommendationStrategy 
}) {
  return (
    <div className="adm-grid">
      <section className="adm-card adm-card-pad">
        <h3>Hiệu quả hệ thống gợi ý</h3>
        <ul className="adm-bullets">
          {recommendationStats.topSuggested.map((item) => <li key={item}>{item}</li>)}
          <li>Tỷ lệ click: <strong>{recommendationStats.clickRate}%</strong></li>
          <li>Tỷ lệ mua: <strong>{recommendationStats.purchaseRate}%</strong></li>
        </ul>
      </section>

      <section className="adm-card adm-card-pad">
        <h3>Thiết lập chiến lược gợi ý</h3>
        <select value={recommendationStrategy} onChange={(event) => setRecommendationStrategy(event.target.value)}>
          <option value="hanh-vi">Theo hành vi người dùng</option>
          <option value="ban-chay">Theo sản phẩm bán chạy</option>
          <option value="hybrid">Kết hợp hành vi + bán chạy</option>
        </select>
        <p className="adm-muted">Chiến lược hiện tại: <strong>{recommendationStrategy}</strong></p>
        <p className="adm-muted">Theo dõi log AI đang bật, cập nhật mỗi 5 phút.</p>
      </section>
    </div>
  )
}
