import { buildApiUrl } from "../config/api";
import { filterPaymentMockProducts } from "../utils/paymentMockCatalog";

export async function getSearchSuggestions(keyword, limit = 5) {
  const q = String(keyword || "").trim();
  if (!q) return { categories: [], products: [] };

  const params = new URLSearchParams({
    q,
    limit: String(limit),
    categoryLimit: "5",
  });

  const res = await fetch(buildApiUrl(`/api/products/search/suggest?${params.toString()}`));
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.success === false) {
    throw new Error(data?.message || "Không lấy được gợi ý tìm kiếm");
  }

  const payload = data?.data || { categories: [], products: [] };
  return {
    ...payload,
    products: filterPaymentMockProducts(payload.products),
  };
}