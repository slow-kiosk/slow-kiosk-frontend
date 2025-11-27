// 결제 수단 선택 페이지 - 포장 및 매장 식사 여부, 결제 수단 선택(카드, 모바일, 기프티콘)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../contexts/OrderContext';
import speechService from '../services/SpeechService';
import '../styles/PaymentView.css';
import '../components/Text.css';
import '../components/Button.css';

// 멘트 상수화 (유지보수를 위해 분리)
const GUIDE_MESSAGES = {
  initial: '식사를 매장에서 드시고 가시나요? 아니면 포장해 드릴까요?',
  requireService: '먼저 매장에서 드실지, 포장하실지 말씀해 주세요.',
  serviceSelected: (type) => `네, ${type}으로 준비해 드릴게요. 결제는 어떤 걸로 하시겠어요?`,
  
  // 결제 수단별 상세 안내
  payMethodCard: '신용카드를 선택하셨군요. 아래 카드 투입구에 카드를 끝까지 꽂아주세요.',
  payMethodMobile: '모바일 결제를 선택하셨군요. 메뉴 선택 후 결제 화면에서 결제 버튼을 눌러주세요.',
  payMethodGift: '기프티콘을 선택하셨군요. 가지고 계신 쿠폰 바코드를 아래 스캐너에 비춰주세요.',
  
  // 에러 및 재확인
  requirePayment: '결제하실 방법을 먼저 골라주세요.',
  complete: '네, 결제 수단이 확인되었습니다. 주문 내역을 마지막으로 보여드릴게요.',
  retry: '잘 못 들었어요. 카드, 휴대폰, 기프티콘 중에 하나를 말씀해 주세요.'
};

const SERVICE_NAMES = {
  dineIn: '매장 식사',
  takeout: '포장'
};

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

  // 서비스 타입 선택 (포장 vs 매장)
  const handleServiceTypeSelect = useCallback((type) => {
    setServiceType(type);
    setPaymentMethod(null); // 서비스 변경 시 결제 수단 초기화

    // 변경된 멘트: 단순 선택 확인이 아닌 다음 행동(결제 선택) 유도
    speechService.speak(GUIDE_MESSAGES.serviceSelected(SERVICE_NAMES[type]));
  }, [setServiceType, setPaymentMethod]);

  // 결제 수단 선택
  const handlePaymentMethodSelect = useCallback((method) => {
    if (!serviceType) {
      speechService.speak(GUIDE_MESSAGES.requireService);
      return;
    }

    setPaymentMethod(method);

    // 변경된 로직: 불필요한 질문("등록하시겠습니까?")을 없애고, 바로 행동(꽂아주세요/대주세요)을 안내
    let instructionMessage = '';
    
    switch(method) {
      case 'card':
        instructionMessage = GUIDE_MESSAGES.payMethodCard;
        break;
      case 'mobile':
        instructionMessage = GUIDE_MESSAGES.payMethodMobile;
        break;
      case 'giftcard':
        instructionMessage = GUIDE_MESSAGES.payMethodGift;
        break;
      default:
        instructionMessage = '결제 수단이 선택되었습니다.';
    }

    speechService.speak(instructionMessage);
  }, [serviceType, setPaymentMethod]);

  // 결제 수단 확정 및 다음 페이지 이동
  const handlePaymentMethodAdded = useCallback(() => { 
    if (!serviceType) {
      speechService.speak(GUIDE_MESSAGES.requireService);
      return;
    }

    if (!paymentMethod) {
      speechService.speak(GUIDE_MESSAGES.requirePayment);
      return;
    }

    setIsProcessing(true);

    // 결제 처리 시뮬레이션
    setTimeout(() => {
      setIsCompleted(true);
      setIsProcessing(false);

      // 변경된 멘트: 더 자연스러운 연결
      speechService.speak(GUIDE_MESSAGES.complete);

      setTimeout(() => {
        navigate('/checkout');
      }, 1500); // 멘트를 들을 시간 확보 후 이동
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
      else if (text.includes('카드') || text.includes('신용')) { 
        handlePaymentMethodSelect('card');
      } else if (text.includes('모바일') || text.includes('삼성') || text.includes('애플') || text.includes('폰')) { 
        // 어르신들은 '모바일' 대신 '삼성페이', '핸드폰' 등으로 말할 수 있음
        handlePaymentMethodSelect('mobile');
      } else if (text.includes('기프티콘') || text.includes('쿠폰') || text.includes('바코드')) { 
        handlePaymentMethodSelect('giftcard');
      } 
      // "결제해줘", "다 했어" 등의 명령 -> 상황에 따라 다음 단계로
      else if ((text.includes('결제') || text.includes('완료') || text.includes('좋아')) && paymentMethod && serviceType) {
        handlePaymentMethodAdded();
      } 
      // 인식 실패 안내
      else {
        speechService.speak(GUIDE_MESSAGES.retry);
      }

      setIsProcessing(false);
    },
    [paymentMethod, serviceType, handleServiceTypeSelect, handlePaymentMethodSelect, handlePaymentMethodAdded]
  );

  // 초기 진입 시 안내 멘트
  const introMessageSpokenRef = useRef(false);
  useEffect(() => {
    if (introMessageSpokenRef.current) return;
    
    // 이미 서비스 타입이 선택되어 들어온 경우(수정 등)와 처음 들어온 경우 구분
    const introMessage = serviceType 
      ? `현재 ${SERVICE_NAMES[serviceType]}을 선택하셨습니다. 결제 방식을 골라주세요.` 
      : GUIDE_MESSAGES.initial;
      
    speechService.speak(introMessage);
    introMessageSpokenRef.current = true;
  }, [serviceType]);

  // 음성 인식 설정 (기존 로직 유지)
  useEffect(() => {
    setStage('payment');
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

    speechService.start(true);
    setListening(true);

    return () => {
      speechService.stop();
      setListening(false);
      speechService.clearTestVoiceInputHandler();
    };
  }, [handleVoiceInput, setStage, setListening, setTranscript]);

  return (
    <div className="payment-view">
      <div className="payment-container">
        <div className="payment-header">
          <h2 className="section-title">식사 및 결제 방법</h2>
        </div>

        <div className="service-type-section">
          <h3 className="section-subtitle">식사를 어떻게 하시겠어요?</h3>
          <div className="service-buttons">
            <button
              className={`service-button ${serviceType === 'takeout' ? 'selected' : ''}`}
              onClick={() => handleServiceTypeSelect('takeout')}
              disabled={isCompleted}
            >
              🥡 포장할래요
            </button>
            <button
              className={`service-button ${serviceType === 'dineIn' ? 'selected' : ''}`}
              onClick={() => handleServiceTypeSelect('dineIn')}
              disabled={isCompleted}
            >
              🍽️ 먹고 갈래요
            </button>
          </div>
          {!serviceType && (
            <p className="service-helper">버튼을 누르거나 "포장", "매장"이라고 말씀해 주세요.</p>
          )}
          {serviceType && (
            <p className="service-summary">
              {serviceType === 'takeout' ? '포장을 선택하셨습니다.' : '매장 식사를 선택하셨습니다.'}
            </p>
          )}
        </div>

        <div className="payment-methods">
        <div className="service-type-section">
          <h3 className="section-subtitle">결제는 무엇으로 하시나요?</h3>
          <div className="method-buttons">
            <button
              className={`method-button ${paymentMethod === 'card' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodSelect('card')}
              disabled={!serviceType || isCompleted}
            >
              <div className="method-icon">💳</div>
              <div className="method-name">신용카드</div>
            </button>

            <button
              className={`method-button ${paymentMethod === 'mobile' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodSelect('mobile')}
              disabled={!serviceType || isCompleted}
            >
              <div className="method-icon">📱</div>
              <div className="method-name">휴대폰 결제</div>
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

        {/* 결제 수단 선택 시 나타나는 확정 버튼 - 버튼 텍스트도 더 직관적으로 변경 */}
        {paymentMethod && !isCompleted && (
          <div className="payment-action">
            <button
              className="complete-payment-button"
              onClick={handlePaymentMethodAdded}
              disabled={isProcessing}
            >
              {isProcessing ? '확인하는 중입니다...' : '이걸로 결제할게요 (선택 완료)'}
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
    </div>
  );
};

export default PaymentView;