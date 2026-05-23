const DEFAULT_SUGGESTIONS = [
  'Laptop gaming tầm 25 triệu',
  'Laptop cho sinh viên dưới 15 triệu',
  'Tư vấn laptop lập trình 16GB RAM',
  'Laptop đồ họa và video editing',
]

const FEATURE_KEYS = [
  'gaming',
  'office',
  'student',
  'programming',
  'design',
  'thinLight',
  'ai',
  'highRam',
  'highStorage',
  'discreteGpu',
  'premiumCpu',
  'value',
]

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

const stripVietnamese = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

const parseNumericSpec = (value = '') => {
  const match = String(value).match(/(\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : 0
}

const extractBudget = (normalizedText) => {
  const textBudget = normalizedText.match(/(\d+(?:[.,]\d+)?)\s*(tr|trieu|m|k|nghin)/i)
  if (textBudget) {
    const rawValue = Number(String(textBudget[1]).replace(',', '.'))
    if (!Number.isFinite(rawValue)) return null
    const unit = textBudget[2]
    if (unit === 'k' || unit === 'nghin') return Math.round(rawValue * 1000)
    return Math.round(rawValue * 1000000)
  }

  const rawNumber = normalizedText.match(/\b(\d{7,9})\b/)
  if (rawNumber) {
    const value = Number(rawNumber[1])
    return Number.isFinite(value) ? value : null
  }

  return null
}

const extractMinSpec = (normalizedText, unitKeywords) => {
  const pattern = new RegExp(`(\\d+)\\s*(?:gb\\s*)?(?:${unitKeywords.join('|')})`, 'i')
  const match = normalizedText.match(pattern)
  return match ? Number(match[1]) : 0
}

const normalizeVector = (vector) => {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
  return vector.map((value) => value / norm)
}

const cosineSimilarity = (vectorA, vectorB) =>
  vectorA.reduce((sum, value, index) => sum + value * vectorB[index], 0)

const keywordScore = (text, patterns) =>
  patterns.some((pattern) => pattern.test(text)) ? 1 : 0

const buildProductVector = (product) => {
  const normalizedText = stripVietnamese([
    product.name,
    product.brand,
    product.series,
    product.cpu,
    product.graphics,
    product.config,
    product.specs,
    Array.isArray(product.features) ? product.features.join(' ') : '',
  ].join(' '))

  const ram = parseNumericSpec(product.ram)
  const storage = parseNumericSpec(product.storage)
  const price = Number(product.price || 0)
  const hasDiscreteGpu = /(rtx|gtx|radeon|geforce|quadro)/.test(normalizedText)
  const hasPremiumCpu = /(i7|i9|ultra 7|ultra 9|ryzen 7|ryzen 9|apple m2|apple m3|apple m4)/.test(normalizedText)

  const rawVector = [
    keywordScore(normalizedText, [/gaming/, /rtx/, /gtx/, /geforce/, /radeon/]),
    keywordScore(normalizedText, [/office/, /word/, /excel/, /van phong/]),
    keywordScore(normalizedText, [/student/, /sinh vien/, /hoc tap/]),
    keywordScore(normalizedText, [/code/, /developer/, /lap trinh/, /cntt/, /\bit\b/]),
    keywordScore(normalizedText, [/design/, /do hoa/, /premiere/, /photoshop/, /render/, /3d/]),
    keywordScore(normalizedText, [/thin/, /light/, /mong nhe/, /portable/]),
    product.hasAI ? 1 : keywordScore(normalizedText, [/\bai\b/, /copilot/, /npu/]),
    clamp(ram / 32),
    clamp(storage / 1024),
    hasDiscreteGpu ? 1 : 0,
    hasPremiumCpu ? 1 : 0,
    price > 0 ? clamp(1 - (price / 50000000)) : 0,
  ]

  return {
    rawVector,
    vector: normalizeVector(rawVector),
    normalizedText,
    ram,
    storage,
    price,
    inStock: Boolean(product.inStock),
  }
}

const buildQueryProfile = (message) => {
  const normalizedText = stripVietnamese(message)
  const budget = extractBudget(normalizedText)
  const minRam = extractMinSpec(normalizedText, ['ram'])
  const minStorage = extractMinSpec(normalizedText, ['ssd', 'storage', 'bo nho', 'o cung'])

  const rawVector = [
    keywordScore(normalizedText, [/gaming/, /choi game/, /fps/, /valorant/, /cs2/, /lol/, /dota/, /genshin/]),
    keywordScore(normalizedText, [/van phong/, /word/, /excel/, /powerpoint/, /ke toan/, /lam viec/]),
    keywordScore(normalizedText, [/sinh vien/, /hoc sinh/, /hoc tap/, /di hoc/]),
    keywordScore(normalizedText, [/lap trinh/, /code/, /coding/, /developer/, /\bit\b/, /cntt/]),
    keywordScore(normalizedText, [/do hoa/, /thiet ke/, /video/, /editing/, /premiere/, /photoshop/, /3d/, /autocad/]),
    keywordScore(normalizedText, [/mong nhe/, /de mang/, /di chuyen/, /\bnhe\b/]),
    keywordScore(normalizedText, [/\bai\b/, /tri tue nhan tao/, /copilot/, /npu/]),
    minRam ? clamp(minRam / 32) : 0,
    minStorage ? clamp(minStorage / 1024) : 0,
    keywordScore(normalizedText, [/rtx/, /gtx/, /gpu roi/, /card roi/, /geforce/, /radeon/]),
    keywordScore(normalizedText, [/i7/, /i9/, /ryzen 7/, /ryzen 9/, /ultra 7/, /ultra 9/, /apple m/]),
    budget ? clamp(1 - (budget / 50000000)) : 0,
  ]

  return {
    normalizedText,
    budget,
    minRam,
    minStorage,
    rawVector,
    vector: normalizeVector(rawVector),
  }
}

const computeBudgetScore = (price, budget) => {
  if (!budget || !price) return 0.5
  if (price <= budget) {
    return clamp(1 - ((budget - price) / Math.max(budget, 1)) * 0.35, 0.65, 1)
  }
  const overspendRatio = (price - budget) / budget
  return clamp(1 - overspendRatio * 1.6, 0, 0.7)
}

const computeSpecScore = (productEmbedding, profile) => {
  let score = 0.5
  if (profile.minRam > 0) {
    score += productEmbedding.ram >= profile.minRam ? 0.25 : -0.35
  }
  if (profile.minStorage > 0) {
    score += productEmbedding.storage >= profile.minStorage ? 0.25 : -0.25
  }
  return clamp(score, 0, 1)
}

const computeLexicalOverlap = (productText, queryText) => {
  const tokens = queryText.split(/\s+/).filter((token) => token.length >= 3)
  if (tokens.length === 0) return 0.5
  const matched = tokens.filter((token) => productText.includes(token)).length
  return clamp(matched / tokens.length)
}

const buildNaturalNeedSummary = (profile) => {
  const labels = []
  if (profile.rawVector[0] > 0) labels.push('gaming')
  if (profile.rawVector[1] > 0) labels.push('văn phòng')
  if (profile.rawVector[2] > 0) labels.push('sinh viên')
  if (profile.rawVector[3] > 0) labels.push('lập trình')
  if (profile.rawVector[4] > 0) labels.push('đồ họa')
  if (profile.rawVector[5] > 0) labels.push('mỏng nhẹ')
  if (profile.rawVector[6] > 0) labels.push('AI')
  return labels
}

const buildResponseLead = (profile) => {
  const needLabels = buildNaturalNeedSummary(profile)
  const parts = []

  if (needLabels.length > 0) parts.push(`nhu cầu ${needLabels.join(', ')}`)
  if (profile.budget) parts.push(`ngân sách khoảng ${formatCurrency(profile.budget)}`)
  if (profile.minRam) parts.push(`RAM từ ${profile.minRam}GB`)
  if (profile.minStorage) parts.push(`SSD từ ${profile.minStorage}GB`)

  if (parts.length === 0) {
    return 'Dựa trên nội dung câu hỏi của bạn, tôi đã chọn ra những mẫu đáng cân nhắc nhất hiện tại.'
  }

  if (parts.length === 1) {
    return `Với ${parts[0]}, tôi gợi ý bạn ưu tiên các mẫu dưới đây.`
  }

  const firstParts = parts.slice(0, -1)
  const lastPart = parts[parts.length - 1]
  return `Dựa trên ${firstParts.join(', ')} và ${lastPart}, đây là những mẫu phù hợp nhất tôi tìm được.`
}

const explainTopSignals = (rawProductVector, rawQueryVector) => {
  return FEATURE_KEYS
    .map((key, index) => ({
      key,
      contribution: rawProductVector[index] * rawQueryVector[index],
    }))
    .filter((item) => item.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3)
    .map((item) => item.key)
}

const translateSignal = (signal, productEmbedding, price) => {
  switch (signal) {
    case 'gaming':
      return 'phù hợp nhu cầu gaming'
    case 'office':
      return 'ổn cho làm việc văn phòng'
    case 'student':
      return 'phù hợp cho sinh viên'
    case 'programming':
      return 'đáp ứng tốt nhu cầu lập trình'
    case 'design':
      return 'phù hợp đồ họa và chỉnh sửa video'
    case 'thinLight':
      return 'thuận tiện khi cần di chuyển'
    case 'ai':
      return 'có điểm mạnh về tính năng AI'
    case 'highRam':
      return `RAM ${productEmbedding.ram || 0}GB cho đa nhiệm tốt`
    case 'highStorage':
      return `SSD ${productEmbedding.storage || 0}GB cho lưu trữ rộng rãi`
    case 'discreteGpu':
      return 'có GPU rời'
    case 'premiumCpu':
      return 'CPU thuộc nhóm hiệu năng cao'
    case 'value':
      return price > 0 ? `giá ở mức dễ tiếp cận: ${formatCurrency(price)}` : 'giá phù hợp'
    default:
      return null
  }
}

class LaptopShopAIModel {
  constructor(products = []) {
    this.products = Array.isArray(products) ? products : []
    this.catalog = this.products.map((product) => ({
      product,
      embedding: buildProductVector(product),
    }))
  }

  rank(message) {
    const profile = buildQueryProfile(message)

    const ranked = this.catalog
      .map(({ product, embedding }) => {
        const similarity = cosineSimilarity(profile.vector, embedding.vector)
        const budgetScore = computeBudgetScore(embedding.price, profile.budget)
        const specScore = computeSpecScore(embedding, profile)
        const lexicalScore = computeLexicalOverlap(embedding.normalizedText, profile.normalizedText)
        const stockScore = embedding.inStock ? 1 : 0.15

        const finalScore =
          similarity * 0.45 +
          budgetScore * 0.2 +
          specScore * 0.15 +
          lexicalScore * 0.1 +
          stockScore * 0.1

        const topSignals = explainTopSignals(embedding.rawVector, profile.rawVector)
        const reasons = topSignals
          .map((signal) => translateSignal(signal, embedding, embedding.price))
          .filter(Boolean)

        return {
          product,
          embedding,
          similarity,
          budgetScore,
          specScore,
          lexicalScore,
          stockScore,
          finalScore,
          reasons: reasons.slice(0, 3),
        }
      })
      .sort((a, b) => b.finalScore - a.finalScore)

    return {
      profile,
      ranked,
      recommendations: ranked.slice(0, 3),
    }
  }
}

const buildRecommendationReply = (products, message) => {
  const model = new LaptopShopAIModel(products)
  const result = model.rank(message)
  const topRecommendations = result.recommendations

  if (topRecommendations.length === 0 || topRecommendations[0].finalScore < 0.15) {
    return {
      text: 'Hiện tại tôi chưa tìm được mẫu laptop đủ phù hợp trong dữ liệu sản phẩm. Bạn có thể nói rõ hơn về ngân sách, nhu cầu hoặc mức RAM mong muốn.',
      suggestions: DEFAULT_SUGGESTIONS,
      diagnostics: {
        algorithm: 'content-based cosine similarity',
        confidence: 'low',
      },
    }
  }

  const summaryText = buildResponseLead(result.profile)

  return {
    text: `${summaryText} Tôi sắp xếp theo mức độ phù hợp để bạn dễ so sánh.`,
    recommendations: topRecommendations.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: formatCurrency(item.product.price),
      config: item.product.config || item.product.specs || 'Đang cập nhật',
      reasons: item.reasons.length > 0 ? item.reasons : ['phù hợp với nhu cầu bạn đang tìm'],
      score: Math.round(item.finalScore * 100),
    })),
    suggestions: DEFAULT_SUGGESTIONS,
    diagnostics: {
      algorithm: 'content-based cosine similarity',
      confidence: topRecommendations[0].finalScore >= 0.6 ? 'high' : topRecommendations[0].finalScore >= 0.35 ? 'medium' : 'low',
    },
  }
}

export const createLaptopShopAiReply = (message, products = []) => {
  const normalizedText = stripVietnamese(message)

  if (!normalizedText.trim()) {
    return {
      text: 'Bạn hãy nhập nhu cầu của mình, ví dụ laptop gaming tầm 25 triệu hoặc laptop cho lập trình 16GB RAM.',
      suggestions: DEFAULT_SUGGESTIONS,
    }
  }

  if (/(xin chao|chao|hello|hi)\b/.test(normalizedText)) {
    return {
      text: 'Chào bạn. Tôi là LaptopShop AI beta. Hiện tôi dùng mô hình gợi ý nội bộ dựa trên vector đặc trưng sản phẩm để tư vấn laptop theo nhu cầu và ngân sách.',
      suggestions: DEFAULT_SUGGESTIONS,
    }
  }

  if (/bao cao|tien do|progress|mo hinh|model|thuat toan|giai thuat/.test(normalizedText)) {
    return {
      text: 'LaptopShop AI hiện dùng mô hình content-based recommendation với vector đặc trưng, cosine similarity, điểm phù hợp ngân sách và cấu hình tối thiểu. Đây là mô hình thuật toán thật, chưa phải LLM.',
      suggestions: DEFAULT_SUGGESTIONS,
    }
  }

  if (/don hang|order|giao hang|van chuyen|thanh toan/.test(normalizedText)) {
    return {
      text: 'Tôi chưa xử lý sâu về đơn hàng, nhưng bạn có thể vào trang Theo dõi đơn hàng để kiểm tra trạng thái và thanh toán.',
      suggestions: ['Kiểm tra đơn hàng', 'Thanh toán bị lỗi', 'Laptop gaming tầm 20 triệu'],
    }
  }

  return buildRecommendationReply(products, message)
}

export const laptopShopAiMeta = {
  name: 'LaptopShop AI Beta',
  version: '0.2.1',
  algorithm: 'Content-based recommendation with cosine similarity',
  capabilities: [
    'recommendation',
    'budget_parsing',
    'vector_similarity',
    'spec_matching',
  ],
}

export { LaptopShopAIModel }
