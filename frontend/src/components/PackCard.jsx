import './PackCard.css';

export default function PackCard({ pack }) {
  return (
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
        {pack.serial_code && (
          <p className="pack-serial">{pack.serial_code}</p>
        )}
        <div className="pack-prices">
          {pack.price1 > 0 && (
            <span className="price">{pack.price1.toLocaleString()}원 <small>(1팩)</small></span>
          )}
          {pack.price2 > 0 && (
            <span className="price">{pack.price2.toLocaleString()}원 <small>(1박스)</small></span>
          )}
        </div>
        <div className="pack-footer">
          <span className="pack-qty">재고: <strong>{pack.quantity}</strong>개</span>
        </div>
      </div>
    </div>
  );
}
