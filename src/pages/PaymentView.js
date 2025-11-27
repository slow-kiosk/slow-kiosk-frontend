// 결제 수단 선택 페이지 - 포장 및 매장 식사 여부, 결제 수단 선택(카드, 모바일, 기프티콘)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../contexts/OrderContext';
import speechService from '../services/SpeechService';
import '../styles/PaymentView.css';
import '../components/Text.css';
import '../components/Button.css';

// 결제 하기 음성으로 말할 경우 paymentview 페이지로 이동되는 부분 수정 필요 => checkoutview 페이지로 이동되도록
const SERVICE_NAMES = {
  dineIn: '매장 식사',
  takeout: '포장'
};

const REQUIRE_SERVICE_MESSAGE = '포장 또는 매장 식사를 먼저 선택해주세요.';

const PaymentView = () => {
  const navigate = useNavigate();
  const {
    setStage,
    setListening,
    setTranscript,
    serviceType,
    setServiceType,
    paymentMethod,
    setPaymentMethod
  } = useOrder();

  // 상태 정의
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // 서비스 타입 선택
  const handleServiceTypeSelect = useCallback((type) => {
    setServiceType(type);
    setPaymentMethod(null);

    const message = `${SERVICE_NAMES[type]}를 선택하셨습니다. 결제 방법을 선택해주세요.`;
    speechService.speak(message);
  }, [setServiceType, setPaymentMethod]);

  // 결제 수단 선택
  const handlePaymentMethodSelect = useCallback((method) => {
    if (!serviceType) {
      speechService.speak(REQUIRE_SERVICE_MESSAGE);
      return;
    }

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
    const cardInstruction = method === 'card' ? ' 카드를 하단 단말기에 꽂아주세요.' : '';
    const giftInstruction = method === 'giftcard' ? ' 기프티콘 바코드를 스캐너에 인식시켜주세요.' : '';


    speechService.speak(`${message.content}${cardInstruction}`);
    speechService.speak(`${message.content}${giftInstruction}`);
  }, [serviceType, setPaymentMethod]);

  // 결제 완료 처리
  const handlePaymentMethodAdded = useCallback(() => { // 결제 수단 등록 완료 시 주문 진행 페이지로 이동
    if (!serviceType) {
      speechService.speak(REQUIRE_SERVICE_MESSAGE);
      return;
    }

    if (!paymentMethod) {
      speechService.speak('결제 수단을 먼저 선택해주세요.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsCompleted(true);
      setIsProcessing(false);

      speechService.speak('결제 수단이 등록되었습니다. 결제 금액을 확인하는 화면으로 돌아갑니다.');

      setTimeout(() => {
        navigate('/checkout');
      }, 1000);
    }, 1500);
  }, [navigate, paymentMethod, serviceType]);

  // 음성 명령 처리 함수
  const handleVoiceInput = useCallback(
    (text) => {
      if (!text) return;

      // 포장/매장 식사 선택
      if (text.includes('포장')) {
        handleServiceTypeSelect('takeout');
      } else if (text.includes('매장') || text.includes('먹고') || text.includes('자리')) {
        handleServiceTypeSelect('dineIn');
      }
      // 결제 수단 선택
      else if (text.includes('카드') || text.includes('신용카드')) { // 카드
        handlePaymentMethodSelect('card');
      } else if (text.includes('모바일')) { // 모바일 삼성 / 애플페이
        handlePaymentMethodSelect('mobile');
      } else if (text.includes('기프티콘')) { // 기프티콘
        handlePaymentMethodSelect('giftcard');
      } 
      // 결제하기
      else if (text.includes('결제') && paymentMethod && serviceType) {
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
    [paymentMethod, serviceType, handleServiceTypeSelect, handlePaymentMethodSelect, handlePaymentMethodAdded]
  );

  const introMessageSpokenRef = useRef(false);
  useEffect(() => {
    if (introMessageSpokenRef.current) return;
    const introMessage = serviceType ? '결제 방법을 선택해주세요.' : REQUIRE_SERVICE_MESSAGE;
    speechService.speak(introMessage);
    introMessageSpokenRef.current = true;
  }, [serviceType]);

  // 초기 음성 설정
  useEffect(() => {
    setStage('payment');
    
    // 개발자 콘솔 테스트용 핸들러 등록
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
      if (error === 'no-speech') {
        // 음성이 없을 때는 무시
        return;
      }
      // 음성 입력 실패 시 테스트 코드 사용 안내
      speechService.logTestCodeInstructions();
    });

    speechService.start(true);
    setListening(true);

    return () => {
      speechService.stop();
      setListening(false);
      // 컴포넌트 언마운트 시 테스트 핸들러 제거
      speechService.clearTestVoiceInputHandler();
    };
  }, [handleVoiceInput, setStage, setListening, setTranscript, navigate]);

  return (
    <div className="payment-view">
      <div className="payment-container">
        <div className="payment-header">
          <h2 className="section-title">결제 방법 선택</h2>
        </div>

        <div className="service-type-section">
          <h3 className="section-subtitle">포장 또는 매장 식사를 선택하세요</h3>
          <div className="service-buttons">
            <button
              className={`service-button ${serviceType === 'takeout' ? 'selected' : ''}`}
              onClick={() => handleServiceTypeSelect('takeout')}
              disabled={isCompleted}
            >
              🥡 포장
            </button>
            <button
              className={`service-button ${serviceType === 'dineIn' ? 'selected' : ''}`}
              onClick={() => handleServiceTypeSelect('dineIn')}
              disabled={isCompleted}
            >
              🍽️ 매장 식사
            </button>
          </div>
          {!serviceType && (
            <p className="service-helper">{REQUIRE_SERVICE_MESSAGE}</p>
          )}
          {serviceType && (
            <p className="service-summary">
              {serviceType === 'takeout' ? '포장을 선택하셨습니다.' : '매장 식사를 선택하셨습니다.'}
            </p>
          )}
        </div>

        <div className="payment-methods">
          <div className="method-buttons">
            <button
              className={`method-button ${paymentMethod === 'card' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodSelect('card')}
              disabled={!serviceType || isCompleted}
            >
              <div className="method-icon">💳</div>
              <div className="method-name">카드</div>
            </button>

            <button
              className={`method-button ${paymentMethod === 'mobile' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodSelect('mobile')}
              disabled={!serviceType || isCompleted}
            >
              <div className="method-icon">📱</div>
              <div className="method-name">모바일</div>
            </button>

            <button
              className={`method-button ${paymentMethod === 'giftcard' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodSelect('giftcard')}
              disabled={!serviceType || isCompleted}
            >
              <div className="method-icon">🎁</div>
              <div className="method-name">기프티콘</div>
            </button>
          </div>
        </div>

        {paymentMethod && !isCompleted && (
          <div className="payment-action">
            <button
              className="complete-payment-button"
              onClick={handlePaymentMethodAdded}
              disabled={isProcessing}
            >
              {isProcessing ? '처리 중...' : '결제 수단 등록하기'}
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="payment-complete">
            <div className="complete-icon">✓</div>
            <div className="complete-message">결제 수단이 등록되었습니다.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentView;
