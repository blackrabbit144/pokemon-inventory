import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import PackCard from '../components/PackCard';
import './PacksPage.css';

export default function PacksPage() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/packs/')
      .then((res) => setPacks(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const handlePackUpdate = (updatedPack) => {
    setPacks((prev) => prev.map((p) => (p.id === updatedPack.id ? updatedPack : p)));
  };

  return (
    <div className="packs-wrap">
      <header className="packs-header">
        <div className="header-inner">
          <h1 className="header-title">제품 정보</h1>
          <button onClick={handleLogout} className="logout-btn">로그아웃</button>
        </div>
        <nav className="header-nav">
          <span className="nav-active">확장팩</span>
          <Link to="/logs" className="nav-link">재고 로그</Link>
        </nav>
      </header>

      <main className="packs-main">
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : (
          <div className="packs-grid">
            {packs.map((pack) => (
              <PackCard key={pack.id} pack={pack} onUpdate={handlePackUpdate} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
