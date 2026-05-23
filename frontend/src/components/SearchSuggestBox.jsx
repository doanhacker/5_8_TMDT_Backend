import { useEffect, useRef, useState } from "react";
import { FiSearch, FiX, FiTrendingUp } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getSearchSuggestions } from "../services/searchApi";
import "../styles/SearchSuggestBox.css";

const fmt = new Intl.NumberFormat("vi-VN");

export default function SearchSuggestBox() {
  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const q = keyword.trim();
    if (!q) {
      setCategories([]);
      setProducts([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await getSearchSuggestions(q, 5);
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setProducts(Array.isArray(data.products) ? data.products.slice(0, 5) : []);
      } catch {
        setCategories([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [keyword]);

  const onSubmit = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    if (!q) return;
    navigate(`/?search=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  return (
    <div className="search-suggest-wrap" ref={boxRef}>
      <form className="search-input-wrap" onSubmit={onSubmit}>
        <FiSearch className="icon-left" />
        <input
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Bạn cần tìm gì?"
        />
        {!!keyword && (
          <button
            type="button"
            className="icon-clear-btn"
            onClick={() => {
              setKeyword("");
              setCategories([]);
              setProducts([]);
            }}
          >
            <FiX />
          </button>
        )}
      </form>

      {open && keyword.trim() && (
        <div className="search-dropdown">
          <div className="search-section-title">
            <FiSearch /> Có phải bạn muốn tìm
          </div>

          {loading ? (
            <div className="search-loading">Đang tìm...</div>
          ) : (
            <>
              <div className="suggest-category-grid">
                {categories.length === 0 ? (
                  <div className="search-empty">Không có danh mục phù hợp</div>
                ) : (
                  categories.map((c) => (
                    <button
                      key={c.category_id}
                      className="suggest-category-item"
                      onClick={() => {
                        navigate(`/categories/${c.category_id}`);
                        setOpen(false);
                      }}
                    >
                      <span className="name">{c.category_name}</span>
                    </button>
                  ))
                )}
              </div>

              <div className="search-section-title second">
                <FiTrendingUp /> Sản phẩm gợi ý
              </div>

              <div className="suggest-product-list">
                {products.length === 0 ? (
                  <div className="search-empty">Không có sản phẩm phù hợp</div>
                ) : (
                  products.map((p) => (
                    <button
                      key={p.product_id}
                      className="suggest-product-item"
                      onClick={() => {
                        navigate(`/product/${p.product_id}`);
                        setOpen(false);
                      }}
                    >
                      <img
                        src={p.image_url || "https://via.placeholder.com/80x60?text=No+Image"}
                        alt={p.product_name}
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/80x60?text=No+Image";
                        }}
                      />
                      <div className="info">
                        <p className="title">{p.product_name}</p>
                        <p className="price">
                          {p.current_price ? `${fmt.format(Number(p.current_price))}đ` : "Liên hệ"}
                          {p.original_price && Number(p.original_price) > Number(p.current_price || 0) ? (
                            <span className="old">{fmt.format(Number(p.original_price))}đ</span>
                          ) : null}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}