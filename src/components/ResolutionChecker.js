import React, { useState, useEffect } from 'react';
import '../styles/ResolutionChecker.css';

const TARGET_WIDTH = 1080;
const TARGET_HEIGHT = 1920;
const TOLERANCE = 10; // 10px 허용 오차

const ResolutionChecker = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [currentSize, setCurrentSize] = useState({ width: 0, height: 0 });
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 사용자가 이미 "나중에 알림"을 눌러 창을 닫았는지 확인
    const dismissedFlag = localStorage.getItem('resolutionWarningDismissed');
    if (dismissedFlag === 'true') {
      setIsDismissed(true);
      setShowWarning(false);
      return; // 더 이상 경고를 띄우지 않음
    }

    const checkResolution = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setCurrentSize({ width, height });

      const isCorrectSize = 
        Math.abs(width - TARGET_WIDTH) <= TOLERANCE &&
        Math.abs(height - TARGET_HEIGHT) <= TOLERANCE;

      setShowWarning(!isCorrectSize);
    };

    // 초기 체크
    checkResolution();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', checkResolution);

    // 주기적으로 체크 (일부 브라우저에서 resize 이벤트가 제대로 작동하지 않을 수 있음)
    const intervalId = setInterval(checkResolution, 1000);

    return () => {
      window.removeEventListener('resize', checkResolution);
      clearInterval(intervalId);
    };
  }, []);

  const handleClose = () => {
    // "나중에 알림" 버튼 클릭 시, 이후부터는 창이 다시 뜨지 않도록 플래그 저장
    try {
      localStorage.setItem('resolutionWarningDismissed', 'true');
      setIsDismissed(true);
    } catch (e) {
      // localStorage 사용이 불가한 환경에서는 그냥 한 번만 닫힘
      console.error('Failed to access localStorage for resolution warning:', e);
    }
    setShowWarning(false);
  };

  const handleOpenDevTools = () => {
    // 개발자 도구 열기 안내
    alert(
      '개발자 도구를 여는 방법:\n\n' +
      'Windows/Linux:\n' +
      '  - F12 키를 누르거나\n' +
      '  - Ctrl + Shift + I\n\n' +
      'Mac:\n' +
      '  - Cmd + Option + I\n\n' +
      '개발자 도구가 열리면, 오른쪽 상단의 휴대폰/태블릿 아이콘(젠가 모양)을 눌러\n' +
      'Device Toolbar를 연 뒤, 상단의 Dimensions를 \"Responsive\"로 두고\n' +
      '너비 1080, 높이 1920으로 직접 입력해 주세요.'
    );
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="resolution-warning-backdrop" role="presentation">
      <div
        className="resolution-warning-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resolution-warning-heading"
      >
        <div className="resolution-warning-header">
          <span className="resolution-warning-icon" aria-hidden="true">⚠️</span>
          <h2 id="resolution-warning-heading">개발자 모드 안내</h2>
        </div>
        
        <div className="resolution-warning-content">
          <p className="resolution-warning-message">
            현재 화면 크기가 권장 해상도와 다릅니다.
          </p>
          
          <div className="resolution-info">
            <div className="resolution-current">
              <span className="resolution-label">현재 크기:</span>
              <span className="resolution-value">
                {currentSize.width} × {currentSize.height}px
              </span>
            </div>
            <div className="resolution-target">
              <span className="resolution-label">권장 크기:</span>
              <span className="resolution-value">
                {TARGET_WIDTH} × {TARGET_HEIGHT}px
              </span>
            </div>
          </div>

          <div className="resolution-instructions">
            <h3>개발자 도구(Device Toolbar)에서 창 크기 맞추기:</h3>
            <ol>
              <li>
                <strong>개발자 도구 열기:</strong>
                <ul>
                  <li>Windows/Linux: <kbd>F12</kbd> 또는 <kbd>Ctrl + Shift + I</kbd></li>
                  <li>Mac: <kbd>Cmd + Option + I</kbd></li>
                </ul>
              </li>
              <li>
                개발자 도구 오른쪽 상단의 <strong>휴대폰/태블릿 모양 아이콘</strong>을 눌러서
                <br />
                <strong>Device Toolbar</strong>를 켭니다.
              </li>
              <li>
                상단 바에서 <strong>Dimensions</strong>를 <strong>Responsive</strong>로 두고
                가로 너비를 <strong>1080</strong>, 세로 높이를 <strong>1920</strong>으로 입력해 주세요.
              </li>
            </ol>
          </div>
        </div>

        <div className="resolution-warning-actions">
          <button
            type="button"
            className="resolution-help-button"
            onClick={handleOpenDevTools}
          >
            개발자 도구 열기 안내
          </button>
          <button
            type="button"
            className="resolution-close-button"
            onClick={handleClose}
          >
            나중에 알림
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResolutionChecker;

