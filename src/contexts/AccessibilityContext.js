import React, { createContext, useContext, useEffect, useState } from 'react';

const AccessibilityContext = createContext(null);

export const AccessibilityProvider = ({ children }) => {
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1); // 1x 또는 1.5x
  const [highContrast, setHighContrast] = useState(false);
  const [colorFilter, setColorFilter] = useState('none'); // 'none' | 'colorblind'
  const [wheelchairMode, setWheelchairMode] = useState(false); // 휠체어/키즈 모드

  // 전역 글자 크기 조절 (CSS 변수 사용)
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--font-size-multiplier',
      String(fontSizeMultiplier)
    );
  }, [fontSizeMultiplier]);

  // 고대비 모드: CSS 변수로 색상 교체
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    if (highContrast) {
      // 고대비 색상 적용 (명도 대비 4.5:1 이상)
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // 색약 필터: SVG feColorMatrix 사용
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // SVG 필터 ID
    const filterId = 'colorblind-filter';
    let svgFilter = document.getElementById(filterId);

    if (colorFilter === 'colorblind') {
      // SVG 필터가 없으면 생성
      if (!svgFilter) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('style', 'position: absolute; width: 0; height: 0;');
        svg.innerHTML = `
          <defs>
            <filter id="${filterId}" color-interpolation-filters="sRGB">
              <feColorMatrix type="matrix" values="
                0.567 0.433 0 0 0
                0.558 0.442 0 0 0
                0 0.242 0.758 0 0
                0 0 0 1 0
              "/>
            </filter>
          </defs>
        `;
        document.body.appendChild(svg);
        svgFilter = document.getElementById(filterId);
      }
      
      // body에 필터 적용
      document.body.style.filter = `url(#${filterId})`;
    } else {
      // 필터 제거
      document.body.style.filter = 'none';
    }
  }, [colorFilter]);

  // 휠체어/키즈 모드: 레이아웃 조정
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const container = document.querySelector('.kiosk-container');
    if (container) {
      if (wheelchairMode) {
        container.classList.add('wheelchair-mode');
      } else {
        container.classList.remove('wheelchair-mode');
      }
    }
  }, [wheelchairMode]);

  const value = {
    fontSizeMultiplier,
    setFontSizeMultiplier,
    highContrast,
    setHighContrast,
    colorFilter,
    setColorFilter,
    wheelchairMode,
    setWheelchairMode,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return ctx;
};


