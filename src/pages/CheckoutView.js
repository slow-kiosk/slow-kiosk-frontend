// 최종 결제 화면
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../contexts/OrderContext';
import speechService from '../services/SpeechService';
import '../styles/CheckoutView.css';
import '../components/Button.css';

const CheckoutView = () => {
  const navigate = useNavigate();
  const {
    orderItems,
    totalPrice,
    discount,
    finalPrice,
    setCoupon,
    setGiftCard,
    applyDiscount,
    setStage,
    addChatMessage,
    chatHistory,
    setListening,
    setTranscript
  } = useOrder();

  const [couponCode, setCouponCode] = useState('');
  const [giftCardCode, setGiftCardCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const hasInitialized = useRef(false);

  const handleVoiceInput = useCallback(async (text) => {
    if (isProcessing || !text.trim()) return;
    
    setIsProcessing(true);
    
    const userMessage = {
      role: 'user',
      content: text
    };
    addChatMessage(userMessage);

    // 쿠폰/기프티콘 키워드 확인
    if (text.includes('쿠폰') || text.includes('할인')) {
      const message = {
        role: 'assistant',
        content: '쿠폰 번호를 말씀해주시거나 입력해주세요.',
        suggestions: []
      };
      addChatMessage(message);
      speechService.speak(message.content);
    } else if (text.includes('기프티콘') || text.includes('기프트')) {
      const message = {
        role: 'assistant',
        content: '기프티콘 번호를 말씀해주시거나 입력해주세요.',
        suggestions: []
      };
      addChatMessage(message);
      speechService.speak(message.content);
    } else if (text.includes('결제') || text.includes('다음')) {
      navigate('/payment');
      return;
    } else if (/^[A-Z0-9]{4,}$/i.test(text.trim())) {
      // 코드 형식으로 보이는 경우
      handleApplyCode(text.trim());
    }
    
    setIsProcessing(false);
  }, [isProcessing, orderItems, totalPrice, finalPrice, setCoupon, setGiftCard, applyDiscount, addChatMessage, navigate]);

  useEffect(() => {
    setStage('discount');
    
    if (orderItems.length === 0) {
      navigate('/ordering');
      return;
    }

    // 초기 안내
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const welcomeMessage = {
        role: 'assistant',
        content: `주문 금액은 ${totalPrice.toLocaleString()}원입니다. 쿠폰이나 기프티콘이 있으시면 말씀해주세요. 없으시면 '결제하기'라고 말씀해주세요.`,
        suggestions: ['쿠폰 사용', '기프티콘 사용', '결제하기']
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
  }, [orderItems, totalPrice, setStage, addChatMessage, setListening, setTranscript, navigate, handleVoiceInput]);

  const handleApplyCode = async (code) => {
    // 쿠폰/기프티콘 검증 (실제로는 API 호출)
    try {
      // 예시: 간단한 검증 로직
      if (code.startsWith('COUPON') || code.length === 6) {
        setCoupon(code);
        const discountAmount = Math.floor(totalPrice * 0.1); // 10% 할인 예시
        applyDiscount(discountAmount);
        
        const message = {
          role: 'assistant',
          content: `쿠폰이 적용되었습니다. ${discountAmount.toLocaleString()}원 할인되었습니다. 최종 금액은 ${finalPrice.toLocaleString()}원입니다.`,
          suggestions: ['결제하기']
        };
        addChatMessage(message);
        speechService.speak(message.content);
      } else if (code.startsWith('GIFT') || code.length === 8) {
        setGiftCard(code);
        const message = {
          role: 'assistant',
          content: '기프티콘이 적용되었습니다. 결제로 진행하시겠습니까?',
          suggestions: ['결제하기']
        };
        addChatMessage(message);
        speechService.speak(message.content);
      } else {
        const message = {
          role: 'assistant',
          content: '유효하지 않은 코드입니다. 다시 확인해주세요.',
          suggestions: ['쿠폰 사용', '기프티콘 사용', '결제하기']
        };
        addChatMessage(message);
        speechService.speak(message.content);
      }
    } catch (error) {
      console.error('코드 적용 오류:', error);
    }
  };

  const handleCouponSubmit = (e) => {
    e.preventDefault();
    if (couponCode.trim()) {
      handleApplyCode(couponCode.trim());
      setCouponCode('');
    }
  };

  const handleGiftCardSubmit = (e) => {
    e.preventDefault();
    if (giftCardCode.trim()) {
      handleApplyCode(giftCardCode.trim());
      setGiftCardCode('');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleVoiceInput(suggestion);
  };

  const handleProceed = () => {
    navigate('/payment');
  };

  return (
    <div className="discount-view">
      <div className="discount-container">
        <div className="discount-left">
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
                <span>최종 금액</span>
                <span>{finalPrice.toLocaleString()}원</span>
              </div>
              <button className="proceed-button" onClick={handleProceed}>
              결제하기
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CheckoutView;
