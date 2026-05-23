import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import "../styles/HomeArticleSection.css"

export default function HomeArticleSection() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getImageUrl = (thumbnailUrl) => {
    if (!thumbnailUrl) return 'https://via.placeholder.com/300x200?text=Không+có+ảnh';
    
    // Nếu là URL đầy đủ (bắt đầu bằng http)
    if (thumbnailUrl.startsWith('http')) {
      return thumbnailUrl;
    }
    
    // Nếu là đường dẫn tương đối
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${apiUrl}${thumbnailUrl}`;
  };

  useEffect(() => {
    fetchPublishedPosts();
  }, []);

  const fetchPublishedPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/blog/posts/published?limit=7`);
      
      if (!response.ok) {
        throw new Error('Lỗi khi lấy bài viết');
      }
      
      const data = await response.json();
      console.log('Blog posts data:', data);
      
      if (data.success && data.data) {
        setArticles(data.data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-article-wrapper">
      
      {/* Cột trái - Nội dung */}
      <div className="article-left">
        <div className="article-intro">
          <p>
            <strong>Máy tính laptop</strong>  là thiết bị công nghệ được rất nhiều người dùng yêu thích và chọn lựa nhờ vào tính tiện lợi, đáp ứng tốt nhu cầu học tập, làm việc và giải trí của nhiều người dùng. Hiện nay, các thương hiệu máy tính xách tay không ngừng cải tiến sản phẩm để mang lại một dòng laptop mini giá rẻ mỏng nhẹ, có hiệu năng mạnh mẽ, thời lượng pin tốt đặc biệt là có một giá thành vô cùng hợp lý. 
          </p>
        </div>

        <div className="article-content">
          <h3>Nội dung chính</h3>
          <ol>
            <li>Laptop (máy tính xách tay) - Phục vụ công việc, học tập, giải trí</li>
            <li>Lợi ích khi sử dụng máy tính laptop là gì?</li>
            <li>Các loại máy tính laptop phổ biến</li>
            <li>Các tiêu chí chọn mua laptop chất lượng vượt trội</li>
          </ol>
        </div>

        <div className="article-content">
          <h3>Lợi ích của laptop</h3>
          <ol>
            <li>Tính di động và tiện lợi - Có thể mang theo bất cứ đâu</li>
            <li>Hiệu suất cao - Đáp ứng các tác vụ nặng như thiết kế, lập trình</li>
            <li>Thời lượng pin dài - Dùng cả ngày mà không cần sạc</li>
            <li>Kết nối dễ dàng - Nhiều cổng kết nối với thiết bị khác</li>
            <li>Giá thành hợp lý - Có nhiều mức giá để chọn lựa</li>
          </ol>
        </div>

        <div className="article-content">
          <h3>Các loại laptop phổ biến</h3>
          <ol>
            <li>Laptop mini - Kích thước nhỏ, giá rẻ, phù hợp cho sinh viên</li>
            <li>Laptop đồ họa - Hiệu năng cao, màn hình sắc nét cho designer</li>
            <li>Laptop gaming - Cấu hình mạnh mẽ, tản nhiệt tốt cho gamer</li>
            <li>Laptop doanh nhân - Thiết kế sang trọng, pin lâu cho công sở</li>
          </ol>
        </div>

        <div className="article-content">
          <h3>Tiêu chí chọn mua laptop</h3>
          <ol>
            <li>Bộ xử lý (CPU) - Chọn Intel Core hoặc AMD Ryzen phù hợp nhu cầu</li>
            <li>Bộ nhớ RAM - Tối thiểu 8GB cho công việc bình thường, 16GB+ cho chuyên gia</li>
            <li>Ổ cứng SSD - Giúp khởi động máy nhanh chóng và hiệu năng tổng thể tốt hơn</li>
            <li>Card đồ họa GPU - Quan trọng cho gaming và xử lý đồ họa</li>
            <li>Thời lượng pin - Chọn từ 8-10 giờ để sử dụng cả ngày</li>
            <li>Màn hình - Kích thước 13-17 inch tùy nhu cầu, độ phân giải 1080p trở lên</li>
          </ol>
        </div>
      </div>

      {/* Cột phải - Tin tức */}
      <div className="article-right">
        <div className="news-header">
          <h3>Tin tức sản phẩm</h3>
          <span className="view-all">Xem tất cả</span>
        </div>

        {loading ? (
          <div className="news-loading">
            <p>Đang tải tin tức...</p>
          </div>
        ) : error ? (
          <div className="news-error">
            <p>Lỗi: {error}</p>
          </div>
        ) : articles.length > 0 ? (
          articles.map((article) => (
            <div 
              key={article.post_id} 
              className="news-item"
              onClick={() => navigate(`/news/${article.post_id}`)}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={getImageUrl(article.thumbnail_url)} 
                alt={article.title} 
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200?text=Lỗi+ảnh'
                }}
              />
              <p>{article.title}</p>
            </div>
          ))
        ) : (
          <div className="news-empty">
            <p>Không có bài viết nào</p>
          </div>
        )}
      </div>

    </div>
  )
}