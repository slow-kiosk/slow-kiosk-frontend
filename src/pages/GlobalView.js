// 사용자 맞춤 - 고대비 테마 / 글자 크기 조절 토글 / 색약 지원 필터
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../contexts/AccessibilityContext';
import '../styles/GlobalView.css';

// 휠체어 모드(화면 스타일 수정 필요), 고대비 모드(글자가 흰색으로 뜸) 수정 필요
// 친절한 느낌으로 각각의 사용자 맞춤이 어떤 기능을 담당하는지 설명하는 음성 필요
// 조금 더 친근한 ui로 변경
const GlobalView = () => {
  const navigate = useNavigate();
  const {
    fontSizeMultiplier,
    setFontSizeMultiplier,
    highContrast,
    setHighContrast,
    colorFilter,
    setColorFilter,
    wheelchairMode,
    setWheelchairMode,
  } = useAccessibility();

  const handleHighContrastToggle = () => {
    setHighContrast(prev => !prev);
  };

  const handleColorFilterToggle = () => {
    setColorFilter(prev => (prev === 'colorblind' ? 'none' : 'colorblind'));
  };

  const handleWheelchairModeToggle = () => {
    setWheelchairMode(prev => !prev);
  };

  const globalViewClassName = ['global-view', highContrast ? 'global-view--light-surface' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={globalViewClassName}>
      <div className="global-card" role="region" aria-label="사용자 맞춤 설정">
        <div className="global-hero">
          <div className="global-hero-copy">
            <h1 className="global-title">사용자 맞춤 설정</h1>
            <p className="global-subtitle">
              편하게 이용하실 수 있도록 화면 밝기와 글자 크기를 원하는
              대로 바꿔보세요.
            </p>
            <ul className="global-hero-list" aria-label="설정 안내">
              {/* <li>필요한 기능만 골라 켜고 끌 수 있어요.</li>
              <li>변경 즉시 모든 화면에 적용돼요.</li> */}
              {/* <li>휠체어·키즈 모드로 버튼을 아래로 모을 수 있어요.</li> */}
            </ul>
          </div>
        </div>

        <section className="global-section" aria-label="고대비 모드">
          <div className="global-section-card">
            <div className="global-section-header">
              <span className="global-section-icon" aria-hidden="true">
                🌙
              </span>
              <div>
                <h2>고대비 모드</h2>
                <span className="global-section-desc">
                  밝기와 대비를 높여 글자와 버튼을 또렷하게 보여줍니다.
                </span>
              </div>
            </div>
            <button
              type="button"
              className={`global-toggle-button ${highContrast ? 'active' : ''}`}
              onClick={handleHighContrastToggle}
              aria-pressed={highContrast}
            >
              {highContrast ? '고대비 해제' : '고대비 적용'}
            </button>
            <p className="global-tip">
              {highContrast
                ? '어두운 바탕에 밝은 글자로 표시 중이에요.'
                : '켜면 흰 글자가 검은 배경 위에 나타나 더 잘 보여요.'}
            </p>
          </div>
        </section>

        <section className="global-section" aria-label="글자 크기 조절">
          <div className="global-section-card">
            <div className="global-section-header">
              <span className="global-section-icon" aria-hidden="true">
                🔍
              </span>
              <div>
                <h2>글자 크기 조절</h2>
                <span className="global-section-desc">
                  큰 글자가 편하다면 1.5배로 키워 보세요.
                </span>
              </div>
            </div>
            <div className="global-toggle-group" role="group" aria-label="글자 크기 선택">
              <button
                type="button"
                className={`global-option-button ${fontSizeMultiplier === 1 ? 'selected' : ''}`}
                onClick={() => setFontSizeMultiplier(1)}
                aria-pressed={fontSizeMultiplier === 1}
              >
                1x 기본
              </button>
              <button
                type="button"
                className={`global-option-button ${fontSizeMultiplier === 1.5 ? 'selected' : ''}`}
                onClick={() => setFontSizeMultiplier(1.5)}
                aria-pressed={fontSizeMultiplier === 1.5}
              >
                1.5x 크게
              </button>
            </div>
            <div className="global-inline-indicator" aria-live="polite">
              현재 설정: {fontSizeMultiplier === 1 ? '기본 크기' : '큰 글자'}
            </div>
          </div>
        </section>

        <section className="global-section" aria-label="색약 지원 모드">
          <div className="global-section-card">
            <div className="global-section-header">
              <span className="global-section-icon" aria-hidden="true">
                🎨
              </span>
              <div>
                <h2>색약 지원 모드</h2>
                <span className="global-section-desc">
                  붉은색과 초록색을 구분하기 쉬운 색으로 자동 변환합니다.
                </span>
              </div>
            </div>
            <button
              type="button"
              className={`global-toggle-button ${colorFilter === 'colorblind' ? 'active' : ''}`}
              onClick={handleColorFilterToggle}
              aria-pressed={colorFilter === 'colorblind'}
            >
              {colorFilter === 'colorblind' ? '색약 모드 해제' : '색약 모드 적용'}
            </button>
            <p className="global-tip">
              색감이 살짝 달라져도 메뉴 정보는 그대로 유지돼요.
            </p>
          </div>
        </section>

        {/* <section className="global-section" aria-label="휠체어 및 키즈 모드">
          <div className="global-section-card">
            <div className="global-section-header">
              <span className="global-section-icon" aria-hidden="true">
                🧑‍🦽
              </span>
              <div>
                <h2>휠체어 & 키즈 모드</h2>
                <span className="global-section-desc">
                  버튼과 입력창을 화면 하단 50%에 모아 손이 닿기 쉬운 위치로 이동합니다.
                </span>
              </div>
            </div>
            <button
              type="button"
              className={`global-toggle-button ${wheelchairMode ? 'active' : ''}`}
              onClick={handleWheelchairModeToggle}
              aria-pressed={wheelchairMode}
            >
              {wheelchairMode ? '일반 모드로 전환' : '휠체어/키즈 모드 적용'}
            </button>
            <p className="global-tip">
              {wheelchairMode
                ? '화면 아래쪽에서 모든 조작을 계속 이용하실 수 있어요.'
                : '켜면 위쪽에는 안내 문구만, 아래쪽에는 조작 버튼만 남습니다.'}
            </p>
          </div>
        </section> */}

        <div className="global-footer">
          <div className="global-footer-info">
            <span aria-live="polite">
              선택한 설정은 주문 과정 전체에 바로 적용돼요.
            </span>
          </div>
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





