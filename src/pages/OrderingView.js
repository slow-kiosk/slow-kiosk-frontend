// 주문 진행 화면 - 음성 인식, AI 챗봇, 메뉴 시각화
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../contexts/OrderContext';
import speechService from '../services/SpeechService';
import chatbotService from '../services/ChatbotService';
import { findMenuByName, allMenus } from '../data/menus';
import ChatBubble from '../components/ChatBubble';
import '../styles/OrderingView.css';
import '../components/Text.css';
import '../components/Button.css'; 

// 주문 내역 확인 버튼 만들어서 주문 내역 확인 페이지로 이동하도록
// 주문 완료 버튼 필요
// 주문 시 상품 이미지 출력
// 결제 방법 선택 전 포장, 매장 선택 가능하게끔
const OrderingView = () => {
  const navigate = useNavigate();
  const {
    orderItems,
    addItem,
    removeItem,
    addChatMessage,
    setListening,
    setTranscript,
    setStage,
    chatHistory
  } = useOrder();

  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef(null);
  const hasInitialized = useRef(false);

  const handleOrderList = () => { // 주문 내역 확인
    setStage('order-list');
    navigate('/order-list');
  };

  // const handleCompleteOrder = () => { // 주문 완료 - 결제 페이지로 이동
  //   setStage('kiosk');
  //   navigate('/kiosk');
  // };

  const handleVoiceInput = useCallback(async (text) => {
    if (isProcessing || !text.trim()) return;
    
    setIsProcessing(true);
    
    // 사용자 메시지 추가
    const userMessage = {
      role: 'user',
      content: text
    };
    addChatMessage(userMessage);

    // 챗봇에 전달
    try {
      const response = await chatbotService.sendMessage(text, {
        currentOrder: orderItems,
        availableMenus: allMenus,
        stage: 'ordering'
      });

      // 메뉴 이름 추출 시도
      const menu = findMenuByName(text);
      if (menu) {
        addItem({
          ...menu,
          quantity: 1
        });
        
        const confirmMessage = {
          role: 'assistant',
          content: `${menu.name}를 주문 목록에 추가했습니다. 추가로 주문하시겠습니까?`,
          suggestions: ['더 주문하기', '주문 완료', '주문 확인']
        };
        addChatMessage(confirmMessage);
        speechService.speak(confirmMessage.content);
      } else {
        // 액션 처리
        if (response.action === 'proceed_to_payment') {
          setTimeout(() => {
            navigate('/checkout');
          }, 500);
        }
      }
    } catch (error) {
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, orderItems, addItem, addChatMessage, navigate]);

  useEffect(() => {
    setStage('ordering');
    
    // 초기 인사말
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const welcomeMessage = {
        role: 'assistant',
        content: '안녕하세요! 느린 키오스크입니다. 원하시는 메뉴를 말씀해주세요.',
      };
      addChatMessage(welcomeMessage);
      speechService.speak(welcomeMessage.content);
    }

    // 음성 인식 결과 처리
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
      addChatMessage({
        role: 'assistant',
        content: '음성 인식에 문제가 발생했습니다. 다시 시도해주세요.',
        suggestions: []
      });
    });

    // 음성 인식 시작
    speechService.start(true);
    setListening(true);

    return () => {
      speechService.stop();
      setListening(false);
    };
  }, [addChatMessage, setListening, setTranscript, setStage, handleVoiceInput]);

  const handleSuggestionClick = (suggestion) => {
    handleVoiceInput(suggestion);
  };

  const handleCompleteOrder = () => {
    if (orderItems.length === 0) {
      const message = {
        role: 'assistant',
        content: '주문하실 메뉴를 먼저 말씀해주세요.',
        suggestions: []
      };
      addChatMessage(message);
      speechService.speak(message.content);
      return;
    }
    navigate('/checkout');
  };

  const handleRemoveItem = (index) => {
    removeItem(index);
    const message = {
      role: 'assistant',
      content: '주문에서 제거했습니다.',
      suggestions: []
    };
    addChatMessage(message);
  };

  return (
    <div className="ordering-view">
      <div className="ordering-container">
        <div className="ordering-left">
          <div className="chat-section">
            <h2 className="section-title">메뉴 주문</h2>
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
              <div ref={chatEndRef} />
            </div>
            
            <div className="voice-status">
              <div className={`mic-indicator ${speechService.isListening ? 'active' : ''}`}>
                <span className="mic-icon">🎤</span>
                <span>{speechService.isListening ? '듣는 중...' : '음성 인식 대기'}</span>
              </div>
              {speechService.currentTranscript && (
                <div className="transcript">
                  {speechService.currentTranscript}
                </div>
              )}
            </div>

            <button 
              className="older-list-button"
              onClick={handleOrderList}
            >
              주문 내역
            </button>

            {/* 주문 완료 버튼 클릭 후 결제 페이지로 이동 (모바일 QR) */}
            <button 
              className="order-complete-button"
              onClick={handleCompleteOrder}
            >
              주문 완료
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderingView;