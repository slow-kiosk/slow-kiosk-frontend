import React, { createContext, useContext, useEffect, useState } from 'react';

const AccessibilityContext = createContext(null);

export const AccessibilityProvider = ({ children }) => {
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1); // 1x 또는 1.5x
  const [highContrast, setHighContrast] = useState(false);
  const [colorFilter, setColorFilter] = useState('none'); // 'none' | 'grayscale'

  // 전역 글자 크기 조절 (CSS 변수 사용)
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--font-size-multiplier',
      String(fontSizeMultiplier)
    );
  }, [fontSizeMultiplier]);

  // 고대비 / 색약 필터를 body에 filter로 적용
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const filters = [];

    if (colorFilter === 'grayscale') {
      filters.push('grayscale(1)');
    }

    if (highContrast) {
      filters.push('contrast(1.4)', 'brightness(1.05)');
    }

    document.body.style.filter = filters.join(' ') || 'none';
  }, [highContrast, colorFilter]);

  const value = {
    fontSizeMultiplier,
    setFontSizeMultiplier,
    highContrast,
    setHighContrast,
    colorFilter,
    setColorFilter,
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


