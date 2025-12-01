import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './styles/App.css';

import { OrderProvider } from './contexts/OrderContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { testBackendConnection } from './services/Api';
import Nav from "./components/Nav";
import ResolutionChecker from "./components/ResolutionChecker";
import KioskView from "./pages/KioskView";
import OrderingView from "./pages/OrderingView";
import OrderListView from "./pages/OrderListView";
import CheckoutView from "./pages/CheckoutView";
import PaymentView from "./pages/PaymentView";
import GlobalView from "./pages/GlobalView";

function App() {
  useEffect(() => {
    // 키오스크 모드: 창 크기 조정 시도 (일부 브라우저에서만 작동)
    // CSS로 1080x1920 크기와 가운데 정렬이 자동으로 설정됨
    if (window.resizeTo) {
      try {
        window.resizeTo(1080, 1920);
      } catch (e) {
        // 권한이 없을 수 있음 (일반적인 경우)
      }
    }
    
    // 앱 시작 시 백엔드 서버 연결 상태 확인
    const checkBackendConnection = async () => {
      console.log('\n프로그램 실행 시작 - 백엔드 서버 연결 확인 중...\n');
      const result = await testBackendConnection();
      
      if (result.success) {
        console.log(`백엔드 서버 연결 성공 (${result.duration}ms)`);
      } else {
        console.error(`백엔드 서버 연결 실패: ${result.message}`);
        console.error('백엔드 서버가 실행 중인지, 네트워크 연결이 정상인지 확인해주세요.');
      }
    };
    
    // 약간의 지연 후 연결 테스트 (앱 초기화 완료 후)
    setTimeout(checkBackendConnection, 500);
  }, []);

  return (
    <AccessibilityProvider>
      <OrderProvider>
        <Router>
          <ResolutionChecker />
          <div className="kiosk-container">
            <Nav />
            <main className="kiosk-content">
              <Routes>
                <Route path="/" element={<KioskView />} />
                <Route path="/kiosk" element={<KioskView />} />
                <Route path="/ordering" element={<OrderingView />} />
                <Route path="/order-list" element={<OrderListView />} />
                <Route path="/checkout" element={<CheckoutView />} />
                <Route path="/payment" element={<PaymentView />} />
                <Route path="/global" element={<GlobalView />} />
              </Routes>
            </main>
          </div>
        </Router>
      </OrderProvider>
    </AccessibilityProvider>
  );
}

export default App;

// npm install @mui/material @emotion/react @emotion/styled
// npm install @mui/icons-material
// npm install react-router-dom
// npm install axios


