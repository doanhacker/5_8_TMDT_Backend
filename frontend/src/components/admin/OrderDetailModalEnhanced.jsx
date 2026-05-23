const toCurrency = (value) => `${value.toLocaleString("vi-VN")}đ`

const statusLabelMap = {
  PENDING_CONFIRMATION: "Chờ xác nhận",
  WAITING_FOR_STOCK: "Chờ có hàng",
  PROCESSING: "Đang chuẩn bị",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
}

export default function OrderDetailModal({ selectedOrder, setSelectedOrder }) {
  if (!selectedOrder) return null

  const items = selectedOrder.items || []
  const totalItems = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
  const computedTotal = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0)

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={() => setSelectedOrder(null)}
    >
      <div
        style={{
          width: "min(900px, 100%)",
          maxHeight: "85vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 12,
          padding: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0 }}>Chi tiết đơn hàng {selectedOrder.id}</h2>
            <div style={{ color: "#666", marginTop: 4 }}>
              Ngày đặt: <strong>{selectedOrder.date}</strong> • Trạng thái: <strong>{statusLabelMap[selectedOrder.status] || selectedOrder.status}</strong>
            </div>
          </div>
          <button className="adm-btn adm-btn-light" onClick={() => setSelectedOrder(null)}>
            Đóng
          </button>
        </div>

        <hr style={{ border: 0, borderTop: "1px solid #eee", margin: "12px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <h3 style={{ marginTop: 0 }}>Thông tin khách hàng</h3>
            <div><strong>Tên:</strong> {selectedOrder.customer || "—"}</div>
            <div><strong>SĐT:</strong> {selectedOrder.phone || "—"}</div>
            <div><strong>Địa chỉ:</strong> {selectedOrder.address || "—"}</div>
          </div>

          <div>
            <h3 style={{ marginTop: 0 }}>Tổng quan</h3>
            <div><strong>Loại đơn:</strong> {selectedOrder.type || "—"}</div>
            <div><strong>Số sản phẩm:</strong> {totalItems}</div>
            <div>
              <strong>Tổng tiền:</strong>{" "}
              {toCurrency(selectedOrder.total ?? computedTotal)}
            </div>
          </div>
        </div>

        <hr style={{ border: 0, borderTop: "1px solid #eee", margin: "12px 0" }} />

        <h3>Danh sách sản phẩm</h3>
        {items.length === 0 ? (
          <p style={{ color: "#666" }}>
            Đơn hàng này chưa có danh sách sản phẩm chi tiết.
          </p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table2">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Đơn giá</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id || it.productId || idx}>
                    <td>{it.name}</td>
                    <td className="adm-money">{toCurrency(Number(it.price) || 0)}</td>
                    <td>{Number(it.quantity) || 0}</td>
                    <td className="adm-money">{toCurrency((Number(it.price) || 0) * (Number(it.quantity) || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
