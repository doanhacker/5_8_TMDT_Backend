import React, { useEffect, useState } from "react"
import axios from "axios"
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiSave,
  FiX,
  FiImage,
  FiTag,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiUpload
} from "react-icons/fi"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import { Node } from "@tiptap/core"
import Youtube from "@tiptap/extension-youtube"

import "../../styles/AdminNews.css"
import { BLOG_API_BASE } from "../../config/api"
import { getAuthToken } from "../../lib/authToken"

const API_BASE = BLOG_API_BASE

const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      width: { default: "100%" }
    }
  },
  parseHTML() {
    return [{ tag: "video" }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["video", HTMLAttributes]
  }
})

const statusLabel = (status) => {
  if (status === "DRAFT") return "Nháp"
  if (status === "PUBLISHED") return "Đã đăng"
  if (status === "HIDDEN") return "Ẩn"
  return status
}

const statusIcon = (status) => {
  if (status === "DRAFT") return <FiClock />
  if (status === "PUBLISHED") return <FiCheckCircle />
  if (status === "HIDDEN") return <FiEyeOff />
  return null
}

const plainText = (html) =>
  String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const excerpt = (html, max = 140) => {
  const text = plainText(html)
  if (!text) return ""
  return text.length > max ? `${text.slice(0, max).trim()}...` : text
}

const authHeaders = () => {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function AdminNewsAPI() {
  // ===== STATE =====
  const [categories, setCategories] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  const [editorUploading, setEditorUploading] = useState(false)

  // ===== FILTERS =====
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")

  // ===== CATEGORY FORM =====
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [categoryForm, setCategoryForm] = useState({
    category_name: "",
    description: ""
  })

  // ===== POST FORM =====
  const [showPostForm, setShowPostForm] = useState(false)
  const [editingPostId, setEditingPostId] = useState(null)
  const [postForm, setPostForm] = useState({
    category_id: "",
    title: "",
    thumbnail_url: "",
    content_html: "",
    status: "DRAFT"
  })

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true
      }),
      Image.configure({
        allowBase64: true
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"]
      }),
      Placeholder.configure({
        placeholder: "Soạn nội dung bài viết..."
      }),
      Video,
      Youtube.configure({
      controls: true,
      nocookie: true,
      width: 640,
      height: 360,
      allowFullscreen: true
    })
    ],
    content: postForm.content_html || "",
    onUpdate({ editor: currentEditor }) {
      setPostForm((prev) => ({ ...prev, content_html: currentEditor.getHTML() }))
    }
  })

  useEffect(() => {
    if (!editor) return
    const html = postForm.content_html || ""
    if (editor.getHTML() !== html) {
      editor.commands.setContent(html, false)
    }
  }, [editor, postForm.content_html])

  // ===== LOAD DATA =====
  useEffect(() => {
    loadCategories()
    loadPosts()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/categories`)
      setCategories(response.data?.data || [])
    } catch (err) {
      console.error("❌ Lỗi load categories:", err)
      setError("Không thể tải danh mục")
    }
  }

  const loadPosts = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE}/posts/all`, {
        headers: authHeaders()
      })
      setPosts(response.data?.data || [])
      setError("")
    } catch (err) {
      console.error("❌ Lỗi load posts:", err)
      setError(err.response?.data?.message || "Không thể tải bài viết")
    } finally {
      setLoading(false)
    }
  }

  const uploadMediaFile = async (file) => {
    const form = new FormData()
    form.append("file", file)

    const response = await axios.post(`${API_BASE}/media/upload`, form, {
      headers: {
        ...authHeaders(),
        "Content-Type": "multipart/form-data"
      }
    })

    if (!response.data?.success || !response.data?.data?.url) {
      throw new Error(response.data?.message || "Upload thất bại")
    }

    return response.data.data.url
  }

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setThumbnailUploading(true)
      const url = await uploadMediaFile(file)
      setPostForm((prev) => ({ ...prev, thumbnail_url: url }))
    } catch (err) {
      console.error("❌ Lỗi upload thumbnail:", err)
      alert(err.message || "Không thể upload thumbnail")
    } finally {
      setThumbnailUploading(false)
      e.target.value = ""
    }
  }

  const pickFile = (accept) =>
    new Promise((resolve) => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = accept
      input.onchange = () => resolve(input.files?.[0] || null)
      input.click()
    })

  const handleInsertImage = async () => {
    try {
      const file = await pickFile("image/*")
      if (!file) return
      setEditorUploading(true)
      const url = await uploadMediaFile(file)
      editor?.chain().focus().setImage({ src: url }).run()
    } catch (err) {
      console.error("❌ Lỗi chèn ảnh:", err)
      alert(err.message || "Không thể chèn ảnh")
    } finally {
      setEditorUploading(false)
    }
  }

  const handleInsertVideo = async () => {
    try {
      const file = await pickFile("video/*")
      if (!file) return
      setEditorUploading(true)
      const url = await uploadMediaFile(file)
      editor
        ?.chain()
        .focus()
        .insertContent(`<video src="${url}" controls width="100%"></video>`)
        .run()
    } catch (err) {
      console.error("❌ Lỗi chèn video:", err)
      alert(err.message || "Không thể chèn video")
    } finally {
      setEditorUploading(false)
    }
  }

  const handleInsertYoutube = () => {
  const url = window.prompt("Nhập link YouTube:")
  if (!url || !editor) return

  editor
    .chain()
    .focus()
    .setYoutubeVideo({
      src: url,
      width: 640,
      height: 360
    })
    .run()
}

  // ===== CATEGORY ACTIONS =====
  const handleCreateCategory = async (e) => {
    e.preventDefault()
    const name = categoryForm.category_name.trim()
    if (!name) {
      alert("Vui lòng nhập tên danh mục")
      return
    }

    try {
      const payload = {
        category_name: name,
        description: categoryForm.description.trim()
      }

      if (editingCategoryId) {
        await axios.put(
          `${API_BASE}/categories/${editingCategoryId}`,
          payload,
          { headers: authHeaders() }
        )
        alert("✅ Đã cập nhật danh mục")
      } else {
        await axios.post(
          `${API_BASE}/categories`,
          payload,
          { headers: authHeaders() }
        )
        alert("✅ Đã tạo danh mục")
      }

      setCategoryForm({ category_name: "", description: "" })
      setEditingCategoryId(null)
      setShowCategoryForm(false)
      loadCategories()
    } catch (err) {
      console.error("❌ Lỗi lưu category:", err)
      alert(err.response?.data?.message || "Không thể lưu danh mục")
    }
  }

  const handleEditCategory = (category) => {
    setEditingCategoryId(category.category_id)
    setCategoryForm({
      category_name: category.category_name || "",
      description: category.description || ""
    })
    setShowCategoryForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const resetCategoryForm = () => {
    setEditingCategoryId(null)
    setCategoryForm({
      category_name: "",
      description: ""
    })
    setShowCategoryForm(false)
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) return

    try {
      await axios.delete(`${API_BASE}/categories/${categoryId}`, {
        headers: authHeaders()
      })
      alert("✅ Đã xóa danh mục")
      loadCategories()
      loadPosts()
    } catch (err) {
      console.error("❌ Lỗi xóa category:", err)
      alert(err.response?.data?.message || "Không thể xóa danh mục")
    }
  }

  // ===== POST ACTIONS =====
  const validatePostForm = () => {
    if (!postForm.category_id) return "Vui lòng chọn danh mục"
    if (!postForm.title.trim()) return "Vui lòng nhập tiêu đề"
    if (!plainText(postForm.content_html)) return "Vui lòng nhập nội dung"
    return ""
  }

  const resetPostForm = () => {
    setPostForm({
      category_id: "",
      title: "",
      thumbnail_url: "",
      content_html: "",
      status: "DRAFT"
    })
    setEditingPostId(null)
    setShowPostForm(false)
    editor?.commands.setContent("", false)
  }

  const handleSubmitPost = async (e, statusOverride = null) => {
    e.preventDefault()

    const err = validatePostForm()
    if (err) {
      alert(err)
      return
    }

    const payload = {
      category_id: parseInt(postForm.category_id, 10),
      title: postForm.title.trim(),
      thumbnail_url: postForm.thumbnail_url.trim(),
      content_html: postForm.content_html,
      status: statusOverride || postForm.status
    }

    try {
      if (editingPostId) {
        await axios.put(`${API_BASE}/posts/${editingPostId}`, payload, {
          headers: authHeaders()
        })
        alert("✅ Đã cập nhật bài viết")
      } else {
        await axios.post(`${API_BASE}/posts`, payload, {
          headers: authHeaders()
        })
        alert(payload.status === "PUBLISHED" ? "✅ Đã đăng bài" : "✅ Đã lưu nháp")
      }

      resetPostForm()
      loadPosts()
    } catch (err) {
      console.error("❌ Lỗi submit post:", err)
      alert(err.response?.data?.message || "Không thể lưu bài viết")
    }
  }

  const handleEditPost = (post) => {
    setEditingPostId(post.post_id)
    const html = post.content_html || ""
    setPostForm({
      category_id: String(post.category_id || ""),
      title: post.title || "",
      thumbnail_url: post.thumbnail_url || "",
      content_html: html,
      status: post.status || "DRAFT"
    })
    setShowPostForm(true)
    editor?.commands.setContent(html, false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return

    try {
      await axios.delete(`${API_BASE}/posts/${postId}`, {
        headers: authHeaders()
      })
      alert("✅ Đã xóa bài viết")
      loadPosts()
    } catch (err) {
      console.error("❌ Lỗi xóa post:", err)
      alert(err.response?.data?.message || "Không thể xóa bài viết")
    }
  }

  const handleChangeStatus = async (postId, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE}/posts/${postId}/status`,
        { status: newStatus },
        { headers: authHeaders() }
      )
      alert(`✅ Đã chuyển sang: ${statusLabel(newStatus)}`)
      loadPosts()
    } catch (err) {
      console.error("❌ Lỗi đổi status:", err)
      alert(err.response?.data?.message || "Không thể đổi trạng thái")
    }
  }

  // ===== FILTERED POSTS =====
  const filteredPosts = posts.filter((post) => {
    if (statusFilter !== "ALL" && post.status !== statusFilter) return false
    if (categoryFilter !== "ALL" && String(post.category_id) !== categoryFilter) return false

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const title = (post.title || "").toLowerCase()
      const content = (post.content_html || "").toLowerCase()
      if (!title.includes(query) && !content.includes(query)) return false
    }

    return true
  })

  // ===== CATEGORY MAP =====
  const categoryMap = {}
  categories.forEach((cat) => {
    categoryMap[cat.category_id] = cat.category_name
  })

  return (
    <div className="admin-news-container">
      <div className="admin-news-header">
        <div>
          <h2>📰 Quản lý Tin tức</h2>
          <p className="admin-news-subtitle">
            Soạn nội dung kiểu Word với TipTap, hỗ trợ upload ảnh/video vào bài viết.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowCategoryForm(!showCategoryForm)}>
            <FiTag /> Quản lý Danh mục
          </button>
          <button
            className="btn-success"
            onClick={() => {
              resetPostForm()
              setShowPostForm(true)
            }}
          >
            <FiPlus /> Tạo bài viết mới
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <FiAlertCircle /> {error}
        </div>
      )}

      <section className="news-overview">
        <div className="news-overview-card">
          <span className="news-overview-label">Tổng bài viết</span>
          <strong>{posts.length}</strong>
        </div>
        <div className="news-overview-card is-published">
          <span className="news-overview-label">Đã đăng</span>
          <strong>{posts.filter((p) => p.status === "PUBLISHED").length}</strong>
        </div>
        <div className="news-overview-card is-draft">
          <span className="news-overview-label">Bản nháp</span>
          <strong>{posts.filter((p) => p.status === "DRAFT").length}</strong>
        </div>
        <div className="news-overview-card is-categories">
          <span className="news-overview-label">Danh mục</span>
          <strong>{categories.length}</strong>
        </div>
      </section>

      <div className="admin-news-layout">
        <aside className="admin-news-left">
          {showCategoryForm && (
            <div className="card category-section">
              <div className="card-header">
                <h3><FiTag /> Danh mục</h3>
                <button className="btn-icon" onClick={() => setShowCategoryForm(false)}>
                  <FiX />
                </button>
              </div>
              <div className="card-body">
                <form onSubmit={handleCreateCategory} className="category-form">
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Tên danh mục"
                      value={categoryForm.category_name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, category_name: e.target.value })}
                      className="form-input"
                    />
                    <input
                      type="text"
                      placeholder="Mô tả (tùy chọn)"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="form-input"
                    />
                    <button type="submit" className="btn-primary">
                      {editingCategoryId ? <FiSave /> : <FiPlus />}
                      {editingCategoryId ? "Cập nhật" : "Thêm"}
                    </button>
                    {editingCategoryId && (
                      <button type="button" className="btn-secondary" onClick={resetCategoryForm}>
                        <FiX /> Hủy
                      </button>
                    )}
                  </div>
                </form>

                <div className="category-list">
                  {categories.length === 0 ? (
                    <p className="text-muted">Chưa có danh mục nào</p>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.category_id} className="category-item">
                        <div className="category-info">
                          <strong>{cat.category_name}</strong>
                          {cat.description && <span className="text-muted">{cat.description}</span>}
                          {cat.post_count != null && (
                            <span className="text-muted">Bài viết: {cat.post_count}</span>
                          )}
                        </div>
                        <div className="category-actions">
                          <button
                            className="btn-icon btn-primary"
                            onClick={() => handleEditCategory(cat)}
                            title="Sửa danh mục"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleDeleteCategory(cat.category_id)}
                            title="Xóa danh mục"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {showPostForm && (
            <div className="card post-form-section">
              <div className="card-header">
                <h3>{editingPostId ? "✏️ Chỉnh sửa bài viết" : "➕ Tạo bài viết mới"}</h3>
                <button className="btn-icon" onClick={resetPostForm}>
                  <FiX />
                </button>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmitPost}>
                  <div className="form-group">
                    <label>Danh mục *</label>
                    <select
                      value={postForm.category_id}
                      onChange={(e) => setPostForm({ ...postForm, category_id: e.target.value })}
                      className="form-select"
                      required
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tiêu đề *</label>
                    <input
                      type="text"
                      value={postForm.title}
                      onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                      className="form-input"
                      placeholder="Nhập tiêu đề bài viết"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Ảnh thumbnail</label>
                    <div className="input-with-icon" style={{ display: "flex", gap: 8 }}>
                      <label className="btn-secondary" style={{ cursor: "pointer" }}>
                        <FiUpload /> {thumbnailUploading ? "Đang upload..." : "Upload ảnh"}
                        <input type="file" accept="image/*" onChange={handleThumbnailUpload} style={{ display: "none" }} />
                      </label>
                      <input
                        type="text"
                        value={postForm.thumbnail_url}
                        onChange={(e) => setPostForm({ ...postForm, thumbnail_url: e.target.value })}
                        className="form-input"
                        placeholder="URL ảnh thumbnail"
                      />
                    </div>
                    {postForm.thumbnail_url && (
                      <img
                        src={postForm.thumbnail_url}
                        alt="Preview"
                        className="thumbnail-preview"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label>Nội dung bài viết *</label>

                    <div className="tiptap-toolbar">
                      <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className="btn-icon">B</button>
                      <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className="btn-icon"><i>I</i></button>
                      <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()} className="btn-icon"><u>U</u></button>
                      <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className="btn-icon">• List</button>
                      <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="btn-icon">1. List</button>
                      <button type="button" onClick={() => editor?.chain().focus().setTextAlign("left").run()} className="btn-icon">⬅</button>
                      <button type="button" onClick={() => editor?.chain().focus().setTextAlign("center").run()} className="btn-icon">↔</button>
                      <button type="button" onClick={() => editor?.chain().focus().setTextAlign("right").run()} className="btn-icon">➡</button>
                      <button type="button" onClick={handleInsertImage} className="btn-icon"><FiImage /></button>
                      <button type="button" onClick={handleInsertVideo} className="btn-icon"><FiUpload /> Video</button>
                      <button type="button" onClick={handleInsertYoutube} className="btn-icon">YouTube</button>
                    </div>

                    <div className="tiptap-editor">
                      <EditorContent editor={editor} />
                    </div>

                    <small className="editor-hint">
                      {editorUploading ? "Đang upload media..." : "Nội dung sẽ lưu dưới dạng HTML."}
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select
                      value={postForm.status}
                      onChange={(e) => setPostForm({ ...postForm, status: e.target.value })}
                      className="form-select"
                    >
                      <option value="DRAFT">Nháp</option>
                      <option value="PUBLISHED">Đã đăng</option>
                      <option value="HIDDEN">Ẩn</option>
                    </select>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={resetPostForm}>
                      <FiX /> Hủy
                    </button>
                    <button type="button" className="btn-warning" onClick={(e) => handleSubmitPost(e, "DRAFT")}>
                      <FiSave /> Lưu nháp
                    </button>
                    <button type="submit" className="btn-success">
                      <FiCheckCircle /> {editingPostId ? "Cập nhật" : "Đăng bài"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </aside>

        <section className="admin-news-right">
          <div className="card filters-section">
            <div className="card-header">
              <h3><FiSearch /> Bộ lọc nhanh</h3>
            </div>
            <div className="card-body">
              <div className="filters-grid">
                <div className="filter-field">
                  <label className="filter-label">Từ khóa</label>
                  <div className="search-box">
                    <FiSearch />
                    <input
                      type="text"
                      placeholder="Tìm theo tiêu đề hoặc nội dung..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="filter-field">
                  <label className="filter-label">Danh mục</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="form-select"
                  >
                    <option value="ALL">Tất cả danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat.category_id} value={String(cat.category_id)}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-field">
                  <label className="filter-label">Trạng thái</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-select"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="DRAFT">Nháp</option>
                    <option value="PUBLISHED">Đã đăng</option>
                    <option value="HIDDEN">Ẩn</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card posts-section">
            <div className="card-header">
              <h3>📝 Danh sách bài viết ({filteredPosts.length})</h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="loading-spinner">Đang tải...</div>
              ) : filteredPosts.length === 0 ? (
                <p className="text-muted">Không có bài viết nào</p>
              ) : (
                <div className="posts-list">
                  {filteredPosts.map((post) => (
                    <div key={post.post_id} className="post-item">
                      <div className="post-thumbnail">
                        {post.thumbnail_url ? (
                          <img src={post.thumbnail_url} alt={post.title} />
                        ) : (
                          <div className="placeholder-thumbnail">
                            <FiImage />
                          </div>
                        )}
                      </div>

                      <div className="post-content">
                        <div className="post-meta">
                          <span className="post-category">
                            <FiTag /> {categoryMap[post.category_id] || "Không rõ"}
                          </span>
                          <span className={`post-status status-${String(post.status || "").toLowerCase()}`}>
                            {statusIcon(post.status)} {statusLabel(post.status)}
                          </span>
                        </div>

                        <h4 className="post-title">{post.title}</h4>

                        {excerpt(post.content_html) && (
                          <p className="post-excerpt">{excerpt(post.content_html)}</p>
                        )}

                        <div className="post-info">
                          <span><FiEye /> {post.view_count || 0} lượt xem</span>
                          {post.published_at && (
                            <span>📅 {new Date(post.published_at).toLocaleDateString("vi-VN")}</span>
                          )}
                          {post.updated_at && (
                            <span>🛠️ Cập nhật: {new Date(post.updated_at).toLocaleDateString("vi-VN")}</span>
                          )}
                        </div>
                      </div>

                      <div className="post-actions">
                        <button
                          className="btn-icon btn-primary"
                          onClick={() => handleEditPost(post)}
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 />
                        </button>

                        {post.status === "DRAFT" && (
                          <button
                            className="btn-icon btn-success"
                            onClick={() => handleChangeStatus(post.post_id, "PUBLISHED")}
                            title="Đăng bài"
                          >
                            <FiCheckCircle />
                          </button>
                        )}

                        {post.status === "PUBLISHED" && (
                          <button
                            className="btn-icon btn-warning"
                            onClick={() => handleChangeStatus(post.post_id, "HIDDEN")}
                            title="Ẩn bài"
                          >
                            <FiEyeOff />
                          </button>
                        )}

                        {post.status === "HIDDEN" && (
                          <button
                            className="btn-icon btn-info"
                            onClick={() => handleChangeStatus(post.post_id, "PUBLISHED")}
                            title="Hiện bài"
                          >
                            <FiEye />
                          </button>
                        )}

                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDeletePost(post.post_id)}
                          title="Xóa"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminNewsAPI
