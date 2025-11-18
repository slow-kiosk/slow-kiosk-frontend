// 메인 화면 - 주문 시작
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../contexts/OrderContext';
import speechService from '../services/SpeechService';
import '../styles/KioskView.css';
import '../components/Text.css';
import '../components/Button.css';

const KioskView = () => {
  const navigate = useNavigate();
  const { clearOrder, setStage } = useOrder();

  useEffect(() => {
    // 페이지 진입 시 주문 초기화
    clearOrder();
    setStage('kiosk');
  }, [clearOrder, setStage]);

  const handlePayment = () => {
    setStage('payment');
    navigate('/payment');
  };

  return (
    <div className="kiosk-view">
      <div className="kiosk-main-content">
        <div className="welcome-section">
          <h1 className="main-title">느린 키오스크</h1>
          <p className="subtitle">음성으로 편리하게 주문하세요</p>
        </div>

        <div className="features-section">
          <div className="feature-card">
            <div className="feature-icon">🎤</div>
            <h3>음성 주문</h3>
            <p>메뉴를 말씀해주시면<br />자동으로 주문됩니다</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>AI 가이드</h3>
            <p>단계별로 친절하게<br />안내해드립니다</p>
          </div>
        </div>

        <button 
          className="start-button"
          onClick={handlePayment}
        >
          주문 시작하기
        </button>

        {!speechService.isSupported() && (
          <div className="warning-message">
            이 브라우저는 음성 인식을 지원하지 않습니다.<br />
            Chrome 또는 Edge 브라우저를 사용해주세요.
          </div>
        )}
      </div>
    </div>
  );
};

export default KioskView;

// 주문 내역 확인 창 필요