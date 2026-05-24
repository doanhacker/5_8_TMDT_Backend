import { useState, useEffect, useMemo } from 'react';
import { FiCalendar, FiUser, FiTag, FiEye } from 'react-icons/fi';
import '../styles/News.css';
import Breadcrumb from '../components/Breadcrumb';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { BLOG_API_BASE, getImageUrl } from '../config/api';

const API_URL = BLOG_API_BASE;

const normalizeMediaUrlsInHtml = (html) => {
  const raw = String(html || '');
  if (!raw) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'text/html');

    doc.querySelectorAll('[src]').forEach((element) => {
      const src = element.getAttribute('src');
      if (!src) return;
      if (/^(https?:|data:|blob:|\/\/)/i.test(src)) return;
      element.setAttribute('src', getImageUrl(src));
    });

    doc.querySelectorAll('a[href]').forEach((element) => {
      const href = element.getAttribute('href');
      if (!href) return;
      if (/^(https?:|mailto:|tel:|#|\/\/)/i.test(href)) return;
      element.setAttribute('href', getImageUrl(href));
    });

    return doc.body.innerHTML;
  } catch (error) {
    return raw;
  }
};

export default function News() {
  const [selectedNews, setSelectedNews] = useState(null);
  const [newsData, setNewsData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    loadCategories();
    if (id) {
      loadNewsDetail(id);
    } else {
      setSelectedNews(null);
      loadNews();
    }
  }, [id]);

  const breadcrumbItems = useMemo(() => {
    if (!id) {
      return [
        { label: "Trang chủ", path: "/" },
        { label: "Tin tức" },
      ];
    }

    return [
      { label: "Trang chủ", path: "/" },
      { label: "Tin tức", path: "/news" },
      { label: selectedNews?.title || "Chi tiết bài viết" },
    ];
  }, [id, selectedNews]);

  const loadNewsDetail = async (postId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/posts/${postId}`);
      if (response.data.success) {
        setSelectedNews(response.data.data);
      }
    } catch (error) {
      console.error("Error loading news detail:", error);
      loadNews();
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/posts/published`);
      if (response.data.success) {
        setNewsData(response.data.data);
      }
    } catch (error) {
      console.error("Error loading news:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = async (categoryId) => {
    setSelectedCategory(categoryId);

    if (categoryId === "ALL") {
      loadNews();
    } else {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/posts/category/${categoryId}`);
        if (response.data.success) {
          setNewsData(response.data.data);
        }
      } catch (error) {
        console.error("Error loading news by category:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReadMore = (news) => {
    navigate(`/news/${news.post_id}`);
  };

  const handleBackToList = () => {
    navigate('/news');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="news-page">
      <Breadcrumb items={breadcrumbItems} />

      <div className="news-container">
        {!id ? (
          <>
          

            {/* Category filters */}
            {categories.length > 0 && (
              <div className="news-filters">
                <button
                  className={`filter-btn ${selectedCategory === "ALL" ? "active" : ""}`}
                  onClick={() => handleCategoryFilter("ALL")}
                >
                  Tất cả
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.category_id}
                    className={`filter-btn ${selectedCategory === cat.category_id ? "active" : ""}`}
                    onClick={() => handleCategoryFilter(cat.category_id)}
                  >
                    {cat.category_name}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="news-loading">Đang tải tin tức...</div>
            ) : newsData.length === 0 ? (
              <div className="news-empty">Chưa có tin tức nào</div>
            ) : (
              <div className="news-grid">
                {newsData.map((news) => (
                  <article key={news.post_id} className="news-card">
                    <div className="news-image">
                      <img
                        src={news.thumbnail_url ? getImageUrl(news.thumbnail_url) : "https://via.placeholder.com/800x450?text=No+Image"}
                        alt={news.title}
                      />
                      <span className="news-category">{news.category_name || "Tin tức"}</span>
                    </div>
                    <div className="news-content">
                      <h2 className="news-title">{news.title}</h2>
                      <div className="news-meta">
                        <span>
                          <FiCalendar size={14} /> {new Date(news.published_at).toLocaleDateString('vi-VN')}
                        </span>
                        <span>
                          <FiUser size={14} /> {news.author_name || "Admin"}
                        </span>
                        <span>
                          <FiEye size={14} /> {news.view_count || 0} lượt xem
                        </span>
                      </div>
                      <div
                        className="news-excerpt"
                        dangerouslySetInnerHTML={{
                          __html: news.content_html.substring(0, 150) + "..."
                        }}
                      />
                      <button
                        className="read-more-btn"
                        onClick={() => handleReadMore(news)}
                      >
                        Đọc thêm →
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : loading ? (
          <div className="news-loading">Đang tải tin tức...</div>
        ) : selectedNews ? (
          <div className="news-detail">
            <button className="back-btn" onClick={handleBackToList}>
              ← Quay lại danh sách
            </button>
            <div className="detail-header">
              <span className="detail-category">
                <FiTag size={16} /> {selectedNews.category_name || "Tin tức"}
              </span>
              <h1>{selectedNews.title}</h1>
              <div className="detail-meta">
                <span>
                  <FiCalendar size={16} /> {new Date(selectedNews.published_at).toLocaleDateString('vi-VN')}
                </span>
                <span>
                  <FiUser size={16} /> {selectedNews.author_name || "Admin"}
                </span>
                <span>
                  <FiEye size={16} /> {selectedNews.view_count || 0} lượt xem
                </span>
              </div>
            </div>
            {selectedNews.thumbnail_url && (
              <img
                src={getImageUrl(selectedNews.thumbnail_url)}
                alt={selectedNews.title}
                className="detail-image"
              />
            )}
            <div
              className="detail-content"
              dangerouslySetInnerHTML={{ __html: normalizeMediaUrlsInHtml(selectedNews.content_html) }}
            />
          </div>
        ) : (
          <div className="news-empty">Không tìm thấy bài viết</div>
        )}
      </div>
    </div>
  );
}