import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './styles/App.css';

import { OrderProvider } from './contexts/OrderContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import Nav from "./components/Nav";
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
  }, []);

  return (
    <AccessibilityProvider>
      <OrderProvider>
        <Router>
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


