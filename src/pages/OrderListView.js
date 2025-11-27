import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../contexts/OrderContext';
import '../styles/OrderListView.css';


// 메뉴 추가 시 기존에 주문 목록에 있는 메뉴라면 수량 +1로 수정
// 주문 내역 UI 수정 필요
const OrderListView = () => {
  const navigate = useNavigate();
  const { orderItems, totalPrice, discount, finalPrice } = useOrder();

  const isProcessing = false;

  // 주문 페이지로 돌아가기
  const handleBackToOrdering = () => {
    navigate('/ordering');
  };

  return (
    <div className="order-list-view">
      <div className="order-list-container">
        <div className="order-list-panel">
          <header className="order-list-header">
            <div>
              <p className="order-list-subtitle">현재 주문</p>
              <h2 className="order-list-title">주문 내역</h2>
            </div>
            <span className="order-list-count">
              총 {orderItems.length}개 메뉴
            </span>
          </header>

          <div className="order-list-items">
            {orderItems.length === 0 ? (
              <div className="order-list-empty">
                <p>아직 선택된 메뉴가 없어요.</p>
                <p>주문 페이지로 돌아가 메뉴를 골라주세요.</p>
              </div>
            ) : (
              orderItems.map((item, index) => (
                <div key={index} className="order-list-item">
                  <div className="order-list-item-info">
                    <span className="order-list-item-name">{item.name}</span>
                    <span className="order-list-item-quantity">
                      수량 {item.quantity || 1}개
                    </span>
                  </div>
                  <span className="order-list-item-price">
                    {(item.price * (item.quantity || 1)).toLocaleString()}원
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="order-list-breakdown">
            <div className="order-list-row">
              <span>주문 금액</span>
              <strong>{totalPrice.toLocaleString()}원</strong>
            </div>

            {discount > 0 && (
              <div className="order-list-row order-list-row-discount">
                <span>할인 금액</span>
                <strong>-{discount.toLocaleString()}원</strong>
              </div>
            )}

            <div className="order-list-row order-list-row-total">
              <span>결제 금액</span>
              <strong>{finalPrice.toLocaleString()}원</strong>
            </div>
          </div>

          <button
            className="order-list-continue-btn"
            onClick={handleBackToOrdering}
            disabled={isProcessing}
          >
            주문 계속하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderListView;
