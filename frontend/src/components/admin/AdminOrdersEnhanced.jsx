const toCurrency = (value) => `${value.toLocaleString("vi-VN")}đ`

const statusLabelMap = {
  PENDING_CONFIRMATION: "Chờ xác nhận",
  WAITING_FOR_STOCK: "Chờ có hàng",
  PROCESSING: "Đang chuẩn bị",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
}

export default function AdminOrders({ orders, updateOrderStatus, openOrderDetail, loadingOrders }) {
  return (
    <>
      <section className="adm-card adm-card-pad">
        <h3>Quản lý đơn hàng</h3>
        {loadingOrders && <p className="adm-muted">Đang tải đơn hàng...</p>}
        <div className="adm-table-wrap">
          <table className="adm-table2">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Khách hàng</th>
                <th>Loại</th>
                <th>Giá trị</th>
                <th>Trạng thái</th>
                <th>Nghiệp vụ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><strong>#{order.id}</strong></td>
                  <td>{order.customer}</td>
                  <td>
                    {order.type}
                    <div className="adm-tags">
                      {order.preOrder && <span className="adm-tag2">Pre-order</span>}
                    </div>
                  </td>
                  <td className="adm-money">{toCurrency(order.total)}</td>
                  <td>
                    <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)}>
                      {Object.entries(statusLabelMap).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="adm-row-actions">
                      <button className="adm-btn adm-btn-secondary" onClick={() => openOrderDetail(order.id)}>Xem chi tiết</button>
                      <button className="adm-btn adm-btn-light" onClick={() => updateOrderStatus(order.id, "PROCESSING")}>Xác nhận</button>
                      <button className="adm-btn adm-btn-primary" onClick={() => updateOrderStatus(order.id, "COMPLETED")}>Hoàn tất</button>
                      <button className="adm-btn adm-btn-danger" onClick={() => updateOrderStatus(order.id, "CANCELLED")}>Hủy</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loadingOrders && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="adm-muted">Chưa có đơn hàng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
