// 결제 수단 선택 페이지
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../contexts/OrderContext';
import speechService from '../services/SpeechService';
import '../styles/PaymentView.css';
import '../components/Text.css';
import '../components/Button.css';

// 카드 결제 선택 시 카드를 꽂아주세요 라는 멘트가 나오도록
// 결제 수단 등록 시 너무 로딩이 길다
const PaymentView = () => {
  const navigate = useNavigate();
  const { finalPrice, clearOrder, setStage, setListening, setTranscript } = useOrder();

  // 상태 정의
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const hasInitialized = useRef(false);

  // 음성 명령 처리 함수
  const handleVoiceInput = useCallback(
    (text) => {
      if (!text) return;

      // 결제 수단 선택
      if (text.includes('카드') || text.includes('신용카드')) { // 카드
        handlePaymentMethodSelect('card');
      } else if (text.includes('모바일 삼성 / LG 페이') || text.includes('스마트폰')) { // 모바일 삼성 / LG 페이
        handlePaymentMethodSelect('mobile');
      } else if (text.includes('기프티콘')) { // 기프티콘
        handlePaymentMethodSelect('giftcard');
      } 
      // 결제하기
      else if (text.includes('결제') && paymentMethod) {
        handlePaymentMethodAdded();
      } 
      // 해당되지 않을 때
      else {
        const message = {
          role: 'assistant',
          content: '결제 방법 음성으로 알려주세요.',
          suggestions: ['카드 결제', '모바일 결제', '기프티콘 결제']
        };
        speechService.speak(message.content);
      }

      setIsProcessing(false);
    },
    [paymentMethod]
  );

  // 결제 수단 선택
  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);

    const methodNames = {
      card: '카드',
      mobile: '모바일',
      giftcard: '기프티콘'
    };

    const message = {
      role: 'assistant',
      content: `${methodNames[method]} 결제를 선택하셨습니다. 결제 수단을 등록하시겠습니까?`,
      suggestions: ['결제하기', '취소']
    };
    speechService.speak(message.content);
  };

  // 결제 완료 처리
  const handlePaymentMethodAdded = () => { // 결제 수단 등록 완료 시 주문 진행 페이지로 이동
    setIsProcessing(true);

    setTimeout(() => {
      setIsCompleted(true);
      setIsProcessing(false);

      speechService.speak('결제 수단이 등록되었습니다.'); 

      setTimeout(() => {
        clearOrder();
        navigate('/ordering');
      }, 5000);
    }, 2000);
  };

  // 초기 음성 설정
  useEffect(() => {
    setStage('payment');

    if (!hasInitialized.current) {
      hasInitialized.current = true;

      speechService.speak(
        `결제 금액은 ${finalPrice.toLocaleString()}원입니다. 결제 방법을 선택해주세요.`
      );
    }

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
  }, [finalPrice, handleVoiceInput, setStage, setListening, setTranscript, navigate]);

  return (
    <div className="payment-view">
      <div className="payment-container">
        <div className="payment-right">
          <h2 className="section-title">결제 방법 선택</h2>

          <div className="payment-methods">
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
                className={`method-button ${paymentMethod === 'mobile' ? 'selected' : ''}`}
                onClick={() => handlePaymentMethodSelect('mobile')}
                disabled={isCompleted}
              >
                <div className="method-icon">📱</div>
                <div className="method-name">모바일</div>
              </button>

              <button
                className={`method-button ${paymentMethod === 'giftcard' ? 'selected' : ''}`}
                onClick={() => handlePaymentMethodSelect('giftcard')}
                disabled={isCompleted}
              >
                <div className="method-icon">🎁</div>
                <div className="method-name">기프티콘</div>
              </button>
            </div>
          </div>

          {paymentMethod && !isCompleted && (
            <button
              className="complete-payment-button"
              onClick={handlePaymentMethodAdded}
              disabled={isProcessing}
            >
              결제 수단 등록하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentView;
