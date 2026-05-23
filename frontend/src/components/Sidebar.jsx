import '../styles/Sidebar.css'

export default function Sidebar() {
  // placeholder filters or categories
  return (
    <div className="sidebar-wrapper">
      <h3>Lọc theo</h3>
      <ul>
        <li>Giá</li>
        <li>Thương hiệu</li>
        <li>Cấu hình</li>
      </ul>
    </div>
  )
}