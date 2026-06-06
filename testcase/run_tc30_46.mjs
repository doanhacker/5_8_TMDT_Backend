/**
 * Chạy test API TC30-46 từ Testcase.xlsx
 * node testcase/run_tc30_46.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:5000';
const casesDir = path.join(__dirname, 'cases');

const SOURCE = JSON.parse(fs.readFileSync(path.join(__dirname, 'testcase_source.json'), 'utf8'));
const TC_MAP = Object.fromEntries(
  SOURCE.slice(1).map((r) => [Number(r[0]), r])
);

async function req(method, urlPath, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${urlPath}`, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return { status: res.status, data };
}

async function login(email, password) {
  const r = await req('POST', '/api/auth/login', { email, password });
  return {
    ok: r.data?.success,
    token: r.data?.data?.token,
    userId: r.data?.data?.user?.user_id,
    message: r.data?.message,
  };
}

function writeCaseFile(stt, row, result) {
  const pad = String(stt).padStart(3, '0');
  const file = path.join(casesDir, `TC${pad}.txt`);
  const content = `TEST CASE ${stt}
==================
Chức năng    : ${row[1]}
Mô tả        : ${row[2]}

Dữ liệu đầu vào:
${row[3]}

Bước thực hiện (theo file testcase):
${row[4]}

Kết quả mong đợi:
${row[5]}

--- KẾT QUẢ KIỂM THỬ ---
Trạng thái (Pass/Fail): ${result.status}
Kết quả thực tế:
${result.actual}

Cách kiểm tra trên hệ thống:
${result.howToTest}

Ghi chú:
${result.note || '(không)'}
`;
  fs.writeFileSync(file, content, 'utf8');
}

const results = [];

function record(stt, status, actual, howToTest, note = '') {
  const row = TC_MAP[stt];
  const item = { stt, status, actual, howToTest, note, row };
  results.push(item);
  writeCaseFile(stt, row, { status, actual, howToTest, note });
}

async function main() {
  if (!fs.existsSync(casesDir)) fs.mkdirSync(casesDir, { recursive: true });

  const admin = await login('admin.test@laptop-shop.com', 'Admin@123');
  const customer = await login('khachhang01@example.com', 'P@ssword123');
  const adminToken = admin.token;
  const customerToken = customer.token;
  const customerId = customer.userId || 904;

  // TC30 - Staff chat tiếp nhận
  {
    const ai = await req('POST', '/api/ai/chat', { message: 'Can tu van laptop' }, customerToken);
    record(
      30,
      'Fail',
      'Không có API/UI chat nhân viên (staff). Chỉ có chatbot AI (/api/ai/chat) và bảng chat_rooms trong DB chưa có route.',
      '1. Đăng nhập khách → tìm mục chat nhân viên (không có).\n2. DB: SELECT * FROM chat_rooms (có mock room 920 sau seed).\n3. So sánh với testcase yêu cầu nhân viên tiếp nhận trên UI.',
      'Đã seed chat_rooms #920 + tin nhắn mock trong test/seed_mock_tc30_46.sql nhưng chưa có màn staff.'
    );
  }

  // TC31
  record(
    31,
    'Fail',
    'Không có luồng chat nhân viên để xử lý phản hồi không hài lòng.',
    'Manual: cần triển khai staff chat trước khi test.',
    'Phụ thuộc TC30.'
  );

  // TC32
  record(
    32,
    'Fail',
    'Không có chức năng nhân viên yêu cầu thêm thông tin / chuyển bộ phận.',
    'Manual khi có staff portal.',
    'Phụ thuộc TC30.'
  );

  // TC33 - Cập nhật trạng thái đơn
  {
    const orders = await req('GET', '/api/orders?status=PENDING_CONFIRMATION&limit=5', undefined, adminToken);
    const list = orders.data?.data || orders.data?.orders || [];
    let orderId = list[0]?.order_id;
    if (!orderId) {
      const any = await req('GET', '/api/orders?limit=5');
      orderId = (any.data?.data || [])[0]?.order_id || 920;
    }
    const upd = await req('PUT', `/api/orders/${orderId}/status`, { status: 'PROCESSING' }, adminToken);
    const ok = upd.data?.success;
    record(
      33,
      ok ? 'Pass' : 'Fail',
      ok
        ? `PUT /api/orders/${orderId}/status → PROCESSING: ${upd.data.message}`
        : `HTTP ${upd.status}: ${upd.data?.message}`,
      `1. Login admin → http://localhost:5173/admin\n2. Tab Đơn hàng → chọn đơn #${orderId}\n3. Đổi trạng thái Đang xử lý → Lưu`,
      'Mock đơn #920 PENDING_CONFIRMATION (seed_mock_tc30_46.sql).'
    );
  }

  // TC34 - Lỗi cập nhật (N/A manual)
  record(
    34,
    'N/A',
    'Chưa test tự động — cần tắt MySQL/backend khi admin bấm Lưu.',
    '1. Admin mở đơn hàng.\n2. Stop MySQL trong XAMPP.\n3. Đổi trạng thái → Lưu → phải báo lỗi.',
    'Test thủ công.'
  );

  // TC35 - Thêm SP
  {
    const bad = await req('POST', '/api/products', {}, adminToken);
    const hasAuth = bad.status !== 401;
    record(
      35,
      'Partial',
      hasAuth
        ? `API POST /api/products tồn tại (HTTP ${bad.status}). Tạo SP đầy đủ cần multipart + ảnh trên UI.`
        : 'Không có quyền admin token.',
      '1. Login admin.test@laptop-shop.com / Admin@123\n2. /admin → Sản phẩm → Thêm mới\n3. Điền đủ field + ảnh → Lưu\n4. Kiểm tra SP trên /laptop',
      'API: POST /api/products (multipart).'
    );
  }

  // TC36 - Thiếu thông tin
  {
    const r = await req('POST', '/api/products', { product_name: '' }, adminToken);
    record(
      36,
      r.status >= 400 ? 'Pass' : 'Partial',
      `POST thiếu dữ liệu → HTTP ${r.status}: ${r.data?.message || JSON.stringify(r.data?.errors)}`,
      'Admin → Thêm SP → để trống tên/giá → Lưu → xem thông báo lỗi form/API.',
      ''
    );
  }

  // TC37 - Trùng SKU
  {
    const r = await req('POST', '/api/products', {
      product_name: 'Test Trung SKU',
      brand_id: 901,
      category_id: 901,
      variants: [{ sku: 'MOCK-SKU-901', ram_gb: 16, storage_gb: 512, color_name: 'Black', original_price: 1000000, stock_quantity: 1 }],
    }, adminToken);
    record(
      37,
      r.status === 409 || (r.data?.message || '').toLowerCase().includes('tồn tại') ? 'Pass' : 'Partial',
      `HTTP ${r.status}: ${r.data?.message || 'cần test UI với SKU MOCK-SKU-901 đã có variant 901'}`,
      'Admin → Thêm SP → nhập SKU trùng variant hiện có → Lưu.',
      'Variant 901 đã có SKU trong DB mock.'
    );
  }

  // TC38 - Tìm & khóa KH
  {
    const list = await req('GET', '/api/auth/admin/customers', undefined, adminToken);
    const customers = list.data?.data || [];
    const target = customers.find((c) => (c.email || '').includes('khachhang01'));
    let lockMsg = 'Không thấy khách trong danh sách';
    if (target) {
      const lock = await req('PATCH', `/api/auth/admin/customers/${target.user_id}/status`, { status: 'LOCKED' }, adminToken);
      if (lock.data?.success) {
        await req('PATCH', `/api/auth/admin/customers/${target.user_id}/status`, { status: 'ACTIVE' }, adminToken);
      }
      lockMsg = lock.data?.message || `HTTP ${lock.status}`;
    }
    record(
      38,
      list.status === 200 && target ? 'Pass' : 'Partial',
      `GET customers: ${customers.length} KH. ${target ? `Khóa/mở khóa user ${target.user_id}: ${lockMsg}` : lockMsg}`,
      '1. /admin → Khách hàng\n2. Tìm khachhang01@example.com\n3. Khóa tài khoản → xác nhận\n4. Mở khóa lại',
      ''
    );
  }

  // TC39 - Không tìm thấy user
  {
    const list = await req('GET', '/api/auth/admin/customers', undefined, adminToken);
    const filtered = (list.data?.data || []).filter((c) =>
      (c.email || '').includes('zzznotfound999')
    );
    record(
      39,
      filtered.length === 0 ? 'Pass' : 'Fail',
      `Tìm zzznotfound999: ${filtered.length} kết quả (UI lọc client-side trên danh sách đầy đủ).`,
      '/admin → Khách hàng → ô tìm zzznotfound999 → không có dòng / thông báo trống.',
      'API trả toàn bộ list; FE filter.'
    );
  }

  // TC40 - Admin tự khóa
  {
    const adminId = admin.userId || 905;
    const lock = await req('PATCH', `/api/auth/admin/customers/${adminId}/status`, { status: 'LOCKED' }, adminToken);
    record(
      40,
      lock.status === 403 || (lock.data?.message || '').includes('không') ? 'Pass' : 'Partial',
      `PATCH khóa chính admin (id ${adminId}): HTTP ${lock.status} — ${lock.data?.message}`,
      'Admin → Khách hàng → tìm email admin → thử Khóa. Kỳ vọng: chặn hoặc admin không nằm trong list KH.',
      'Admin có thể không có trong danh sách customers (chỉ role CUSTOMER).'
    );
  }

  // TC41 - Ghi đè trạng thái đơn
  {
    const any = await req('GET', '/api/orders?limit=1');
    const orderId = (any.data?.data || [])[0]?.order_id || 920;
    const cancel = await req('PUT', `/api/orders/${orderId}/status`, { status: 'CANCELLED' }, adminToken);
    record(
      41,
      cancel.data?.success ? 'Pass' : 'Partial',
      `Ghi đè đơn #${orderId} → CANCELLED: ${cancel.data?.message || cancel.status}`,
      '/admin → Đơn hàng → chọn đơn → đổi Đã hủy → Lưu.',
      ''
    );
  }

  // TC42 - N/A
  record(
    42,
    'N/A',
    'Test thủ công: tắt DB khi admin lưu trạng thái đơn.',
    'Giống TC34.',
    ''
  );

  // TC43 - Xóa review
  {
    const reviews = await req('GET', '/api/auth/admin/reviews', undefined, adminToken);
    const list = reviews.data?.data || [];
    const rid = list[0]?.review_id || 920;
    const del = await req('DELETE', `/api/auth/admin/reviews/${rid}`, undefined, adminToken);
    record(
      43,
      del.data?.success ? 'Pass' : 'Partial',
      del.data?.success
        ? `DELETE review #${rid}: ${del.data.message}`
        : `HTTP ${del.status}: ${del.data?.message}. Reviews hiện có: ${list.length}`,
      '/admin → Nội dung/Đánh giá → Xóa 1 review.\nAPI: DELETE /api/auth/admin/reviews/:id',
      'Seed review #920 trong seed_mock_tc30_46.sql (chạy lại seed nếu đã xóa).'
    );
  }

  // TC44 - N/A offline
  record(
    44,
    'N/A',
    'Test thủ công: DevTools Offline khi admin xóa/duyệt nội dung.',
    'F12 → Network Offline → thao tác xóa review.',
    ''
  );

  // TC45 - Dashboard
  {
    const orders = await req('GET', '/api/orders?limit=100');
    const count = (orders.data?.data || []).length;
    record(
      45,
      count > 0 ? 'Partial' : 'Partial',
      `Dashboard FE: /admin có biểu đồ. API orders: ${count} đơn. Chưa có nút Xuất Excel/PDF.`,
      '1. /admin (Dashboard)\n2. Xem biểu đồ doanh thu/đơn\n3. Tìm nút Export (chưa có → Partial)',
      ''
    );
  }

  // TC46 - Dashboard rỗng
  record(
    46,
    'Partial',
    'Dashboard hiển thị theo dữ liệu orders — chọn khoảng ngày không có đơn trên UI (nếu có filter).',
    '/admin → Dashboard → chọn ngày tương lai hoặc năm cũ không có giao dịch.',
    'Cần kiểm tra filter ngày trên AdminDashboard.'
  );

  // Summary file
  const lines = [
    'KẾT QUẢ KIỂM THỬ TC30 - TC46',
    `File nguồn: Testcase.xlsx`,
    `Thời gian: ${new Date().toLocaleString('vi-VN')}`,
    `API: ${BASE}`,
    '',
    'Tài khoản dùng khi test:',
    '  Admin   : admin.test@laptop-shop.com / Admin@123',
    '  Khách   : khachhang01@example.com / P@ssword123',
    '',
    'Mock data: chạy trước',
    '  Get-Content testcase\\seed_mock_tc30_46.sql -Raw | D:\\xampp\\mysql\\bin\\mysql.exe -u root laptop_ecommerce_db',
    '',
    'Chi tiết từng TC: thư mục testcase/cases/TC030.txt ... TC046.txt',
    '',
    '='.repeat(90),
    '',
  ];

  let pass = 0,
    fail = 0,
    partial = 0,
    na = 0;
  for (const r of results.sort((a, b) => a.stt - b.stt)) {
    const row = r.row;
    lines.push(`TC${String(r.stt).padStart(2, '0')} | ${row[1]} | ${row[2]}`);
    lines.push(`  Trạng thái      : ${r.status}`);
    lines.push(`  Kết quả thực tế : ${r.actual.replace(/\n/g, ' ')}`);
    lines.push(`  Cách kiểm tra   : ${r.howToTest.split('\n')[0]}...`);
    if (r.note) lines.push(`  Ghi chú         : ${r.note}`);
    lines.push('');
    if (r.status === 'Pass') pass++;
    else if (r.status === 'Fail') fail++;
    else if (r.status === 'Partial') partial++;
    else na++;
  }

  lines.push('='.repeat(90));
  lines.push(`Tổng: Pass=${pass} | Partial=${partial} | Fail=${fail} | N/A=${na}`);
  lines.push('');
  lines.push('BẢNG TÓM TẮT');
  lines.push('STT | Trạng thái | Chức năng (rút gọn)');
  lines.push('----|-----------|------------------');
  for (const r of results.sort((a, b) => a.stt - b.stt)) {
    lines.push(
      `${String(r.stt).padStart(2)} | ${r.status.padEnd(7)} | ${(r.row[1] + ' - ' + r.row[2]).slice(0, 55)}`
    );
  }

  fs.writeFileSync(path.join(__dirname, 'KET_QUA_TC30_46.txt'), lines.join('\n'), 'utf8');
  console.log(lines.join('\n'));
  console.log('\nĐã ghi:', path.join(__dirname, 'KET_QUA_TC30_46.txt'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
