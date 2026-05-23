export default function AdminAssistant({ 
  aiLogs, 
  aiStats, 
  aiTrainingNote, 
  setAiTrainingNote 
}) {
  return (
    <div className="adm-grid">
      <section className="adm-card adm-card-pad">
        <h3>Trợ lý AI - Lịch sử</h3>
        <ul className="adm-bullets">
          {aiLogs.map((item) => <li key={item.id}>{item.topic} - {item.interactions} lượt hỏi</li>)}
        </ul>
      </section>

      <section className="adm-card adm-card-pad">
        <h3>Điều chỉnh dữ liệu huấn luyện</h3>
        <textarea className="adm-textarea" value={aiTrainingNote} onChange={(event) => setAiTrainingNote(event.target.value)} />
        <div className="adm-kpi-grid" style={{ marginTop: 12 }}>
          <div className="adm-kpi"><span>Tổng tương tác</span><strong>{aiStats.interactions}</strong></div>
          <div className="adm-kpi"><span>Chuyển đổi</span><strong>{aiStats.conversions}</strong></div>
          <div className="adm-kpi"><span>Tỷ lệ AI → mua</span><strong>{aiStats.conversionRate}%</strong></div>
        </div>
      </section>
    </div>
  )
}
