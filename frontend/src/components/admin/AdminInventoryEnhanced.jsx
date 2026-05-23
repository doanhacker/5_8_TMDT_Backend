export default function AdminInventory({ 
  stockForm, 
  setStockForm, 
  handleStockImport, 
  lowStockItems,
  loadingInventory 
}) {
  return (
    <div className="adm-grid">
      <section className="adm-card adm-card-pad">
        <h3>Nhập kho</h3>
        <form className="adm-form-compact" onSubmit={handleStockImport}>
          <input
            type="number"
            placeholder="Variant ID"
            value={stockForm.variantId}
            onChange={(event) => setStockForm((prev) => ({ ...prev, variantId: event.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Nhà cung cấp"
            value={stockForm.supplierName}
            onChange={(event) => setStockForm((prev) => ({ ...prev, supplierName: event.target.value }))}
            required
          />
          <input
            type="number"
            placeholder="Số lượng nhập"
            value={stockForm.quantity}
            onChange={(event) => setStockForm((prev) => ({ ...prev, quantity: event.target.value }))}
            required
          />
          <input
            type="number"
            placeholder="Giá nhập / đơn vị"
            value={stockForm.unitImportPrice}
            onChange={(event) => setStockForm((prev) => ({ ...prev, unitImportPrice: event.target.value }))}
            required
          />
          <button type="submit" className="adm-btn adm-btn-primary">Tạo phiếu nhập</button>
        </form>
      </section>

      <section className="adm-card adm-card-pad">
        <h3>Cảnh báo dưới mức tối thiểu</h3>
        {loadingInventory && <p className="adm-muted">Đang tải tồn kho...</p>}
        {lowStockItems.length ? (
          <ul className="adm-bullets">
            {lowStockItems.map((item) => (
              <li key={item.variant_id}>
                #{item.variant_id} - {item.product_name} ({item.color_name}) - còn {item.stock_quantity}
              </li>
            ))}
          </ul>
        ) : (
          <p className="adm-muted">Hiện chưa có sản phẩm dưới mức tối thiểu.</p>
        )}
      </section>
    </div>
  )
}
