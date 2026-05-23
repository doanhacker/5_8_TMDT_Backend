import { useNavigate } from 'react-router-dom'
import { getImageUrl } from '../config/api'

export default function ProductCard({ product }) {
  const navigate = useNavigate()

  if (!product) {
    return null
  }

  // Map API response fields to display fields
  const title = product.product_name || 'Sản phẩm'
  const image = getImageUrl(product.primary_product_image_url)
  
  // Format price
  const minPrice = parseFloat(product.min_price || 0)
  const maxPrice = parseFloat(product.max_price || 0)
  const price = minPrice > 0 ? `${minPrice.toLocaleString('vi-VN')}đ` : 'Liên hệ'
  
  // Calculate discount percentage if both min and max have different prices
  let discountPercent = 0
  if (minPrice > 0 && maxPrice > minPrice) {
    discountPercent = Math.round(((maxPrice - minPrice) / maxPrice) * 100)
  }
  const discount = discountPercent > 0 ? `Giảm ${discountPercent}%` : ''
  
  // Build specs from representative values
  const cpu = product.representative_cpu_name || ''
  const gpu = product.representative_gpu || ''
  const ram = product.representative_ram_gb ? `${product.representative_ram_gb}GB` : ''
  const storage = product.representative_storage_gb ? `${product.representative_storage_gb}GB` : ''
  const specs = [cpu, gpu, ram, storage].filter(Boolean).join(' | ') || 'Đang cập nhật'

  const handleClick = () => {
    if (product.product_id) {
      navigate(`/product/${product.product_id}`)
    }
  }

  return (
    <div style={styles.card} onClick={handleClick} role="button" tabIndex={0}>
      <div style={styles.imageWrapper}>
        <img src={image} alt={title} style={styles.image} />
        {discount && <div style={styles.discountBadge}>{discount}</div>}
        <div style={styles.installBadge}>Trả góp 0%</div>
      </div>
      <div style={styles.content}>
        <div style={styles.specs}>{specs}</div>
        <h3 style={styles.title}>{title}</h3>
        <div style={styles.priceWrapper}>
          <span style={styles.price}>{price}</span>
        </div>
      </div>
    </div>
  )
}

const styles = {
  card: {
    border: '1px solid #ddd',
    borderRadius: '12px',
    width: '220px',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '140px',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    background: '#e30019',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  installBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#eef6ff',
    color: '#1a73e8',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  content: {
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  specs: {
    fontSize: '12px',
    color: '#555',
  },
  title: {
    fontSize: '14px',
    margin: 0,
  },
  priceWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  price: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#e30019',
  },
  oldPrice: {
    fontSize: '12px',
    textDecoration: 'line-through',
    color: '#999',
  },
  promo: {
    fontSize: '12px',
    color: '#555',
    background: '#f0f5ff',
    padding: '4px',
    borderRadius: '4px',
  },
}