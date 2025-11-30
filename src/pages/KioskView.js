// 메인 화면 - 주문 시작
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrder } from '../contexts/OrderContext';
import speechService from '../services/SpeechService';
import '../styles/KioskView.css';
import '../components/Text.css';
import '../components/Button.css';

// 사용자 맞춤 버튼 css 친근하게 수정
// 기본 / 느린 키오스크 모드 추가
const KioskView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearOrder, setStage } = useOrder();
  const [selectedMode, setSelectedMode] = useState(null);
  const [showModeSelection, setShowModeSelection] = useState(true);

  useEffect(() => {
    // 초기 화면 진입 시 주문 초기화 (경로가 / 또는 /kiosk일 때)
    if (location.pathname === '/' || location.pathname === '/kiosk') {
      clearOrder();
      setStage('kiosk');
    }
  }, [location.pathname, clearOrder, setStage]);

  // 음성 인식으로 "주문 시작하기" 감지 - 모드 선택 화면과 메인 화면 모두에서 작동
  useEffect(() => {
    if (!speechService.isSupported()) return;

    const handleVoiceCommand = (text) => {
      if (!text || !text.trim()) return;
      
      const normalizedText = text.trim().toLowerCase();
      
      // "주문 시작" 관련 다양한 표현 감지
      const startPatterns = [
        '주문 시작하기',
        '주문 시작',
        '시작하기',
        '시작',
        '주문할게요',
        '주문할게',
        '주문하겠습니다',
        '주문',
      ];

      const isStartCommand = startPatterns.some(pattern => 
        normalizedText.includes(pattern)
      );

      if (isStartCommand) {
        // 모드 선택 화면이 열려있으면 닫고 주문 시작
        if (showModeSelection) {
          setShowModeSelection(false);
          setSelectedMode('slow');
          if (speechService.isSupported()) {
            speechService.speak('주문을 시작하겠습니다.');
          }
          // 잠시 후 주문 화면으로 이동
          setTimeout(() => {
            setStage('payment');
            navigate('/payment');
          }, 1500);
        } else {
          // 이미 모드 선택이 끝난 상태면 바로 주문 시작
          setStage('payment');
          navigate('/payment');
        }
      }
    };

    // 음성 인식 결과 처리
    speechService.onResult((result) => {
      if (result.final) {
        handleVoiceCommand(result.final);
      } else if (result.interim) {
        // 실시간 인식 결과도 확인 (더 빠른 반응을 위해)
        handleVoiceCommand(result.interim);
      }
    });

    // 음성 인식 에러 처리
    speechService.onError((error) => {
      if (error !== 'no-speech') {
        console.error('음성 인식 오류:', error);
      }
    });

    // 음성 인식 시작
    if (!speechService.isListening) {
      try {
        speechService.start(true);
      } catch (e) {
        console.log('이미 마이크가 켜져 있습니다.');
      }
    }

    return () => {
      // 컴포넌트 언마운트 시에만 음성 인식 중지
      // 다른 화면으로 이동할 때는 계속 작동하도록 유지
    };
  }, [showModeSelection, navigate, setStage]);

  const handleModeSelection = (mode) => {
    setSelectedMode(mode);

    if (mode === 'slow') {
      setShowModeSelection(false);
      if (speechService.isSupported()) {
        speechService.speak('느린 키오스크 모드를 선택하셨어요. 천천히 도와드릴게요.');
      }
      return;
    }

    setStage('ordering');
    navigate('/ordering');
  };

  const handleResetModeSelection = () => {
    setSelectedMode(null);
    setShowModeSelection(true);
  };

  const handlePayment = () => {
    setStage('payment');
    navigate('/payment');
  };

  const handleOpenGlobalSettings = () => {
    navigate('/global');
  };

  return (
    <div className="kiosk-view">
      {showModeSelection && (
        <div className="mode-selection-backdrop" role="presentation">
          <div
            className="mode-selection-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mode-selection-heading"
          >
            <p className="mode-selection-label">시작 전에 어떤 모드로 주문할까요?</p>
            <h2 id="mode-selection-heading">원하는 키오스크 모드를 선택해주세요</h2>
            <div className="mode-options">
              <button
                type="button"
                className={`mode-card slow ${selectedMode === 'slow' ? 'selected' : ''}`}
                onClick={() => handleModeSelection('slow')}
              >
                <span className="mode-icon" aria-hidden="true">🐢</span>
                <span className="mode-title">느린 키오스크</span>
                <span className="mode-description">
                  큰 글자와 음성 안내로 천천히 주문을 도와드려요.
                </span>
                <span className="mode-hint">추천</span>
              </button>
              <button
                type="button"
                className={`mode-card standard ${selectedMode === 'standard' ? 'selected' : ''}`}
                onClick={() => handleModeSelection('standard')}
              >
                <span className="mode-icon" aria-hidden="true">⚡</span>
                <span className="mode-title">일반 키오스크</span>
                <span className="mode-description">
                  익숙한 속도로 바로 주문 화면으로 이동합니다.
                </span>
                <span className="mode-hint">빠른 주문</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="kiosk-main-content">
        <div className="welcome-section">
          <h1 className="main-title">느린 키오스크</h1>
          <p className="subtitle">음성으로 편리하게 주문하세요</p>
        </div>

        <div className="features-section">
          <div className="feature-card">
            <div className="feature-icon">🎤</div>
            <h3>AI 기반 음성 주문</h3>
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
      <button
        type="button"
        className="global-settings-button"
        onClick={handleOpenGlobalSettings}
        aria-label="사용자 맞춤 설정 열기"
      >
        <span className="global-settings-icon" aria-hidden="true">
          ⚙️
        </span>
        <span className="global-settings-copy">
          <span className="global-settings-title">사용자 맞춤</span>
          <span className="global-settings-caption">글자·색상·휠체어 모드</span>
        </span>
      </button>
    </div>
  );
};

export default KioskView;

// 주문 내역 확인 창 필요