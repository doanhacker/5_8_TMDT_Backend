const toCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`

const escapeCsv = (value) => {
  const text = String(value ?? "")
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const exportAnalyticsReportExcel = (reportPayload) => {
  if (!reportPayload) {
    throw new Error("Chưa có dữ liệu báo cáo để xuất.")
  }

  const { period, overview, chart_data: chartData = [], top_products: topProducts = [] } = reportPayload
  const lines = [
    ["BÁO CÁO THỐNG KÊ DOANH THU"],
    ["Khoảng thời gian", period?.label || ""],
    ["Từ ngày", period?.date_from || ""],
    ["Đến ngày", period?.date_to || ""],
    [],
    ["Tổng doanh thu", overview?.total_revenue ?? overview?.revenue_month ?? 0],
    ["Đơn hoàn thành", overview?.orders_completed ?? 0],
    ["Giá trị đơn TB", overview?.avg_order_value ?? 0],
    ["Tỷ lệ hủy (%)", overview?.cancel_rate ?? 0],
    [],
    ["Ngày", "Doanh thu", "Số đơn", "AOV"],
    ...chartData.map((row) => [
      row.day || row.period_label,
      row.revenue ?? 0,
      row.order_count ?? 0,
      row.avg_order_value ?? 0,
    ]),
    [],
    ["Top sản phẩm"],
    ["#", "Tên sản phẩm", "Đã bán", "Doanh thu", "Tồn kho"],
    ...topProducts.map((item, index) => [
      index + 1,
      item.product_name,
      item.sold_qty,
      item.revenue,
      item.current_stock,
    ]),
  ]

  const csvBody = lines
    .map((row) => (Array.isArray(row) ? row.map(escapeCsv).join(",") : escapeCsv(row)))
    .join("\n")

  const blob = new Blob([`\uFEFF${csvBody}`], { type: "text/csv;charset=utf-8;" })
  const filename = `bao-cao-doanh-thu_${period?.date_from || "report"}.csv`
  downloadBlob(blob, filename)
}

export const exportAnalyticsReportPdf = (reportPayload) => {
  if (!reportPayload) {
    throw new Error("Chưa có dữ liệu báo cáo để xuất.")
  }

  const { period, overview, chart_data: chartData = [], top_products: topProducts = [] } = reportPayload
  const chartRows = chartData
    .filter((row) => Number(row.revenue || 0) > 0)
    .map((row) => `
      <tr>
        <td>${row.day || row.period_label || "--"}</td>
        <td>${toCurrency(row.revenue)}</td>
        <td>${Number(row.order_count || 0).toLocaleString("vi-VN")}</td>
        <td>${toCurrency(row.avg_order_value)}</td>
      </tr>
    `)
    .join("")

  const topRows = topProducts.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.product_name || "--"}</td>
      <td>${Number(item.sold_qty || 0).toLocaleString("vi-VN")}</td>
      <td>${toCurrency(item.revenue)}</td>
    </tr>
  `).join("")

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>Báo cáo doanh thu</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
          h1 { font-size: 22px; margin-bottom: 8px; }
          .meta { color: #64748b; margin-bottom: 20px; }
          .kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
          .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 13px; }
          th { background: #f8fafc; }
        </style>
      </head>
      <body>
        <h1>Báo cáo thống kê doanh thu</h1>
        <p class="meta">${period?.label || ""} (${period?.date_from || ""} → ${period?.date_to || ""})</p>
        <div class="kpis">
          <div class="kpi"><strong>Tổng doanh thu</strong><div>${toCurrency(overview?.total_revenue ?? overview?.revenue_month)}</div></div>
          <div class="kpi"><strong>Đơn hoàn thành</strong><div>${overview?.orders_completed ?? 0}</div></div>
          <div class="kpi"><strong>AOV</strong><div>${toCurrency(overview?.avg_order_value)}</div></div>
          <div class="kpi"><strong>Tỷ lệ hủy</strong><div>${overview?.cancel_rate ?? 0}%</div></div>
        </div>
        <h2>Doanh thu theo ngày</h2>
        <table>
          <thead><tr><th>Ngày</th><th>Doanh thu</th><th>Số đơn</th><th>AOV</th></tr></thead>
          <tbody>${chartRows || "<tr><td colspan='4'>Không có dữ liệu</td></tr>"}</tbody>
        </table>
        <h2>Top sản phẩm</h2>
        <table>
          <thead><tr><th>#</th><th>Sản phẩm</th><th>Đã bán</th><th>Doanh thu</th></tr></thead>
          <tbody>${topRows || "<tr><td colspan='4'>Không có dữ liệu</td></tr>"}</tbody>
        </table>
      </body>
    </html>
  `

  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    throw new Error("Trình duyệt chặn cửa sổ in. Vui lòng cho phép popup.")
  }
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}
