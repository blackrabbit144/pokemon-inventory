import { useState } from 'react';
import api from '../api/client';
import './PackCard.css';

const LOCATIONS = [
  { key: 'gwangju', label: '광주', colorClass: 'loc-gwangju' },
  { key: 'busan',   label: '부산', colorClass: 'loc-busan' },
  { key: 'bonbu',   label: '본부', colorClass: 'loc-bonbu' },
];

export default function PackCard({ pack, onUpdate }) {
  const [modal, setModal] = useState(null); // { type: 'add'|'remove'|'transfer', location?, fromLoc? }
  const [qty, setQty] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openAdd = (loc) => {
    setModal({ type: 'add', location: loc });
    setQty('');
    setError('');
  };

  const openRemove = (loc) => {
    setModal({ type: 'remove', location: loc });
    setQty('');
    setError('');
  };

  const openTransfer = (fromLoc) => {
    const defaultTo = LOCATIONS.find((l) => l.key !== fromLoc)?.key || '';
    setModal({ type: 'transfer', fromLoc });
    setToLoc(defaultTo);
    setQty('');
    setError('');
  };

  const closeModal = () => {
    setModal(null);
    setError('');
  };

  const handleSubmit = async () => {
    const quantity = parseInt(qty, 10);
    if (!quantity || quantity <= 0) {
      setError('수량을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let res;
      if (modal.type === 'add') {
        res = await api.post('/inventory/add/', { pack_id: pack.id, location: modal.location, quantity });
      } else if (modal.type === 'remove') {
        res = await api.post('/inventory/remove/', { pack_id: pack.id, location: modal.location, quantity });
      } else {
        if (toLoc === modal.fromLoc) { setError('출발지와 도착지가 같습니다.'); setLoading(false); return; }
        res = await api.post('/inventory/transfer/', { pack_id: pack.id, from_location: modal.fromLoc, to_location: toLoc, quantity });
      }
      onUpdate(res.data);
      closeModal();
    } catch (e) {
      setError(e.response?.data?.error || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = () => {
    if (!modal) return '';
    const locLabel = (key) => LOCATIONS.find((l) => l.key === key)?.label || key;
    if (modal.type === 'add') return `입고 — ${locLabel(modal.location)}`;
    if (modal.type === 'remove') return `출고 — ${locLabel(modal.location)}`;
    return `이동 — ${locLabel(modal.fromLoc)} →`;
  };

  return (
    <>
      <div className="pack-card">
        <div className="pack-img-wrap">
          {pack.img_src ? (
            <img src={pack.img_src} alt={pack.name} loading="lazy" />
          ) : (
            <div className="pack-no-img">이미지 없음</div>
          )}
        </div>
        <div className="pack-info">
          <p className="pack-name">{pack.name}</p>
          {pack.serial_code && <p className="pack-serial">{pack.serial_code}</p>}
          <div className="pack-prices">
            {pack.price1 > 0 && (
              <span className="price">{pack.price1.toLocaleString()}원 <small>(1팩)</small></span>
            )}
            {pack.price2 > 0 && (
              <span className="price">{pack.price2.toLocaleString()}원 <small>(1박스)</small></span>
            )}
          </div>

          <div className="pack-inventory">
            {LOCATIONS.map(({ key, label, colorClass }) => (
              <div key={key} className={`inv-row ${colorClass}`}>
                <span className="inv-label">{label}</span>
                <span className="inv-qty">{pack[`qty_${key}`]}</span>
                <div className="inv-actions">
                  <button className="inv-btn inv-btn-add" onClick={() => openAdd(key)} title="입고">+</button>
                  <button className="inv-btn inv-btn-remove" onClick={() => openRemove(key)} title="출고">−</button>
                  <button className="inv-btn inv-btn-transfer" onClick={() => openTransfer(key)} title="이동">⇄</button>
                </div>
              </div>
            ))}
            <div className="inv-total">
              <span>합계</span>
              <span className="inv-total-qty">{pack.qty_total}</span>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{modalTitle()}</h3>
            <p className="modal-pack-name">{pack.name}</p>

            {modal.type === 'transfer' && (
              <div className="modal-field">
                <label>도착지</label>
                <select value={toLoc} onChange={(e) => setToLoc(e.target.value)}>
                  {LOCATIONS.filter((l) => l.key !== modal.fromLoc).map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="modal-field">
              <label>수량</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoFocus
                placeholder="수량 입력"
              />
            </div>

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-btns">
              <button className="modal-cancel" onClick={closeModal}>취소</button>
              <button className="modal-confirm" onClick={handleSubmit} disabled={loading}>
                {loading ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
