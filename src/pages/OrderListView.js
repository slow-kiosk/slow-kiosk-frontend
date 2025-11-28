import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../contexts/OrderContext';
import speechService from '../services/SpeechService';
import '../styles/OrderListView.css';


// 메뉴 추가 시 기존에 주문 목록에 있는 메뉴라면 수량 +1로 수정
// 주문 내역 UI 수정 필요
const OrderListView = () => {
  const navigate = useNavigate();
  const { orderItems, totalPrice, discount, finalPrice, giftCardInfo, setListening, setTranscript, setStage } = useOrder();
  const [isProcessing, setIsProcessing] = useState(false);

  // 주문 페이지로 돌아가기
  const handleBackToOrdering = useCallback(() => {
    navigate('/ordering');
  }, [navigate]);

  // "주문 계속하기" 음성 인식 처리
  const handleVoiceInput = useCallback((text) => {
    if (isProcessing || !text.trim()) return;
    
    setIsProcessing(true);
    
    const normalizedText = text.trim().toLowerCase();
    if (normalizedText.includes('주문 계속하기') || normalizedText.includes('주문계속하기')) {
      setIsProcessing(false);
      handleBackToOrdering();
      return;
    }
    
    setIsProcessing(false);
  }, [isProcessing, handleBackToOrdering]);

  // 음성 인식 설정
  useEffect(() => {
    setStage('order-list');
    speechService.setTestVoiceInputHandler(handleVoiceInput);

    speechService.onResult((result) => {
      if (result.final) {
        setTranscript(result.final);
        handleVoiceInput(result.final);
      } else {
        setTranscript(result.interim);
      }
    });

    speechService.onError((error) => {
      console.error('음성 인식 오류:', error);
      if (error !== 'no-speech') {
        speechService.logTestCodeInstructions();
      }
    });

    if (!speechService.isListening) {
      try {
        speechService.start(true);
        setListening(true);
      } catch (e) {
        console.log("이미 마이크가 켜져 있습니다.");
      }
    }

    return () => {
      speechService.stop();
      setListening(false);
      speechService.clearTestVoiceInputHandler();
    };
  }, [handleVoiceInput, setStage, setListening, setTranscript]);

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
            {giftCardInfo && giftCardInfo.price > 0 && (
              <div className="order-list-row order-list-row-discount">
                <span>기프티콘 할인 ({giftCardInfo.menuName})</span>
                <strong>-{giftCardInfo.price.toLocaleString()}원</strong>
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
