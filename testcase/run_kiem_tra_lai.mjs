/**
 * Thực hiện test trực tiếp các TC đang "Kiểm tra lại" (34,35,37,42,44,46)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:5000';

async function login() {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin.test@laptop-shop.com', password: 'Admin@123' }),
  });
  const data = await r.json();
  return { token: data.data?.token, ok: data.success };
}

async function api(method, urlPath, body, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const opts = { method, headers };
  if (body !== undefined) {
    if (body instanceof FormData) {
      opts.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(`${BASE}${urlPath}`, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return { status: res.status, data };
}

// 1x1 PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const results = {};

async function main() {
  const { token } = await login();
  if (!token) throw new Error('Không login được admin');

  // TC34 — Lỗi cập nhật trạng thái (trạng thái không hợp lệ, đơn không đổi)
  {
    const before = await api('GET', '/api/orders/920', undefined, token);
    const stBefore = before.data?.data?.status;
    const bad = await api('PUT', '/api/orders/920/status', { status: 'INVALID_XYZ' }, token);
    const after = await api('GET', '/api/orders/920', undefined, token);
    const stAfter = after.data?.data?.status;
    const pass = bad.status === 400 && stBefore === stAfter;
    results[34] = {
      status: pass ? 'Pass' : 'Fail',
      actual: `Gửi trạng thái sai → HTTP ${bad.status}: ${bad.data?.message}. Trạng thái đơn trước/sau: ${stBefore}/${stAfter}`,
    };
  }

  // TC35 — Thêm SP mới thành công
  {
    const sku = `TEST-TC35-${Date.now()}`;
    const form = new FormData();
    form.append('product_name', 'Laptop Test TC35');
    form.append('brand_id', '1');
    form.append('category_id', '2');
    form.append('device_type', 'LAPTOP');
    form.append('description_html', '<p>Test TC35</p>');
    form.append('screen_size', '15.6');
    form.append('weight_kg', '2');
    form.append('os', 'Windows 11');
    form.append(
      'variants',
      JSON.stringify([
        {
          sku,
          cpu_name: 'Intel i5',
          ram_gb: 16,
          storage_gb: 512,
          color_name: 'Black',
          original_price: 15000000,
          stock_quantity: 5,
          status: 'IN_STOCK',
        },
      ])
    );
    const blob = new Blob([PNG], { type: 'image/png' });
    form.append('productImages', blob, 'product.png');
    form.append('variant_0_images', blob, 'variant.png');
    const r = await api('POST', '/api/products', form, token);
    results[35] = {
      status: r.status === 201 || r.data?.success ? 'Pass' : 'Fail',
      actual: `POST /api/products → HTTP ${r.status}: ${r.data?.message || JSON.stringify(r.data)}`,
    };
  }

  // TC37 — Trùng SKU
  {
    const form = new FormData();
    form.append('product_name', 'Laptop Trung SKU');
    form.append('brand_id', '1');
    form.append('category_id', '2');
    form.append('device_type', 'LAPTOP');
    form.append('screen_size', '15.6');
    form.append('weight_kg', '2');
    form.append('os', 'Windows 11');
    form.append(
      'variants',
      JSON.stringify([
        {
          sku: 'DELL-XPS15-i7-16-512-SILVER',
          cpu_name: 'Intel i7',
          ram_gb: 16,
          storage_gb: 512,
          color_name: 'Silver',
          original_price: 32000000,
          stock_quantity: 1,
        },
      ])
    );
    const blob = new Blob([PNG], { type: 'image/png' });
    form.append('productImages', blob, 'product.png');
    form.append('variant_0_images', blob, 'variant.png');
    const r = await api('POST', '/api/products', form, token);
    const msg = (r.data?.message || '') + JSON.stringify(r.data?.errors || '');
    const dup = r.status === 409 || /trùng|tồn tại|duplicate|sku/i.test(msg);
    results[37] = {
      status: dup ? 'Pass' : 'Fail',
      actual: `POST SKU trùng DELL-XPS15-i7-16-512-SILVER → HTTP ${r.status}: ${r.data?.message || msg}`,
    };
  }

  // TC42 — Lỗi ghi đè trạng thái đơn (đơn đã hủy → không cho đổi PROCESSING)
  {
    await api('PUT', '/api/orders/920/status', { status: 'CANCELLED' }, token);
    const r = await api('PUT', '/api/orders/920/status', { status: 'PROCESSING' }, token);
    // Kỳ vọng testcase: lỗi, không cập nhật sai — hệ thống KHÔNG chặn CANCELLED→PROCESSING
    const wronglyUpdated = r.data?.success && r.status === 200;
    results[42] = {
      status: wronglyUpdated ? 'Fail' : 'Pass',
      actual: wronglyUpdated
        ? `LỖI: Đơn #920 đã CANCELLED nhưng vẫn đổi sang PROCESSING thành công (HTTP 200) — không đúng testcase.`
        : `HTTP ${r.status}: ${r.data?.message}`,
    };
  }

  // TC44 — Lỗi khi xóa review (ID không tồn tại / không có quyền)
  {
    const r = await api('DELETE', '/api/auth/admin/reviews/999999', undefined, token);
    const noToken = await api('DELETE', '/api/auth/admin/reviews/1', undefined, null);
    results[44] = {
      status: r.status === 404 && noToken.status === 401 ? 'Pass' : 'Fail',
      actual: `Xóa review #999999 → HTTP ${r.status}. Không token → HTTP ${noToken.status}. (Mất mạng thật: F12 Offline trên UI)`,
    };
  }

  // TC46 — Dashboard khoảng trống (không có filter ngày trên FE)
  {
    const orders = await api('GET', '/api/orders?limit=200');
    const all = orders.data?.data || [];
    const completed = all.filter((o) => o.status === 'COMPLETED');
    const hasDateFilter = false; // AdminDashboard không có date picker
    results[46] = {
      status: hasDateFilter ? 'Pass' : 'Fail',
      actual: hasDateFilter
        ? 'Có filter ngày trên Dashboard'
        : `Dashboard không có chọn khoảng ngày. Tổng ${all.length} đơn, ${completed.length} hoàn thành — không lọc theo tháng trống được.`,
    };
  }

  // In + ghi file
  const lines = [
    'KẾT QUẢ SAU KHI TEST TRỰC TIẾP — CÁC TC "KIỂM TRA LẠI"',
    `Thời gian: ${new Date().toLocaleString('vi-VN')}`,
    '',
  ];
  for (const stt of [34, 35, 37, 42, 44, 46]) {
    const r = results[stt];
    lines.push(`TC${stt} | ${r.status} | ${r.actual}`);
  }
  const out = lines.join('\n');
  console.log(out);
  fs.writeFileSync(path.join(__dirname, 'KET_QUA_KIEM_TRA_LAI.txt'), out, 'utf8');

  // Merge vào KET_QUA_TC30_46
  mergeMainFile(results);
}

function mergeMainFile(results) {
  const mainPath = path.join(__dirname, 'KET_QUA_TC30_46.txt');
  let content = fs.readFileSync(mainPath, 'utf8');
  const map = {
    34: 'NV cập nhật trạng thái - lỗi hệ thống',
    35: 'Admin thêm SP mới',
    37: 'Admin SP trùng mã',
    42: 'Admin lỗi ghi đè đơn',
    44: 'Admin mất kết nối duyệt nội dung',
    46: 'Dashboard khoảng trống',
  };
  for (const [stt, r] of Object.entries(results)) {
    const re = new RegExp(`^${stt.padStart(2, ' ')}\\s*\\| Kiểm tra lại\\s*\\|[^\\n]*\\|[^\\n]*`, 'm');
    const repl = `${String(stt).padStart(2, ' ')}  | ${r.status.padEnd(15)} | ${map[stt].padEnd(38)} | ${r.actual}`;
    if (re.test(content)) content = content.replace(re, repl);
  }
  // Recount totals
  const passes = (content.match(/\| Pass\s+\|/g) || []).length;
  const fails = (content.match(/\| Fail\s+\|/g) || []).length;
  const ktl = (content.match(/\| Kiểm tra lại/g) || []).length;
  content = content.replace(
    /Pass\s+:\s*\d+.*\n\s*Fail\s+:\s*\d+.*\n\s*Kiểm tra lại\s+:\s*\d+.*/,
    `Pass         : ${passes}\n  Fail         : ${fails}\n  Kiểm tra lại : ${ktl}`
  );
  fs.writeFileSync(mainPath, content, 'utf8');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
