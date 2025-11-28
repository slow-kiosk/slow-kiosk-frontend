// 최종 결제 화면
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../contexts/OrderContext';
import speechService from '../services/SpeechService';
import '../styles/CheckoutView.css';
import '../components/Button.css';

// 결제 완료 이후 로직 추가 필요
// 결제하기 라고 말하면 결제가 진행되어야 함
// 기프티콘 결제 시 차액은 카드, 모바일 결제 중 선택해서 결제가 가능하도록
const LOADING_GIF_FILES = ['Loading01.gif', 'Loading02.gif', 'Loading03.gif'];

const CheckoutView = () => {
  const navigate = useNavigate();
  const {
    orderItems,
    totalPrice,
    discount,
    finalPrice,
    giftCardInfo,
    setGiftCard,
    setStage,
    addChatMessage,
    setListening,
    setTranscript,
    paymentMethod,
    setPaymentMethod,
    clearOrder
  } = useOrder();

  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [isPaymentAnimating, setIsPaymentAnimating] = useState(false);
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);
  const [paymentAnimationPhase, setPaymentAnimationPhase] = useState('idle');
  const [paymentAnimationText, setPaymentAnimationText] = useState('');
  const [paymentAnimationSubText, setPaymentAnimationSubText] = useState('');
  const [showTicketNumber, setShowTicketNumber] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [showPreparationNotice, setShowPreparationNotice] = useState(false);
  const [preparationMainText, setPreparationMainText] = useState('');
  const [preparationSubText, setPreparationSubText] = useState('');
  const [preparationGuideText, setPreparationGuideText] = useState('');
  const [preparationGifSrc, setPreparationGifSrc] = useState('');
  const paymentAnimationTimers = useRef([]);
  const hasInitialized = useRef(false);
  const isPaymentCompleted = useRef(false); // 결제 완료 상태 추적

  const handleApplyCode = useCallback(async (code) => {
    try {
      if (code.startsWith('GIFT') || code.length === 8) {
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
          suggestions: ['기프티콘 사용', '결제하기']
        };
        addChatMessage(message);
        speechService.speak(message.content);
      }
    } catch (error) {
      console.error('코드 적용 오류:', error);
    }
  }, [setGiftCard, addChatMessage]);

  const handleVoiceInput = useCallback(async (text) => {
    if (isVoiceProcessing || !text.trim()) return;
    
    setIsVoiceProcessing(true);
    
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
    
    setIsVoiceProcessing(false);
  }, [isVoiceProcessing, addChatMessage, navigate, handleApplyCode]);

  useEffect(() => {
    return () => {
      paymentAnimationTimers.current.forEach((timer) => clearTimeout(timer));
      paymentAnimationTimers.current = [];
    };
  }, []);

  useEffect(() => {
    setStage('discount');
    
    // 개발자 콘솔 테스트용 핸들러 등록
    speechService.setTestVoiceInputHandler(handleVoiceInput);
    
    // 결제가 완료된 상태라면, 장바구니가 비어있어도 /ordering으로 보내지 않음
    if (isPaymentCompleted.current) {
      return;
    }

    if (orderItems.length === 0) {
      navigate('/ordering');
      return;
    }

    // 초기 안내
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const welcomeMessage = {
        role: 'assistant',
        content: `주문 금액은 ${totalPrice.toLocaleString()}원입니다.`,
        suggestions: ['결제하기']
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
      // 컴포넌트 언마운트 시 테스트 핸들러 제거
      speechService.clearTestVoiceInputHandler();
    };
  }, [orderItems, totalPrice, setStage, addChatMessage, setListening, setTranscript, navigate, handleVoiceInput]);

  const assetsBaseUrl = useMemo(() => process.env.PUBLIC_URL || '', []);

  const loadingGifOptions = useMemo(
    () => LOADING_GIF_FILES.map((file) => `${assetsBaseUrl}/assets/${file}`),
    [assetsBaseUrl]
  );

  const getRandomLoadingGif = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * loadingGifOptions.length);
    return loadingGifOptions[randomIndex];
  }, [loadingGifOptions]);

  const handleProceed = () => { // 결제하기 버튼 클릭 시 결제 진행중이라는 로딩 진행 이후 결제 완료 주문이 완료되었습니다와 함께 번호표 발급 안내 필요
    if (isPaymentAnimating) return;

    if (!paymentMethod) {
      const message = '먼저 결제 수단을 선택해주세요. 결제 수단 선택 화면으로 이동합니다.';
      speechService.speak(message);
      navigate('/payment');
      return;
    }

    setIsPaymentAnimating(true);
    setShowPaymentOverlay(true);
    setPaymentAnimationPhase('prompt');
    setShowPreparationNotice(false);
    setPreparationMainText('');
    setPreparationSubText('');
    setPreparationGuideText('');

    const isMobilePayment = paymentMethod === 'mobile';
    const isGiftCardPayment = paymentMethod === 'giftcard';
    const promptMessage = isGiftCardPayment
      ? '기프티콘을 불러오고 있습니다.'
      : isMobilePayment
        ? '삼성페이 혹은 애플페이를 인식해주세요.'
        : '카드를 단말기에 꽂아주세요.';

    setPaymentAnimationText(promptMessage);
    setPaymentAnimationSubText(
      isGiftCardPayment ? '기프티콘 사용을 준비 중입니다...' : '결제를 준비하고 있습니다...'
    );
    speechService.speak(promptMessage);

    paymentAnimationTimers.current.push(
      setTimeout(() => {
        setPaymentAnimationPhase('processing');
        setPaymentAnimationSubText(
          isGiftCardPayment ? '기프티콘을 확인하고 있습니다...' : '결제가 진행 중입니다...'
        );
      }, 1600)
    );

    paymentAnimationTimers.current.push(
      setTimeout(() => {
        setPaymentAnimationPhase('completed');
        setPaymentAnimationText('결제가 완료되었습니다.');
        setPaymentAnimationSubText('주문이 완료되었습니다. 번호표를 확인해주세요.');
        speechService.speak('주문이 완료되었습니다. 번호표를 확인해주세요.');
        
        // 임의의 번호표 생성 및 표시
        const randomTicketNumber = Math.floor(Math.random() * 900) + 100; // 100-999 사이의 번호
        setTicketNumber(randomTicketNumber.toString());
        setShowTicketNumber(true);
        
        // 4초 후 번호표 숨기기
        paymentAnimationTimers.current.push(
          setTimeout(() => {
            setShowTicketNumber(false);
            setShowPreparationNotice(true);
            setPaymentAnimationPhase('preparing');
            setPaymentAnimationText('');
            setPaymentAnimationSubText('');
            setPreparationMainText('메뉴를 준비 중입니다.');
            setPreparationSubText('조금만 기다려주시면 따뜻한 메뉴로 안내드릴게요.');
            setPreparationGuideText('번호 호출 시 수령대 앞으로 이동해 주문하신 메뉴를 수령해주세요.');
            setPreparationGifSrc(getRandomLoadingGif());
            speechService.speak('번호 안내가 모두 끝났습니다. 주문하신 메뉴를 준비 중이니 잠시만 기다려주세요. 메뉴가 완성되면 수령대에서 안내드릴게요.');
          }, 4000)
        );
      }, 3600)
    );

    paymentAnimationTimers.current.push(
      setTimeout(() => {
        setShowPaymentOverlay(false);
        setIsPaymentAnimating(false);
        setPaymentAnimationPhase('idle');
        setPaymentAnimationText('');
        setPaymentAnimationSubText('');
        setShowPreparationNotice(false);
        setPreparationMainText('');
        setPreparationSubText('');
        setPreparationGuideText('');
        
        // 주문을 비우기 전에 '결제 완료됨'으로 플래그 설정
        isPaymentCompleted.current = true; 
        
        clearOrder(); // orderItems가 0이 되어도 위 useEffect에서 무시됨
        setPaymentMethod(null);
        
        navigate('/kiosk'); 
      }, 13500)
    );
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
              {giftCardInfo && giftCardInfo.price > 0 && (
                <div className="price-row discount-row">
                  <span>기프티콘 할인 ({giftCardInfo.menuName})</span>
                  <span>-{giftCardInfo.price.toLocaleString()}원</span>
                </div>
              )}
              <div className="price-row total-row">
                <span>최종 금액</span>
                <span>{finalPrice.toLocaleString()}원</span>
              </div>
              <button
                className="proceed-button"
                onClick={handleProceed}
                disabled={isPaymentAnimating}
              >
              {isPaymentAnimating ? '결제 진행 중...' : '결제하기'}
              </button>
            </div>
          </div>
        </div>

        {showPaymentOverlay && (
          <div className={`payment-progress-overlay ${paymentAnimationPhase}`}>
            {showPreparationNotice ? (
              <div className="preparation-overlay-card">
                <img
                  src={preparationGifSrc || `${assetsBaseUrl}/assets/Loading01.gif` || `${assetsBaseUrl}/assets/Loading02.gif` || `${assetsBaseUrl}/assets/Loading03.gif`}
                  alt="메뉴 준비중 애니메이션"
                  className="preparation-gif large"
                />
                <div className="preparation-text-block">
                  <p className="preparation-main-text">{preparationMainText}</p>
                  <p className="preparation-sub-text">{preparationSubText}</p>
                  <div className="pickup-guide">
                    <p className="pickup-guide-title">메뉴 수령 안내</p>
                    <p className="pickup-guide-body">{preparationGuideText}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="payment-progress-card">
                <div className="payment-device-wrapper">
                  {paymentMethod === 'mobile' ? (
                    <div className="mobile-payment-visual">
                      {/* 모바일 결제 시 삼성페이 혹은 애플페이 인식 시 */}
                      <div className="mobile-device">
                        <div className="mobile-screen" />
                        <div className="mobile-wave wave-1" />
                        <div className="mobile-wave wave-2" />
                        <div className="mobile-wave wave-3" />
                      </div>
                      <div className="nfc-reader">
                        <div className="reader-light" />
                        <div className="reader-base" />
                      </div>
                    </div>
                  ) : paymentMethod === 'giftcard' ? (
                    <div className={`giftcard-payment-visual ${paymentAnimationPhase}`}>
                      <div className="giftcard-display">
                        <div className="giftcard-header">
                          <span className="giftcard-title">GIFT ICON</span>
                          <span className="giftcard-amount">{finalPrice.toLocaleString()}원</span>
                        </div>
                        <div className="giftcard-body">
                          <div className="giftcard-code">GIFT-{(finalPrice % 1000000).toString().padStart(6, '0')}</div>
                          <div className="giftcard-barcode" />
                        </div>
                        <div className="giftcard-ribbon" />
                      </div>
                      <div className="giftcard-scanner">
                        <div className="scanner-window">
                          <div className="scanner-line" />
                          <div className="scanner-code" />
                        </div>
                        <div className="scanner-base" />
                      </div>
                    </div>
                  ) : (
                    <div className="card-payment-visual">
                      {/* 카드 결제 시 */}
                      <div className="terminal-body">
                        <div className="terminal-screen" />
                        <div className="terminal-slot" />
                      </div>
                      <div className={`credit-card ${paymentAnimationPhase}`}>
                        <div className="card-chip" />
                        <div className="card-number" />
                        <div className="card-name" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="payment-progress-text">
                  <p className="progress-main-text">{paymentAnimationText}</p>
                  <p className={`progress-sub-text ${paymentAnimationPhase === 'completed' ? 'completed' : ''}`}>
                    {paymentAnimationSubText}
                  </p>
                  {showTicketNumber && (
                    <div className="ticket-number-display">
                      <div className="ticket-number-label">번호표</div>
                      <div className="ticket-number-value">{ticketNumber}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutView;
