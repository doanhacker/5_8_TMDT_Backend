import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../styles/BannerSlider.css"
import { buildApiUrl } from "../config/api"

const resolveImageUrl = (url) => {
  const raw = String(url || "").trim()
  if (!raw) return ""
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw
  return buildApiUrl(raw.startsWith("/") ? raw : `/${raw}`)
}

export default function BannerSlider() {
  const [banners, setBanners] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isPaused, setIsPaused] = useState(false)
  const navigate = useNavigate()

  // Tải dữ liệu banner từ API
  useEffect(() => {
    fetch(buildApiUrl("/api/sliders"))
      .then(res => res.json())
      .then(data => {
        setBanners(Array.isArray(data?.data) ? data.data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError("Không tải được banner từ API")
        setLoading(false)
      })
  }, [])

  // Tự động chuyển slide mỗi 3 giây
  useEffect(() => {
    if (banners.length === 0 || isPaused) return

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length)
    }, 2000) // 2 giây

    return () => clearInterval(interval)
  }, [banners.length, isPaused])

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>
  if (banners.length === 0) return <div>Chưa có banner để hiển thị</div>

  const prevSlide = () => {
    setCurrentSlide(prev => prev === 0 ? banners.length - 1 : prev - 1)
  }

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % banners.length)
  }

  const handleSliderClick = () => {
    const currentBanner = banners[currentSlide]
    if (currentBanner?.link_url) {
      // Kiểm tra nếu là URL đầy đủ (có http/https)
      if (currentBanner.link_url.startsWith('http://') || currentBanner.link_url.startsWith('https://')) {
        window.open(currentBanner.link_url, '_blank')
      } else {
        // Nếu là đường dẫn nội bộ, sử dụng navigate
        navigate(currentBanner.link_url)
      }
    }
  }

  return (
    <div 
      className="banner-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="slider-wrapper">
        <button className="nav left" onClick={prevSlide} aria-label="Previous slide">‹</button>
        <div 
          className="slider-track"
          onClick={handleSliderClick}
          style={{ cursor: banners[currentSlide]?.link_url ? 'pointer' : 'default' }}
        >
          <img 
            src={resolveImageUrl(banners[currentSlide].image_url)} 
            alt={`Banner slide ${currentSlide + 1}`}
            className="slide-image" 
          />
        </div>
        <button className="nav right" onClick={nextSlide} aria-label="Next slide">›</button>
      </div>

      {/* Pagination dots */}
      <div className="slider-dots">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}