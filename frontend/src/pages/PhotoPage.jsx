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
  const [modal, setModal] = useState(false);
  const [location, setLocation] = useState('gwangju');
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/photos/')
      .then((res) => setPhotos(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openModal = () => {
    setModal(true);
    setFile(null);
    setPreview(null);
    setLocation('gwangju');
    setError('');
  };

  const closeModal = () => {
    setModal(false);
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
      closeModal();
    } catch (e) {
      setError(e.response?.data?.error || '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const locInfo = (key) => LOCATIONS.find((l) => l.key === key);

  return (
    <div className="photo-wrap">
      <header className="photo-header">
        <div className="photo-header-inner">
          <h1 className="photo-header-title">제품 정보</h1>
          <button className="photo-upload-btn" onClick={openModal}>+ 사진 업로드</button>
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

      {modal && (
        <div className="photo-modal-overlay" onClick={closeModal}>
          <div className="photo-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="photo-modal-title">사진 업로드</h3>

            <div
              className="photo-drop-zone"
              onClick={() => fileInputRef.current?.click()}
            >
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
              <button className="photo-modal-cancel" onClick={closeModal}>취소</button>
              <button className="photo-modal-confirm" onClick={handleUpload} disabled={uploading}>
                {uploading ? '업로드 중...' : '업로드'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
