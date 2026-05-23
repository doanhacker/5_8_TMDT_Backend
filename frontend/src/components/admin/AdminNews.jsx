import React, { useEffect, useMemo, useState } from "react"
import "../../styles/Admin.css"

/**
 * Frontend-first AdminNews
 * - Lưu mock data vào localStorage
 * - Field names bám theo schema MySQL của bạn:
 *   blog_categories(category_id, category_name, description, created_at)
 *   blog_posts(post_id, category_id, author_id, title, thumbnail_url, content_html,
 *              view_count, status, published_at)
 */

const LS_CATEGORIES_KEY = "blog_categories"
const LS_POSTS_KEY = "blog_posts"

const nowISO = () => new Date().toISOString()
const normalize = (s) => String(s || "").toLowerCase().trim()

const statusLabel = (status) => {
  if (status === "DRAFT") return "Nháp"
  if (status === "PUBLISHED") return "Đã đăng"
  if (status === "HIDDEN") return "Đã ẩn"
  return status
}

function loadFromLS(key, fallback) {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function saveToLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

const seedCategories = [
  { category_id: 1, category_name: "Khuyến mãi", description: "Tin khuyến mãi, ưu đãi", created_at: nowISO() },
  { category_id: 2, category_name: "Sản phẩm mới", description: "Giới thiệu sản phẩm mới", created_at: nowISO() },
  { category_id: 3, category_name: "Review", description: "Đánh giá và trải nghiệm", created_at: nowISO() },
]

const seedPosts = [
  {
    post_id: 1,
    category_id: 1,
    author_id: null,
    title: "Sale Tháng 3 - Giảm tới 15%",
    thumbnail_url: "",
    content_html: "<p>Nội dung mẫu: chương trình khuyến mãi tháng 3...</p>",
    view_count: 0,
    status: "PUBLISHED",
    published_at: nowISO(),
    created_at: nowISO(),
    updated_at: nowISO(),
  },
  {
    post_id: 2,
    category_id: 2,
    author_id: null,
    title: "Ra mắt Vivobook 16X 2026",
    thumbnail_url: "",
    content_html: "<p>Nội dung mẫu: thông số, điểm nổi bật...</p>",
    view_count: 0,
    status: "DRAFT",
    published_at: nowISO(),
    created_at: nowISO(),
    updated_at: nowISO(),
  },
]

export default function AdminNews() {
  // ===== DATA =====
  const [categories, setCategories] = useState([])
  const [posts, setPosts] = useState([])

  // ===== FILTERS =====
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")

  // ===== CATEGORY FORM =====
  const [newCategory, setNewCategory] = useState({
    category_name: "",
    description: "",
  })

  // ===== POST FORM =====
  const emptyPostForm = {
    category_id: "",
    title: "",
    thumbnail_url: "",
    content_html: "",
    status: "DRAFT",
  }
  const [postForm, setPostForm] = useState(emptyPostForm)
  const [editingPostId, setEditingPostId] = useState("")

  // ===== INIT FROM localStorage =====
  useEffect(() => {
    const storedCats = loadFromLS(LS_CATEGORIES_KEY, null)
    const storedPosts = loadFromLS(LS_POSTS_KEY, null)

    if (!storedCats) {
      saveToLS(LS_CATEGORIES_KEY, seedCategories)
      setCategories(seedCategories)
    } else {
      setCategories(storedCats)
    }

    if (!storedPosts) {
      saveToLS(LS_POSTS_KEY, seedPosts)
      setPosts(seedPosts)
    } else {
      setPosts(storedPosts)
    }
  }, [])

  // Persist
  useEffect(() => {
    saveToLS(LS_CATEGORIES_KEY, categories)
  }, [categories])

  useEffect(() => {
    saveToLS(LS_POSTS_KEY, posts)
  }, [posts])

  // ===== DERIVED =====
  const categoryMap = useMemo(() => {
    const m = new Map()
    categories.forEach((c) => m.set(String(c.category_id), c))
    return m
  }, [categories])

  const filteredPosts = useMemo(() => {
    const query = normalize(q)
    return posts
      .filter((p) => {
        if (statusFilter !== "ALL" && p.status !== statusFilter) return false
        if (categoryFilter !== "ALL" && String(p.category_id) !== String(categoryFilter)) return false
        if (!query) return true
        return normalize(p.title).includes(query)
      })
      .sort((a, b) => {
        const au = new Date(a.updated_at || a.published_at || 0).getTime()
        const bu = new Date(b.updated_at || b.published_at || 0).getTime()
        return bu - au
      })
  }, [posts, q, statusFilter, categoryFilter])

  // ===== ACTIONS: categories =====
  const handleCreateCategory = (e) => {
    e.preventDefault()
    const name = newCategory.category_name.trim()
    if (!name) return alert("Vui lòng nhập tên danh mục")

    // mimic UNIQUE(category_name)
    const exists = categories.some((c) => normalize(c.category_name) === normalize(name))
    if (exists) return alert("Danh mục đã tồn tại")

    // mimic AUTO_INCREMENT
    const maxId = categories.reduce((max, c) => Math.max(max, Number(c.category_id) || 0), 0)
    const nextId = maxId + 1

    const payload = {
      category_id: nextId,
      category_name: name,
      description: newCategory.description.trim(),
      created_at: nowISO(),
    }

    setCategories((prev) => [payload, ...prev])
    setNewCategory({ category_name: "", description: "" })
  }

  // ===== ACTIONS: posts =====
  const validatePostForm = (form) => {
    if (!String(form.category_id || "").trim()) return "Vui lòng chọn danh mục"
    if (!String(form.title || "").trim()) return "Vui lòng nhập tiêu đề"
    if (!String(form.content_html || "").trim()) return "Vui lòng nhập nội dung (HTML)"
    return ""
  }

  const resetPostForm = () => {
    setPostForm(emptyPostForm)
    setEditingPostId("")
  }

  const handleSubmitPost = (e, forceStatus = null) => {
    e.preventDefault()

    const next = {
      ...postForm,
      category_id: Number(postForm.category_id),
      title: postForm.title.trim(),
      thumbnail_url: postForm.thumbnail_url.trim(),
      content_html: postForm.content_html,
      status: forceStatus || postForm.status || "DRAFT",
    }

    const err = validatePostForm(next)
    if (err) return alert(err)

    if (editingPostId) {
      setPosts((prev) =>
        prev.map((p) => {
          if (String(p.post_id) !== String(editingPostId)) return p
          return {
            ...p,
            ...next,
            published_at: p.status !== "PUBLISHED" && next.status === "PUBLISHED" ? nowISO() : p.published_at,
            updated_at: nowISO(),
          }
        })
      )
      alert("✅ Đã cập nhật bài viết")
    } else {
      const maxId = posts.reduce((max, p) => Math.max(max, Number(p.post_id) || 0), 0)
      const nextId = maxId + 1

      const payload = {
        post_id: nextId,
        category_id: next.category_id,
        author_id: null, // sau này lấy từ token/backend
        title: next.title,
        thumbnail_url: next.thumbnail_url,
        content_html: next.content_html,
        view_count: 0,
        status: next.status,
        published_at: next.status === "PUBLISHED" ? nowISO() : nowISO(),
        created_at: nowISO(),
        updated_at: nowISO(),
      }

      setPosts((prev) => [payload, ...prev])
      alert(next.status === "PUBLISHED" ? "✅ Đã đăng bài" : "✅ Đã lưu nháp")
    }

    resetPostForm()
  }

  const handleEditPost = (post) => {
    setEditingPostId(post.post_id)
    setPostForm({
      category_id: String(post.category_id ?? ""),
      title: post.title ?? "",
      thumbnail_url: post.thumbnail_url ?? "",
      content_html: post.content_html ?? "",
      status: post.status ?? "DRAFT",
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDeletePost = (postId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return
    setPosts((prev) => prev.filter((p) => String(p.post_id) !== String(postId)))
  }

  const setPostStatus = (postId, status) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (String(p.post_id) !== String(postId)) return p
        return {
          ...p,
          status,
          published_at: p.status !== "PUBLISHED" && status === "PUBLISHED" ? nowISO() : p.published_at,
          updated_at: nowISO(),
        }
      })
    )
  }

  const previewPost = (post) => {
    const w = window.open("", "_blank")
    if (!w) return alert("Trình duyệt đang chặn popup. Hãy cho phép popup để xem preview.")
    const cat = categoryMap.get(String(post.category_id))?.category_name || "Không rõ"
    w.document.write(`
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>${post.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 920px; margin: 0 auto; }
            .meta { color: #666; margin-bottom: 14px; }
            .badge { display:inline-block; padding:2px 8px; border:1px solid #ddd; border-radius:999px; font-size:12px; margin-right: 6px; }
            img { max-width: 100%; height: auto; border-radius: 10px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>${post.title}</h1>
          <div class="meta">
            <span class="badge">${cat}</span>
            <span class="badge">${post.status}</span>
            <span>${new Date(post.published_at || post.updated_at || Date.now()).toLocaleString("vi-VN")}</span>
          </div>
          ${post.thumbnail_url ? `<img src="${post.thumbnail_url}" alt="thumbnail"/>` : ""}
          <div>${post.content_html}</div>
        </body>
      </html>
    `)
    w.document.close()
  }

  return (
    <div className="adm-grid">
      {/* ========== POST FORM ========== */}
      <section className="adm-card adm-card-pad">
        <h3 style={{ marginTop: 0 }}>{editingPostId ? `Sửa bài viết #${editingPostId}` : "Quản lý tin tức"}</h3>
        <p style={{ marginTop: 6, color: "#666" }}>
          Tạo / sửa / đăng / ẩn bài viết. (Đang mock bằng localStorage, sẽ nối API sau)
        </p>

        <form onSubmit={(e) => handleSubmitPost(e)} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label className="adm-label">Danh mục</label>
              <select
                className="adm-input"
                value={postForm.category_id}
                onChange={(e) => setPostForm((p) => ({ ...p, category_id: e.target.value }))}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="adm-label">Trạng thái</label>
              <select
                className="adm-input"
                value={postForm.status}
                onChange={(e) => setPostForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="DRAFT">DRAFT (Nháp)</option>
                <option value="PUBLISHED">PUBLISHED (Đã đăng)</option>
                <option value="HIDDEN">HIDDEN (Ẩn)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="adm-label">Tiêu đề</label>
            <input
              className="adm-input"
              value={postForm.title}
              onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Nhập tiêu đề bài viết..."
            />
          </div>

          <div>
            <label className="adm-label">Thumbnail URL</label>
            <input
              className="adm-input"
              value={postForm.thumbnail_url}
              onChange={(e) => setPostForm((p) => ({ ...p, thumbnail_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="adm-label">Nội dung (HTML)</label>
            <textarea
              className="adm-input"
              rows={10}
              style={{ resize: "vertical" }}
              value={postForm.content_html}
              onChange={(e) => setPostForm((p) => ({ ...p, content_html: e.target.value }))}
              placeholder="<p>Nội dung bài viết...</p>"
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <button className="adm-btn" type="button" onClick={(e) => handleSubmitPost(e, "DRAFT")}>
                Lưu nháp
              </button>
              <button className="adm-btn adm-btn-primary" type="button" onClick={(e) => handleSubmitPost(e, "PUBLISHED")}>
                Đăng bài
              </button>
              {editingPostId ? (
                <button className="adm-btn" type="submit">
                  Cập nhật
                </button>
              ) : null}
              <button className="adm-btn" type="button" onClick={resetPostForm}>
                Làm mới
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* ========== CATEGORY MANAGER ========== */}
      <section className="adm-card adm-card-pad">
        <h3 style={{ marginTop: 0 }}>Danh mục tin</h3>
        <form onSubmit={handleCreateCategory} style={{ display: "grid", gap: 10 }}>
          <input
            className="adm-input"
            value={newCategory.category_name}
            onChange={(e) => setNewCategory((p) => ({ ...p, category_name: e.target.value }))}
            placeholder="Tên danh mục..."
          />
          <input
            className="adm-input"
            value={newCategory.description}
            onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))}
            placeholder="Mô tả..."
          />
          <button className="adm-btn" type="submit">
            Thêm danh mục
          </button>
        </form>

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table className="adm-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 10 }}>ID</th>
                <th style={{ textAlign: "left", padding: 10 }}>Tên</th>
                <th style={{ textAlign: "left", padding: 10 }}>Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 10, color: "#666" }}>
                    Chưa có danh mục.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.category_id}>
                    <td style={{ padding: 10 }}>{c.category_id}</td>
                    <td style={{ padding: 10 }}>{c.category_name}</td>
                    <td style={{ padding: 10 }}>{c.description || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========== POSTS LIST ========== */}
      <section className="adm-card adm-card-pad" style={{ gridColumn: "1 / -1" }}>
        <h3 style={{ marginTop: 0 }}>Danh sách bài viết</h3>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
          <input
            className="adm-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tiêu đề..."
          />
          <select className="adm-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="HIDDEN">HIDDEN</option>
          </select>
          <select className="adm-input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="ALL">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table className="adm-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 10 }}>ID</th>
                <th style={{ textAlign: "left", padding: 10 }}>Tiêu đề</th>
                <th style={{ textAlign: "left", padding: 10 }}>Danh mục</th>
                <th style={{ textAlign: "left", padding: 10 }}>Trạng thái</th>
                <th style={{ textAlign: "left", padding: 10 }}>Cập nhật</th>
                <th style={{ textAlign: "left", padding: 10 }}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 10, color: "#666" }}>
                    Chưa có bài viết phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((p) => {
                  const cat = categoryMap.get(String(p.category_id))?.category_name || "—"
                  const updated = p.updated_at || p.published_at
                  return (
                    <tr key={p.post_id}>
                      <td style={{ padding: 10 }}>{p.post_id}</td>
                      <td style={{ padding: 10, minWidth: 280 }}>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        {p.thumbnail_url ? (
                          <div style={{ marginTop: 6, fontSize: 12, color: "#666", wordBreak: "break-all" }}>
                            {p.thumbnail_url}
                          </div>
                        ) : null}
                      </td>
                      <td style={{ padding: 10 }}>{cat}</td>
                      <td style={{ padding: 10 }}>{statusLabel(p.status)}</td>
                      <td style={{ padding: 10 }}>{updated ? new Date(updated).toLocaleString("vi-VN") : "—"}</td>
                      <td style={{ padding: 10, whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className="adm-btn" onClick={() => previewPost(p)}>
                            Preview
                          </button>
                          <button className="adm-btn" onClick={() => handleEditPost(p)}>
                            Sửa
                          </button>

                          {p.status !== "PUBLISHED" ? (
                            <button className="adm-btn adm-btn-primary" onClick={() => setPostStatus(p.post_id, "PUBLISHED")}>
                              Đăng
                            </button>
                          ) : (
                            <button className="adm-btn" onClick={() => setPostStatus(p.post_id, "HIDDEN")}>
                              Ẩn
                            </button>
                          )}

                          <button className="adm-btn adm-btn-danger" onClick={() => handleDeletePost(p.post_id)}>
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}