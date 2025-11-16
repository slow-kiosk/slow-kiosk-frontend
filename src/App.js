import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './styles/App.css';

import Nav from "./components/Nav";
import KioskView from "./pages/KioskView";
import OrderingView from "./pages/OrderingView";
import DiscountView from "./pages/DiscountView";
import PaymentView from "./pages/PaymentView";

function App() {
  useEffect(() => {
    window.resizeTo(1920, 1080);
  }, []);

  return (
    <Router>
      <div className="kiosk-container">
        <Nav />

        <Routes>
          <Route path="/kiosk" element={<KioskView />} />
          <Route path="/ordering" element={<OrderingView />} />
          <Route path="/discount" element={<DiscountView />} />
          <Route path="/payment" element={<PaymentView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

// npm install @mui/material @emotion/react @emotion/styled
// npm install @mui/icons-material
// npm install react-router-dom

