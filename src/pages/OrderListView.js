import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../contexts/OrderContext';
import '../styles/PaymentView.css';

const OrderListView = () => {
  const navigate = useNavigate();
  const { orderItems, totalPrice, discount, finalPrice } = useOrder();

  const [paymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted] = useState(false);
  const hasInitialized = useRef(false);

  // 주문 페이지로 돌아가기
  const handleBackToOrdering = () => {
    navigate('/ordering');
  };

  return (
    <div className="payment-view">
      <div className="payment-container">
        <div className="payment-left">
          <div className="order-summary-section">
            <h2 className="section-title">주문 내역</h2>

            <div className="order-items-list">
              {orderItems.map((item, index) => (
                <div key={index} className="order-item-row">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">x{item.quantity || 1}</span>
                  <span className="item-price">
                    {(item.price * (item.quantity || 1)).toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>

            <div className="price-breakdown">
              <div className="price-row">
                <span>주문 금액</span>
                <span>{totalPrice.toLocaleString()}원</span>
              </div>

              {discount > 0 && (
                <div className="price-row discount-row">
                  <span>할인 금액</span>
                  <span>-{discount.toLocaleString()}원</span>
                </div>
              )}

              <div className="price-row total-row">
                <span>결제 금액</span>
                <span>{finalPrice.toLocaleString()}원</span>
              </div>
            </div>

            <button
              className="back-to-ordering-button"
              onClick={handleBackToOrdering}
              disabled={isProcessing}
            >
              주문 계속하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderListView;
