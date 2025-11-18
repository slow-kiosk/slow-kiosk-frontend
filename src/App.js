import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './styles/App.css';

import { OrderProvider } from './contexts/OrderContext';
import Nav from "./components/Nav";
import KioskView from "./pages/KioskView";
import OrderingView from "./pages/OrderingView";
import DiscountView from "./pages/DiscountView";
import PaymentView from "./pages/PaymentView";

function App() {
  useEffect(() => {
    // 키오스크 모드에서는 창 크기 조정 시도 (일부 브라우저에서만 작동)
    if (window.resizeTo) {
      try {
        window.resizeTo(1080, 1920);
      } catch (e) {
        // 권한이 없을 수 있음
      }
    }
  }, []);

  return (
    <OrderProvider>
      <Router>
        <div className="kiosk-container">
          <Nav />

          <Routes>
            <Route path="/" element={<KioskView />} />
            <Route path="/kiosk" element={<KioskView />} />
            <Route path="/ordering" element={<OrderingView />} />
            <Route path="/discount" element={<DiscountView />} />
            <Route path="/payment" element={<PaymentView />} />
          </Routes>
        </div>
      </Router>
    </OrderProvider>
  );
}

export default App;

// npm install @mui/material @emotion/react @emotion/styled
// npm install @mui/icons-material
// npm install react-router-dom
// npm install axios


