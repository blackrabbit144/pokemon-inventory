import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import './PhotoPage.css';

const LOCATIONS = [
  { key: 'gwangju', label: '광주', colorClass: 'loc-gwangju' },
  { key: 'busan',   label: '부산', colorClass: 'loc-busan' },
  { key: 'bonbu',   label: '본부', colorClass: 'loc-bonbu' },
];

function formatDateTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function PhotoPage() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // photo object
  const [location, setLocation] = useState('gwangju');
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/photos/')
      .then((res) => setPhotos(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openUpload = () => {
    setUploadModal(true);
    setFile(null);
    setPreview(null);
    setLocation('gwangju');
    setError('');
  };

  const closeUpload = () => {
    setUploadModal(false);
    setPreview(null);
    setFile(null);
    setError('');
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) { setError('사진을 선택해주세요.'); return; }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('location', location);
      const res = await api.post('/photos/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotos((prev) => [res.data, ...prev]);
      closeUpload();
    } catch (e) {
      setError(e.response?.data?.error || '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.post(`/photos/${deleteTarget.id}/delete/`);
      setPhotos((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const locInfo = (key) => LOCATIONS.find((l) => l.key === key);

  return (
    <div className="photo-wrap">
      <header className="photo-header">
        <div className="photo-header-inner">
          <h1 className="photo-header-title">제품 정보</h1>
          <button className="photo-upload-btn" onClick={openUpload}>+ 사진 업로드</button>
        </div>
        <nav className="photo-header-nav">
          <Link to="/" className="photo-nav-link">확장팩</Link>
          <Link to="/logs" className="photo-nav-link">재고 로그</Link>
          <span className="photo-nav-active">사진 기록</span>
        </nav>
      </header>

      <main className="photo-main">
        {loading ? (
          <div className="photo-loading">로딩 중...</div>
        ) : photos.length === 0 ? (
          <div className="photo-empty">아직 등록된 사진이 없습니다.</div>
        ) : (
          <div className="photo-grid">
            {photos.map((photo) => {
              const loc = locInfo(photo.location);
              return (
                <div key={photo.id} className="photo-card">
                  <div className="photo-img-wrap">
                    <img src={photo.image_url} alt={photo.location_display} loading="lazy" />
                    <button
                      className="photo-delete-btn"
                      onClick={() => setDeleteTarget(photo)}
                      title="삭제"
                    >✕</button>
                  </div>
                  <div className="photo-card-info">
                    <span className={`photo-loc-badge ${loc?.colorClass}`}>
                      {photo.location_display}
                    </span>
                    <span className="photo-time">{formatDateTime(photo.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Upload modal */}
      {uploadModal && (
        <div className="photo-modal-overlay" onClick={closeUpload}>
          <div className="photo-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="photo-modal-title">사진 업로드</h3>
            <div className="photo-drop-zone" onClick={() => fileInputRef.current?.click()}>
              {preview ? (
                <img src={preview} alt="preview" className="photo-preview" />
              ) : (
                <div className="photo-drop-placeholder">
                  <span className="photo-drop-icon">📷</span>
                  <span>탭하여 사진 선택</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div className="photo-modal-field">
              <label>장소</label>
              <div className="photo-loc-btns">
                {LOCATIONS.map(({ key, label, colorClass }) => (
                  <button
                    key={key}
                    className={`photo-loc-btn ${colorClass} ${location === key ? 'selected' : ''}`}
                    onClick={() => setLocation(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="photo-modal-error">{error}</p>}
            <div className="photo-modal-btns">
              <button className="photo-modal-cancel" onClick={closeUpload}>취소</button>
              <button className="photo-modal-confirm" onClick={handleUpload} disabled={uploading}>
                {uploading ? '업로드 중...' : '업로드'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="photo-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="photo-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="photo-modal-title">사진 삭제</h3>
            <p className="photo-modal-desc">이 사진을 삭제하시겠습니까?</p>
            <div className="photo-delete-preview-wrap">
              <img src={deleteTarget.image_url} alt="" className="photo-delete-preview" />
            </div>
            <div className="photo-modal-btns">
              <button className="photo-modal-cancel" onClick={() => setDeleteTarget(null)}>취소</button>
              <button className="photo-modal-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
