export default function AdminContent({ 
  comments, 
  removeComment,
  loadingComments,
}) {
  return (
    <div className="adm-grid">
      <section className="adm-card adm-card-pad">
        <h3>Duyệt bình luận / đánh giá</h3>
        {loadingComments && <p className="adm-muted">Đang tải đánh giá...</p>}
        <ul className="adm-comment-list">
          {comments.map((comment) => (
            <li key={comment.id} className="adm-comment">
              <div className="adm-comment-body">
                <div className="adm-comment-head">
                  <strong>{comment.user}</strong>
                  <span className="adm-dot">•</span>
                  <span className="adm-muted">{comment.product}</span>
                  <span className="adm-status2 ok">
                    {comment.rating} sao
                  </span>
                </div>
                <p>{comment.text}</p>
              </div>
              <div className="adm-row-actions">
                <button className="adm-btn adm-btn-danger" onClick={() => removeComment(comment.id)}>Xóa</button>
              </div>
            </li>
          ))}
          {!loadingComments && comments.length === 0 && (
            <li className="adm-muted">Không có đánh giá nào cần xử lý.</li>
          )}
        </ul>
      </section>

      <section className="adm-card adm-card-pad">
        <h3>Quảng cáo & nội dung trang chủ</h3>
        <p className="adm-muted">Nội dung banner/tin tức đã được quản lý tại mục "Quản lý Banner" và "Quản lý tin tức".</p>
      </section>
    </div>
  )
}
