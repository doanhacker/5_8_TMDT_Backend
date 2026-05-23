

export default function AdminStaff({ 
  staffUsers, 
  newStaff, 
  setNewStaff, 
  createStaff 
}) {
  return (
    <div className="adm-grid">
      <section className="adm-card adm-card-pad">
        <h3>Tạo tài khoản nhân viên</h3>
        <form className="adm-form-compact" onSubmit={createStaff}>
          <input placeholder="Họ tên" value={newStaff.name} onChange={(event) => setNewStaff((prev) => ({ ...prev, name: event.target.value }))} required />
          <input placeholder="Số điện thoại" value={newStaff.phone} onChange={(event) => setNewStaff((prev) => ({ ...prev, phone: event.target.value }))} required />
          <input type="password" placeholder="Mật khẩu" value={newStaff.password} onChange={(event) => setNewStaff((prev) => ({ ...prev, password: event.target.value }))} required />
          <input
            type="email"
            placeholder="Email"
            value={newStaff.email}
            onChange={(event) => setNewStaff((prev) => ({ ...prev, email: event.target.value }))}
            pattern={'^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'}
            title="Email phải đúng định dạng, ví dụ: user@example.com"
            required
          />
          <select value={newStaff.role} onChange={(event) => setNewStaff((prev) => ({ ...prev, role: event.target.value }))}>
            <option value="staff">Nhân viên</option>
            <option value="admin">Admin</option>
          </select>
          <button className="adm-btn adm-btn-primary" type="submit">Tạo</button>
        </form>
      </section>

      <section className="adm-card adm-card-pad">
        <h3>Danh sách người dùng hệ thống</h3>
        <div className="adm-table-wrap">
          <table className="adm-table2">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Số điện thoại</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Vai trò</th>
              </tr>
            </thead>
            <tbody>
              {staffUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.phone}</td>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className="adm-chip">{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
