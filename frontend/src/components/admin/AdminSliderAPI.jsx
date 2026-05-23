import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiLink2, FiEye, FiEyeOff } from 'react-icons/fi';
import { buildApiUrl } from '../../config/api';
import '../../styles/AdminSlider.css';
import { getAuthToken } from '../../lib/authToken';




const resolveImageUrl = (url) => {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  return buildApiUrl(raw.startsWith('/') ? raw : `/${raw}`);
};

export default function AdminSliderAPI() {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' hoặc 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    link_url: '',
    image: null,
    display_order: 0,
    status: 'VISIBLE'
  });

  // Load sliders
  useEffect(() => {
    loadSliders();
  }, []);

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
  const loadSliders = async () => {
    try {
      setLoading(true);
      const res = await fetch(buildApiUrl('/api/sliders/admin/all'), {
        headers: authHeaders()
      });
      const data = await res.json();
      setSliders(Array.isArray(data?.data) ? data.data : []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Không tải được danh sách slider');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleVisibility = async (slider) => {
    const isVisible = String(slider.status || '').toUpperCase() === 'VISIBLE';
    const nextStatus = isVisible ? 'HIDDEN' : 'VISIBLE';
    const confirmMsg = isVisible
      ? 'Bạn có muốn ẩn slider này không? (Slider vẫn hiển thị trong trang admin)'
      : 'Bạn có muốn bật hiển thị slider này không?';

    if (!window.confirm(confirmMsg)) return;

    try {
      const form = new FormData();
      form.append('title', slider.title || '');
      form.append('link_url', slider.link_url || '');
      form.append('display_order', slider.display_order ?? 0);
      form.append('status', nextStatus);

      const res = await fetch(buildApiUrl(`/api/sliders/${slider.slider_id}`), {
        method: 'PUT',
        headers: authHeaders(),
        body: form
      });

      const raw = await res.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error('Server trả về dữ liệu không hợp lệ (không phải JSON).');
      }

      if (!data.success) {
        throw new Error(data.message || 'Không thể cập nhật trạng thái slider');
      }

      alert(
        nextStatus === 'HIDDEN'
          ? 'Đã ẩn slider trên trang chủ'
          : 'Đã bật hiển thị slider trên trang chủ'
      );
      await loadSliders();
    } catch (err) {
      console.error(err);
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({
          ...prev,
          image: file
        }));
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreview(event.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Vui lòng chọn file ảnh!');
      }
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    if (url.trim()) {
      setImagePreview(url);
      setFormData(prev => ({
        ...prev,
        image: null // Clear file nếu dùng URL
      }));
    }
  };

  const handleEdit = (slider) => {
    setEditingId(slider.slider_id);
    setFormData({
      title: slider.title || '',
      link_url: slider.link_url || '',
      image: null,
      display_order: slider.display_order || 0,
      status: slider.status || 'VISIBLE'
    });
    setImagePreview(slider.image_url || '');
    setImageUrl('');
    setUploadMode('file');
    setShowForm(true);
  };

  const handleNewSlider = () => {
    setEditingId(null);
    setFormData({
      title: '',
      link_url: '',
      image: null,
      display_order: 0,
      status: 'VISIBLE'
    });
    setImagePreview('');
    setImageUrl('');
    setUploadMode('file');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề');
      return;
    }

    if (!editingId && !formData.image && !imageUrl.trim()) {
      alert('Vui lòng chọn ảnh hoặc nhập URL ảnh');
      return;
    }

    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('link_url', formData.link_url);
      form.append('display_order', formData.display_order);
      form.append('status', formData.status);
      
      // Ưu tiên file upload, nếu không có thì dùng URL
      if (formData.image) {
        form.append('image', formData.image);
      } else if (imageUrl.trim()) {
        form.append('image_url', imageUrl.trim());
      }

      const url = editingId 
        ? buildApiUrl(`/api/sliders/${editingId}`)
        : buildApiUrl('/api/sliders');
      
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: form
      });

      const raw = await res.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error('Server trả về dữ liệu không hợp lệ (không phải JSON). Vui lòng kiểm tra backend upload slider.');
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Lỗi khi lưu slider');
      }

      alert(editingId ? 'Cập nhật slider thành công!' : 'Thêm slider thành công!');
      setShowForm(false);
      loadSliders();
    } catch (err) {
      console.error(err);
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa slider này?')) return;

    try {
      const res = await fetch(buildApiUrl(`/api/sliders/${id}`), {
        method: 'DELETE',
        headers: authHeaders()
      });

      const raw = await res.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error('Server trả về dữ liệu không hợp lệ (không phải JSON).');
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Lỗi khi xóa slider');
      }

      alert('Xóa slider thành công!');
      loadSliders();
    } catch (err) {
      console.error(err);
      alert('Lỗi: ' + err.message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      link_url: '',
      image: null,
      display_order: 0,
      status: 'VISIBLE'
    });
    setImagePreview('');
    setImageUrl('');
    setUploadMode('file');
    setIsDragging(false);
  };

  if (loading) return <div className="admin-loading">Đang tải...</div>;

  return (
    <div className="admin-slider-page">
      <div className="page-header">
        <h1>Quản lý Slider</h1>
        <button 
          className="btn btn-primary"
          onClick={handleNewSlider}
          disabled={showForm}
        >
          <FiPlus /> Thêm Slider
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="slider-form-card card">
          <div className="card-header">
            <h2>{editingId ? 'Sửa Slider' : 'Thêm Slider Mới'}</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="slider-form">
              <div className="form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Nhập tiêu đề slider"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Link điều hướng</label>
                <div className="input-group">
                  <FiLink2 className="input-icon" />
                  <input
                    type="text"
                    name="link_url"
                    value={formData.link_url}
                    onChange={handleInputChange}
                    placeholder="Nhập URL hoặc đường dẫn (vd: /products, /blog/post-1)"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thứ tự hiển thị</label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="VISIBLE">Hiển thị</option>
                    <option value="HIDDEN">Ẩn</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Hình ảnh {!editingId && '*'}</label>
                
                {/* Tab chọn chế độ */}
                <div className="upload-mode-tabs">
                  <button
                    type="button"
                    className={`tab-btn ${uploadMode === 'file' ? 'active' : ''}`}
                    onClick={() => setUploadMode('file')}
                  >
                    <FiImage /> Upload File
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${uploadMode === 'url' ? 'active' : ''}`}
                    onClick={() => setUploadMode('url')}
                  >
                    <FiLink2 /> Nhập URL
                  </button>
                </div>

                {/* Upload File Mode */}
                {uploadMode === 'file' && (
                  <div 
                    className={`image-upload-dropzone ${isDragging ? 'dragging' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <label htmlFor="image-input" className="upload-label">
                      <FiImage size={48} />
                      <span className="upload-text">
                        {isDragging ? 'Thả ảnh vào đây' : 'Kéo thả ảnh hoặc click để chọn'}
                      </span>
                      <span className="upload-hint">PNG, JPG, GIF (max 5MB)</span>
                    </label>
                    <input
                      id="image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="image-input"
                    />
                  </div>
                )}

                {/* URL Mode */}
                {uploadMode === 'url' && (
                  <div className="url-input-wrapper">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={handleUrlChange}
                      placeholder="Nhập URL ảnh (vd: https://example.com/image.jpg)"
                      className="form-input url-input"
                    />
                  </div>
                )}

                {/* Image Preview */}
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button
                      type="button"
                      className="btn-remove-preview"
                      onClick={() => {
                        setImagePreview('');
                        setImageUrl('');
                        setFormData(prev => ({ ...prev, image: null }));
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-success">
                  {editingId ? 'Cập nhật' : 'Thêm'} Slider
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCancel}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sliders-grid">
        {sliders.length === 0 ? (
          <div className="empty-state">
            <FiImage size={48} />
            <p>Chưa có slider nào. Hãy thêm slider mới!</p>
          </div>
        ) : (
          sliders.map(slider => (
            <div key={slider.slider_id} className="slider-card card">
              <div className="slider-image-container">
                <img 
                  src={resolveImageUrl(slider.image_url)} 
                  alt={slider.title}
                  className="slider-image"
                />
                <div className="slider-overlay">
                  <button 
                    className="btn btn-sm btn-primary"
                    title="Xem trước"
                    onClick={() => window.open(resolveImageUrl(slider.image_url), '_blank')}
                  >
                    <FiEye /> Xem
                  </button>
                </div>
              </div>

              <div className="card-body">
                <h3>{slider.title}</h3>
                
                {slider.link_url && (
                  <div className="slider-link">
                    <FiLink2 size={14} />
                    <span>{slider.link_url}</span>
                  </div>
                )}

                <div className="slider-meta">
                  <span className="meta-item">
                    <strong>Thứ tự:</strong> {slider.display_order}
                  </span>
                  <span className={`status-badge status-${slider.status.toLowerCase()}`}>
                    {slider.status === 'VISIBLE' ? 'Hiển thị' : 'Ẩn'}
                  </span>
                </div>
              </div>

              <div className="card-footer">
                <button 
                  className={`btn btn-sm ${slider.status === 'VISIBLE' ? 'btn-secondary' : 'btn-success'}`}
                  onClick={() => handleToggleVisibility(slider)}
                  disabled={showForm}
                  title={slider.status === 'VISIBLE' ? 'Ẩn slider' : 'Hiển thị slider'}
                >
                  {slider.status === 'VISIBLE' ? <FiEyeOff /> : <FiEye />}
                  {slider.status === 'VISIBLE' ? 'Ẩn' : 'Hiện'}
                </button>
                <button 
                  className="btn btn-warning btn-sm"
                  onClick={() => handleEdit(slider)}
                  disabled={showForm}
                >
                  <FiEdit2 /> Sửa
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(slider.slider_id)}
                  disabled={showForm}
                >
                  <FiTrash2 /> Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
