// 사용자 맞춤 - 고대비 테마 / 글자 크기 조절 토글 / 색약 지원 필터
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../contexts/AccessibilityContext';
import '../styles/GlobalView.css';

const GlobalView = () => {
  const navigate = useNavigate();
  const {
    fontSizeMultiplier,
    setFontSizeMultiplier,
    highContrast,
    setHighContrast,
    colorFilter,
    setColorFilter,
  } = useAccessibility();

  const handleFontSizeToggle = () => {
    setFontSizeMultiplier(prev => (prev === 1 ? 1.5 : 1));
  };

  const handleHighContrastToggle = () => {
    setHighContrast(prev => !prev);
  };

  const handleColorFilterToggle = () => {
    setColorFilter(prev => (prev === 'grayscale' ? 'none' : 'grayscale'));
  };

  return (
    <div className="global-view">
      <div className="global-card">
        <h1 className="global-title">사용자 맞춤 설정</h1>
        <p className="global-subtitle">
          키오스크를 더 보기 쉽고 편하게 사용할 수 있도록 화면을 조절해보세요.
        </p>

        <div className="global-section">
          <div className="global-section-header">
            <h2>고대비 모드</h2>
            <span className="global-section-desc">
              화면의 밝기와 대비를 높여 글자와 버튼을 더 선명하게 보여줍니다.
            </span>
          </div>
          <button
            type="button"
            className={`global-toggle-button ${highContrast ? 'active' : ''}`}
            onClick={handleHighContrastToggle}
          >
            {highContrast ? '고대비 해제' : '고대비 적용'}
          </button>
        </div>

        <div className="global-section">
          <div className="global-section-header">
            <h2>글자 크기 조절</h2>
            <span className="global-section-desc">
              글자를 크게 또는 기본 크기로 전환할 수 있습니다.
            </span>
          </div>
          <div className="global-toggle-group">
            <button
              type="button"
              className={`global-option-button ${
                fontSizeMultiplier === 1 ? 'selected' : ''
              }`}
              onClick={() => setFontSizeMultiplier(1)}
            >
              1x (기본)
            </button>
            <button
              type="button"
              className={`global-option-button ${
                fontSizeMultiplier === 1.5 ? 'selected' : ''
              }`}
              onClick={() => setFontSizeMultiplier(1.5)}
            >
              1.5x (크게)
            </button>
          </div>
          <div className="global-inline-indicator">
            현재 설정: {fontSizeMultiplier === 1 ? '기본 크기' : '큰 글자'}
          </div>
        </div>

        <div className="global-section">
          <div className="global-section-header">
            <h2>색약 지원 모드</h2>
            <span className="global-section-desc">
              화면 색상을 회색조로 바꾸거나 원래 색으로 되돌릴 수 있습니다.
            </span>
          </div>
          <button
            type="button"
            className={`global-toggle-button ${
              colorFilter === 'grayscale' ? 'active' : ''
            }`}
            onClick={handleColorFilterToggle}
          >
            {colorFilter === 'grayscale' ? '색약 모드 해제' : '색약 모드 적용'}
          </button>
        </div>

        <div className="global-footer">
          <button
            type="button"
            className="global-back-button"
            onClick={() => navigate('/kiosk')}
          >
            키오스크 화면으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalView;





