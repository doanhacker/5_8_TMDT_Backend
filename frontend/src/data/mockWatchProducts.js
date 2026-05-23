/**
 * Dữ liệu đồng hồ tĩnh cho frontend — chỉnh sửa trực tiếp file này hoặc nối API sau.
 * id: dùng cho đường dẫn /product/:id (cần khớp backend khi tích hợp).
 */

export const WATCH_BRANDS = [
  { id: "apple", name: "Apple" },
  { id: "samsung", name: "Samsung" },
  { id: "garmin", name: "Garmin" },
  { id: "xiaomi", name: "Xiaomi" },
  { id: "huawei", name: "Huawei" },
  { id: "amazfit", name: "Amazfit" },
  { id: "fossil", name: "Fossil" },
  { id: "casio", name: "Casio" },
  { id: "orient", name: "Orient" }
]

/** Danh mục nhanh — khớp query ?category= */
export const WATCH_CATEGORY_IDS = {
  ALL: "all",
  SMARTWATCH: "smartwatch",
  SPORT: "sport",
  FASHION: "fashion",
  CLASSIC: "classic",
  KIDS: "kids"
}

export const WATCH_NEED_ITEMS = [
  { id: WATCH_CATEGORY_IDS.SMARTWATCH, label: "Smartwatch", hint: "Theo dõi sức khỏe" },
  { id: WATCH_CATEGORY_IDS.SPORT, label: "Thể thao", hint: "GPS, chống nước" },
  { id: WATCH_CATEGORY_IDS.FASHION, label: "Thời trang", hint: "Mặt mỏng, sang trọng" },
  { id: WATCH_CATEGORY_IDS.CLASSIC, label: "Cổ điển", hint: "Kim - máy cơ/quartz" },
  { id: WATCH_CATEGORY_IDS.KIDS, label: "Trẻ em", hint: "Nhẹ, an toàn" }
]

export const MOCK_WATCH_PRODUCTS = [
  {
    product_id: 9001,
    product_name: "Apple Watch Series 9 GPS 45mm",
    brand_name: "Apple",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=600&q=80",
    min_price: 8990000,
    max_price: 9990000,
    total_sold: 420,
    total_stock: 80,
    category_slug: WATCH_CATEGORY_IDS.SMARTWATCH,
    strap: "Silicon",
    features: ["GPS", "Chống nước", "Nhịp tim"],
    new_arrival: true
  },
  {
    product_id: 9002,
    product_name: "Samsung Galaxy Watch6 Classic 47mm",
    brand_name: "Samsung",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1522312346375-dcbb28ae7cf9?w=600&q=80",
    min_price: 7490000,
    max_price: 8490000,
    total_sold: 310,
    total_stock: 55,
    category_slug: WATCH_CATEGORY_IDS.SMARTWATCH,
    strap: "Da",
    features: ["GPS", "Nhịp tim", "ECG"],
    new_arrival: false
  },
  {
    product_id: 9003,
    product_name: "Garmin Forerunner 265 Music",
    brand_name: "Garmin",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?w=600&q=80",
    min_price: 9290000,
    max_price: 10290000,
    total_sold: 180,
    total_stock: 40,
    category_slug: WATCH_CATEGORY_IDS.SPORT,
    strap: "Silicon",
    features: ["GPS", "Chống nước", "Nhịp tim"],
    new_arrival: true
  },
  {
    product_id: 9004,
    product_name: "Xiaomi Watch 2 Pro",
    brand_name: "Xiaomi",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&q=80",
    min_price: 4290000,
    max_price: 4990000,
    total_sold: 560,
    total_stock: 120,
    category_slug: WATCH_CATEGORY_IDS.SMARTWATCH,
    strap: "Silicon",
    features: ["GPS", "NFC"],
    new_arrival: false
  },
  {
    product_id: 9005,
    product_name: "Huawei Watch GT 4 46mm",
    brand_name: "Huawei",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1526045431048-f857369baa09?w=600&q=80",
    min_price: 5290000,
    max_price: 5990000,
    total_sold: 290,
    total_stock: 70,
    category_slug: WATCH_CATEGORY_IDS.SMARTWATCH,
    strap: "Kim loại",
    features: ["GPS", "Nhịp tim"],
    new_arrival: false
  },
  {
    product_id: 9006,
    product_name: "Amazfit Balance",
    brand_name: "Amazfit",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1617625802912-cadef9a3976b?w=600&q=80",
    min_price: 3790000,
    max_price: 4290000,
    total_sold: 410,
    total_stock: 90,
    category_slug: WATCH_CATEGORY_IDS.SPORT,
    strap: "Silicon",
    features: ["GPS", "Pin trâu"],
    new_arrival: true
  },
  {
    product_id: 9007,
    product_name: "Fossil Gen 6 Wellness Edition",
    brand_name: "Fossil",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=600&q=80",
    min_price: 5990000,
    max_price: 6990000,
    total_sold: 95,
    total_stock: 35,
    category_slug: WATCH_CATEGORY_IDS.FASHION,
    strap: "Da",
    features: ["Wear OS", "Nhịp tim"],
    new_arrival: false
  },
  {
    product_id: 9008,
    product_name: "Casio G-Shock GA-B2100",
    brand_name: "Casio",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=600&q=80",
    min_price: 4290000,
    max_price: 4790000,
    total_sold: 620,
    total_stock: 200,
    category_slug: WATCH_CATEGORY_IDS.SPORT,
    strap: "Cao su",
    features: ["Chống nước", "Năng lượng mặt trời"],
    new_arrival: false
  },
  {
    product_id: 9009,
    product_name: "Apple Watch SE 2 44mm",
    brand_name: "Apple",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1551816230-ef5deaed4a31?w=600&q=80",
    min_price: 6490000,
    max_price: 6990000,
    total_sold: 880,
    total_stock: 150,
    category_slug: WATCH_CATEGORY_IDS.SMARTWATCH,
    strap: "Silicon",
    features: ["GPS", "Nhịp tim"],
    new_arrival: false
  },
  {
    product_id: 9010,
    product_name: "Samsung Galaxy Watch6 40mm",
    brand_name: "Samsung",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=600&q=80",
    min_price: 5790000,
    max_price: 6290000,
    total_sold: 340,
    total_stock: 60,
    category_slug: WATCH_CATEGORY_IDS.SMARTWATCH,
    strap: "Silicon",
    features: ["GPS", "Chống nước"],
    new_arrival: true
  },
  {
    product_id: 9011,
    product_name: "Garmin Venu 3",
    brand_name: "Garmin",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1622434641406-af158b448389?w=600&q=80",
    min_price: 10290000,
    max_price: 11290000,
    total_sold: 120,
    total_stock: 28,
    category_slug: WATCH_CATEGORY_IDS.SPORT,
    strap: "Silicon",
    features: ["GPS", "Nhịp tim", "Ngủ"],
    new_arrival: false
  },
  {
    product_id: 9012,
    product_name: "Fossil Minimalist 44mm",
    brand_name: "Fossil",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&q=80",
    min_price: 3290000,
    max_price: 3790000,
    total_sold: 210,
    total_stock: 45,
    category_slug: WATCH_CATEGORY_IDS.FASHION,
    strap: "Da",
    features: ["Quartz", "Mặt mỏng"],
    new_arrival: false
  },
  {
    product_id: 9013,
    product_name: "Casio Vintage A168",
    brand_name: "Casio",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=600&q=80",
    min_price: 890000,
    max_price: 1090000,
    total_sold: 1200,
    total_stock: 300,
    category_slug: WATCH_CATEGORY_IDS.CLASSIC,
    strap: "Kim loại",
    features: ["Pin lâu", "Retro"],
    new_arrival: false
  },
  {
    product_id: 9014,
    product_name: "Orient Bambino Automatic",
    brand_name: "Orient",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=600&q=80",
    min_price: 5290000,
    max_price: 5790000,
    total_sold: 88,
    total_stock: 22,
    category_slug: WATCH_CATEGORY_IDS.CLASSIC,
    strap: "Da",
    features: ["Máy cơ", "Kính cong"],
    new_arrival: true
  },
  {
    product_id: 9015,
    product_name: "Đồng hồ trẻ em GPS Xplorer",
    brand_name: "Xiaomi",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=600&q=80",
    min_price: 1890000,
    max_price: 2190000,
    total_sold: 450,
    total_stock: 100,
    category_slug: WATCH_CATEGORY_IDS.KIDS,
    strap: "Silicon",
    features: ["GPS", "Gọi SOS"],
    new_arrival: false
  },
  {
    product_id: 9016,
    product_name: "Huawei Watch Fit 3",
    brand_name: "Huawei",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=600&q=80",
    min_price: 2990000,
    max_price: 3490000,
    total_sold: 510,
    total_stock: 95,
    category_slug: WATCH_CATEGORY_IDS.SMARTWATCH,
    strap: "Silicon",
    features: ["Nhịp tim", "Màn AMOLED"],
    new_arrival: true
  },
  {
    product_id: 9017,
    product_name: "Amazfit GTR 4",
    brand_name: "Amazfit",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80",
    min_price: 3490000,
    max_price: 3990000,
    total_sold: 380,
    total_stock: 75,
    category_slug: WATCH_CATEGORY_IDS.SPORT,
    strap: "Silicon",
    features: ["GPS", "Pin 14 ngày"],
    new_arrival: false
  },
  {
    product_id: 9018,
    product_name: "Samsung Galaxy Watch5 Pro",
    brand_name: "Samsung",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1616353071588-708dc0bd0dfa?w=600&q=80",
    min_price: 7990000,
    max_price: 8990000,
    total_sold: 200,
    total_stock: 40,
    category_slug: WATCH_CATEGORY_IDS.SPORT,
    strap: "Da",
    features: ["GPS", "Titanium"],
    new_arrival: false
  },
  {
    product_id: 9019,
    product_name: "Apple Watch Ultra 2",
    brand_name: "Apple",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1697229299093-cfcae1a640f9?w=600&q=80",
    min_price: 19990000,
    max_price: 21990000,
    total_sold: 95,
    total_stock: 18,
    category_slug: WATCH_CATEGORY_IDS.SPORT,
    strap: "Cao su",
    features: ["GPS", "Lặn", "Chống va đập"],
    new_arrival: true
  },
  {
    product_id: 9020,
    product_name: "Garmin Fenix 7X Sapphire",
    brand_name: "Garmin",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1623998021446-45cd9b269c95?w=600&q=80",
    min_price: 18990000,
    max_price: 19990000,
    total_sold: 45,
    total_stock: 12,
    category_slug: WATCH_CATEGORY_IDS.SPORT,
    strap: "Silicon",
    features: ["GPS đa băng", "Bản đồ"],
    new_arrival: false
  },
  {
    product_id: 9021,
    product_name: "Fossil Carlie Mini",
    brand_name: "Fossil",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80",
    min_price: 4590000,
    max_price: 4990000,
    total_sold: 130,
    total_stock: 40,
    category_slug: WATCH_CATEGORY_IDS.FASHION,
    strap: "Kim loại",
    features: ["Thời trang", "Mặt nhỏ"],
    new_arrival: false
  },
  {
    product_id: 9022,
    product_name: "Casio Edifice ECB-900",
    brand_name: "Casio",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80",
    min_price: 6290000,
    max_price: 6790000,
    total_sold: 160,
    total_stock: 50,
    category_slug: WATCH_CATEGORY_IDS.CLASSIC,
    strap: "Kim loại",
    features: ["Bluetooth", "Solar"],
    new_arrival: false
  },
  {
    product_id: 9023,
    product_name: "Huawei Watch 4 Pro",
    brand_name: "Huawei",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1451290337906-ac938fc89bce?w=600&q=80",
    min_price: 9990000,
    max_price: 10990000,
    total_sold: 75,
    total_stock: 25,
    category_slug: WATCH_CATEGORY_IDS.SMARTWATCH,
    strap: "Da",
    features: ["eSIM", "GPS"],
    new_arrival: true
  },
  {
    product_id: 9024,
    product_name: "Amazfit Bip 5",
    brand_name: "Amazfit",
    primary_product_image_url:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80",
    min_price: 1490000,
    max_price: 1790000,
    total_sold: 890,
    total_stock: 180,
    category_slug: WATCH_CATEGORY_IDS.SMARTWATCH,
    strap: "Silicon",
    features: ["Pin lâu", "Nhẹ"],
    new_arrival: false
  }
]
