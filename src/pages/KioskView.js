// 메인 화면 - 주문 시작
import React, { useEffect, useState, useMemo } from 'react';
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
  const [displayText, setDisplayText] = useState('');
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const messages = useMemo(() => [
    '안녕하세요! 느린 키오스크입니다',
    '음성으로 편리하게 주문하세요',
    '준비가 완료되면 주문 시작하기를 말해주세요',
    'AI가 친절하게 도와드립니다',
    '천천히, 편안하게 주문해보세요',
  ], []);

  useEffect(() => {
    // 초기 화면 진입 시 주문 초기화 (경로가 / 또는 /kiosk일 때)
    if (location.pathname === '/' || location.pathname === '/kiosk') {
      clearOrder();
      setStage('kiosk');
    }
  }, [location.pathname, clearOrder, setStage]);

  useEffect(() => {
    if (showModeSelection) return; // 모드 선택 화면일 때는 타이핑 효과 중지

    const currentMessage = messages[currentMessageIndex];
    let timeout;

    if (!isDeleting && displayText.length < currentMessage.length) {
      // 타이핑 중
      timeout = setTimeout(() => {
        setDisplayText(currentMessage.substring(0, displayText.length + 1));
      }, 100);
    } else if (!isDeleting && displayText.length === currentMessage.length) {
      // 타이핑 완료, 잠시 대기 후 삭제 시작
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2500);
    } else if (isDeleting && displayText.length > 0) {
      // 삭제 중
      timeout = setTimeout(() => {
        setDisplayText(currentMessage.substring(0, displayText.length - 1));
      }, 50);
    } else if (isDeleting && displayText.length === 0) {
      // 삭제 완료, 다음 메시지로
      setIsDeleting(false);
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }

    return () => clearTimeout(timeout);
  }, [displayText, currentMessageIndex, isDeleting, showModeSelection, messages]);

  // 음성 인식으로 "주문 시작하기" 감지
  useEffect(() => {
    if (showModeSelection || !speechService.isSupported()) return;

    const handleVoiceCommand = (text) => {
      const normalizedText = text.trim().toLowerCase();
      // "주문 시작하기" 또는 유사한 표현 감지
      if (
        normalizedText.includes('주문 시작하기') ||
        normalizedText.includes('주문 시작') ||
        normalizedText.includes('시작하기') ||
        normalizedText.includes('시작')
      ) {
        setStage('payment');
        navigate('/payment');
      }
    };

    // 음성 인식 결과 처리
    speechService.onResult((result) => {
      if (result.final) {
        handleVoiceCommand(result.final);
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
      speechService.stop();
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
      {!showModeSelection && (
        <div className="typing-text-container">
          <span className="typing-text">
            {displayText}
            <span className="typing-cursor">|</span>
          </span>
        </div>
      )}
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