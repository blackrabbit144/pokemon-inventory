import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import './LogPage.css';

const LOCATION_MAP = { gwangju: '광주', busan: '부산', bonbu: '본부' };
const ACTION_COLOR = { add: 'log-add', remove: 'log-remove', transfer: 'log-transfer' };
const ACTION_LABEL = { add: '입고', remove: '출고', transfer: '이동' };

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function getDateKey(isoStr) {
  return isoStr.slice(0, 10);
}

export default function LogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/logs/')
      .then((res) => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group logs by date
  const grouped = logs.reduce((acc, log) => {
    const key = getDateKey(log.timestamp);
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="log-wrap">
      <header className="log-header">
        <div className="log-header-inner">
          <h1 className="log-header-title">재고 로그</h1>
          <Link to="/" className="log-back-btn">← 목록으로</Link>
        </div>
      </header>

      <main className="log-main">
        {loading ? (
          <div className="log-loading">로딩 중...</div>
        ) : logs.length === 0 ? (
          <div className="log-empty">아직 재고 기록이 없습니다.</div>
        ) : (
          sortedDates.map((dateKey) => (
            <section key={dateKey} className="log-date-group">
              <h2 className="log-date-heading">{formatDate(grouped[dateKey][0].timestamp)}</h2>
              <div className="log-list">
                {grouped[dateKey].map((log) => (
                  <div key={log.id} className={`log-item ${ACTION_COLOR[log.action]}`}>
                    <div className="log-time">{formatTime(log.timestamp)}</div>
                    <div className="log-badge">{ACTION_LABEL[log.action]}</div>
                    <div className="log-body">
                      <span className="log-pack-name">{log.pack_name}</span>
                      <span className="log-location">{log.location_display}</span>
                    </div>
                    <div className="log-qty">
                      {log.action === 'add' ? '+' : log.action === 'remove' ? '−' : ''}
                      {log.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
