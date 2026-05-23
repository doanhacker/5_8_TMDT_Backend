const toCurrency = (value) => `${value.toLocaleString("vi-VN")}đ`

export default function AdminCustomers({ 
  customers, 
  toggleCustomerLock,
  loadingCustomers,
}) {
  return (
    <section className="adm-card adm-card-pad">
      <h3>Quản lý khách hàng</h3>
      {loadingCustomers && <p className="adm-muted">Đang tải danh sách khách hàng...</p>}
      <div className="adm-table-wrap">
        <table className="adm-table2">
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Lịch sử mua</th>
              <th>Phân loại</th>
              <th>Tổng chi tiêu</th>
              <th>Hành vi</th>
              <th>Tác vụ</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td><strong>{customer.name}</strong></td>
                <td>{customer.orders} đơn</td>
                <td>{customer.segment}</td>
                <td className="adm-money">{toCurrency(customer.totalSpent)}</td>
                <td>{customer.orders >= 10 ? "Mua lặp lại cao" : "Mua theo nhu cầu"}</td>
                <td>
                  <button className={`adm-btn ${customer.status === "locked" ? "adm-btn-light" : "adm-btn-danger"}`} onClick={() => toggleCustomerLock(customer.id)}>
                    {customer.status === "locked" ? "Mở khóa" : "Khóa"}
                  </button>
                </td>
              </tr>
            ))}
            {!loadingCustomers && customers.length === 0 && (
              <tr>
                <td colSpan={6} className="adm-muted">Không có khách hàng nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
