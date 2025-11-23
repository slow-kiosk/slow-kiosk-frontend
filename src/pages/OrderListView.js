// // 주문 내역
// 결제 화면
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../contexts/OrderContext';
import speechService from '../services/SpeechService';
import ChatBubble from '../components/ChatBubble';
import '../styles/PaymentView.css';

const OrderListView = () => {
  const navigate = useNavigate();
  const {
    orderItems,
    totalPrice,
    discount,
    finalPrice,
    clearOrder,
    setStage,
    addChatMessage,
    chatHistory,
    setListening,
    setTranscript
  } = useOrder();

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const hasInitialized = useRef(false);

  const handleVoiceInput = useCallback(async (text) => {
    if (isProcessing || isCompleted || !text.trim()) return;
    
    setIsProcessing(true);
    
    const userMessage = {
      role: 'user',
      content: text
    };
    addChatMessage(userMessage);

    // 결제 방법 선택
    if (text.includes('카드') || text.includes('신용카드')) {
      handlePaymentMethodSelect('card');
    } else if (text.includes('현금')) {
      handlePaymentMethodSelect('cash');
    } else if (text.includes('모바일') || text.includes('스마트폰')) {
      handlePaymentMethodSelect('mobile');
    } else if (text.includes('결제') && paymentMethod) {
      handlePaymentComplete();
    } else {
      const message = {
        role: 'assistant',
        content: '결제 방법을 선택해주세요. 카드, 현금, 모바일 중 하나를 말씀해주세요.',
        suggestions: ['카드 결제', '현금 결제', '모바일 결제']
      };
      addChatMessage(message);
      speechService.speak(message.content);
    }
    
    setIsProcessing(false);
  }, [isProcessing, isCompleted, paymentMethod, addChatMessage, clearOrder, navigate]);

  useEffect(() => {
    setStage('payment');
    
    if (orderItems.length === 0) {
      navigate('/ordering');
      return;
    }

    // 초기 안내
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const welcomeMessage = {
        role: 'assistant',
        content: `결제 금액은 ${finalPrice.toLocaleString()}원입니다. 결제 방법을 선택해주세요.`,
        suggestions: ['카드 결제', '현금 결제', '모바일 결제']
      };
      addChatMessage(welcomeMessage);
      speechService.speak(welcomeMessage.content);
    }

    // 음성 인식 설정
    speechService.onResult((result) => {
      if (result.final) {
        setTranscript(result.final);
        handleVoiceInput(result.final);
      } else {
        setTranscript(result.interim);
      }
    });

    speechService.start(true);
    setListening(true);

    return () => {
      speechService.stop();
      setListening(false);
    };
  }, [orderItems, finalPrice, setStage, addChatMessage, setListening, setTranscript, navigate, handleVoiceInput]);

  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    const methodNames = {
      card: '카드',
      cash: '현금',
      mobile: '모바일'
    };
    
    const message = {
      role: 'assistant',
      content: `${methodNames[method]} 결제를 선택하셨습니다. 결제를 진행하시겠습니까?`,
      suggestions: ['결제하기', '취소']
    };
    addChatMessage(message);
    speechService.speak(message.content);
  };

  const handlePaymentComplete = async () => {
    setIsProcessing(true);
    
    // 결제 처리 시뮬레이션
    setTimeout(() => {
      setIsCompleted(true);
      setIsProcessing(false);
      
      const message = {
        role: 'assistant',
        content: '결제가 완료되었습니다! 주문해주셔서 감사합니다. 잠시 후 주문이 준비됩니다.',
        suggestions: []
      };
      addChatMessage(message);
      speechService.speak(message.content);
      
      // 5초 후 주문 초기화 및 메인으로 이동
      setTimeout(() => {
        clearOrder();
        navigate('/kiosk');
      }, 5000);
    }, 2000);
  };

  const handleSuggestionClick = (suggestion) => {
    handleVoiceInput(suggestion);
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
                  <span className="item-price">{(item.price * (item.quantity || 1)).toLocaleString()}원</span>
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
          </div>
        </div>

        <div className="payment-right">
          <div className="chat-section">
            <h2 className="section-title">결제</h2>
            <div className="chat-container">
              {chatHistory.map((msg, index) => (
                <ChatBubble
                  key={index}
                  message={msg.content}
                  isUser={msg.role === 'user'}
                  suggestions={msg.suggestions || []}
                  onSuggestionClick={handleSuggestionClick}
                />
              ))}
              {isProcessing && (
                <div className="processing-indicator">
                  <div className="spinner"></div>
                  <span>처리 중...</span>
                </div>
              )}
              {isCompleted && (
                <div className="success-message">
                  <div className="success-icon">✓</div>
                  <p>결제 완료!</p>
                </div>
              )}
            </div>
          </div>

          <div className="payment-methods">
            <h3 className="methods-title">결제 방법 선택</h3>
            <div className="method-buttons">
              <button
                className={`method-button ${paymentMethod === 'card' ? 'selected' : ''}`}
                onClick={() => handlePaymentMethodSelect('card')}
                disabled={isCompleted}
              >
                <div className="method-icon">💳</div>
                <div className="method-name">카드</div>
              </button>
              <button
                className={`method-button ${paymentMethod === 'cash' ? 'selected' : ''}`}
                onClick={() => handlePaymentMethodSelect('cash')}
                disabled={isCompleted}
              >
                <div className="method-icon">💵</div>
                <div className="method-name">현금</div>
              </button>
              <button
                className={`method-button ${paymentMethod === 'mobile' ? 'selected' : ''}`}
                onClick={() => handlePaymentMethodSelect('mobile')}
                disabled={isCompleted}
              >
                <div className="method-icon">📱</div>
                <div className="method-name">모바일</div>
              </button>
            </div>
          </div>

          {paymentMethod && !isCompleted && (
            <button
              className="complete-payment-button"
              onClick={handlePaymentComplete}
              disabled={isProcessing}
            >
              결제하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderListView;



// import { useCallback, useEffect, useRef, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import MenuVisualization from '../components/MenuVisualization';
// import { useOrder } from '../contexts/OrderContext';
// import { findMenuByName, allMenus } from '../data/menus';
// import '../styles/OrderListView.css';
// import '../components/Text.css';
// import '../components/Button.css';

// const OrderListView = () => {
//   const navigate = useNavigate();
//   const {
//     orderItems,
//     addItem,
//     addChatMessage,
//     setListening,
//     removeItem
//   } = useOrder();

//   const [isProcessing, setIsProcessing] = useState(false);
//   const hasInitialized = useRef(false);

//   const handleVoiceInput = useCallback(
//     async (text) => {
//       if (isProcessing || !text.trim()) return;
//       setIsProcessing(true);

//       try {
//         const menu = findMenuByName(text);

//         if (menu) {
//           // 메뉴 추가
//           addItem({ ...menu, quantity: 1 });

//         }
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setIsProcessing(false);
//       }
//     },
//     [isProcessing, addItem, addChatMessage]
//   );

//   // 음성 인식 시작/종료
//   useEffect(() => {
//     if (!hasInitialized.current) {
//       setListening(true);
//       hasInitialized.current = true;
//     }

//     return () => setListening(false);
//   }, [setListening]);

//   const handleSuggestionClick = (suggestion) => {
//     handleVoiceInput(suggestion);
//   };

//   const handleRemoveItem = (index) => {
//     removeItem(index);
//     addChatMessage({
//       role: 'assistant',
//       content: '주문에서 제거했습니다.',
//       suggestions: []
//     });
//   };

//   const handleCompleteOrder = () => {
//     navigate('/ordering');
//   };

//   return (
//     <div className="order-list-view">
//       <div className="ordering-right">
//         <MenuVisualization orderItems={orderItems} />

//         <div className="action-buttons">
//           <button
//             className="action-button remove-button"
//             onClick={() => {
//               if (orderItems.length > 0)
//                 handleRemoveItem(orderItems.length - 1);
//             }}
//             disabled={orderItems.length === 0}
//           >
//             마지막 항목 제거
//           </button>

//           <button
//             className="action-button complete-button"
//             onClick={handleCompleteOrder}
//             disabled={orderItems.length === 0}
//           >
//             주문 내역 확인 완료
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OrderListView;