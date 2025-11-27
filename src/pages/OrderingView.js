// 주문 진행 화면 - 음성 인식, AI 챗봇, 메뉴 시각화
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../contexts/OrderContext';
import speechService from '../services/SpeechService';
import chatbotService from '../services/ChatbotService';
import { findMenuByName, fetchMenus } from '../data/menus';
import ChatBubble from '../components/ChatBubble';
import '../styles/OrderingView.css';
import '../components/Text.css';
import '../components/Button.css'; 

// 음성 인식 실패 시 다시 음성 요청하는 메세지 출력
// 메뉴판 이미지 및 사진 더 크게 보여주도록
// 주문 내역이라는 음성을 말하면 주문 내역 OrderListView로 이동

// 무조건 음성 응답을 반환하도록 / 챗봇 응답 출력 시 작성되는 모션 보이도록 기능 추가 필요
// 영양성분 질문 테스트 재진행 필요
// 사용자가 메뉴 요청하면 메뉴가 맞는지 확인하는 메뉴 사진 이미지 출력
const OrderingView = () => {
  const navigate = useNavigate();
  const {
    orderItems,
    addItem,
    addChatMessage,
    setListening,
    setTranscript,
    setStage,
    chatHistory
  } = useOrder();

  const [isProcessing, setIsProcessing] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [imageErrorStates, setImageErrorStates] = useState({});
  const chatEndRef = useRef(null);
  const hasInitialized = useRef(false);

  const handleOrderList = useCallback(() => { // 주문 내역 확인
    setStage('order-list');
    navigate('/order-list');
  }, [setStage, navigate]);

  const handleVoiceInput = useCallback(async (text) => {
    if (isProcessing || !text.trim()) return;
    
    setIsProcessing(true);
    
    // 사용자 메시지 추가
    const userMessage = {
      role: 'user',
      content: text
    };
    addChatMessage(userMessage);

    // "주문 내역" 음성 인식 처리
    const normalizedText = text.trim().toLowerCase();
    if (normalizedText.includes('주문 내역') || normalizedText.includes('주문내역')) {
      setIsProcessing(false);
      handleOrderList();
      return;
    }

    // 챗봇에 전달
    try {
      const response = await chatbotService.sendMessage(text, {
        currentOrder: orderItems,
        availableMenus: menus,
        stage: 'ordering'
      });

      // 메뉴 이름 추출 시도
      const menu = findMenuByName(menus, text);
      if (menu) {
        addItem({
          ...menu,
          quantity: 1
        });
        
        const confirmMessage = {
          role: 'assistant',
          content: `${menu.name}를 주문 목록에 추가했습니다. 추가로 주문하시겠습니까?`,
          suggestions: ['더 주문하기', '주문 완료', '주문 내역'],
          isTypingText: true // iMessage 스타일 타이핑 애니메이션
        };
        addChatMessage(confirmMessage);
        // 타이핑 애니메이션이 완료된 후 음성 출력
        setTimeout(() => {
          speechService.speak(confirmMessage.content);
        }, confirmMessage.content.length * 30 + 200);
      } else {
        // 챗봇 응답 처리
        if (response.message) {
          const assistantMessage = {
            role: 'assistant',
            content: response.message,
            suggestions: response.suggestions || [],
            isTypingText: true // iMessage 스타일 타이핑 애니메이션
          };
          addChatMessage(assistantMessage);
          
          // 타이핑 애니메이션이 완료된 후 음성 출력
          setTimeout(() => {
            speechService.speak(response.message);
          }, response.message.length * 30 + 200);
        }
        
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
  }, [isProcessing, orderItems, menus, addItem, addChatMessage, navigate, handleOrderList]);

  // 메뉴 데이터 가져오기
  useEffect(() => {
    const loadMenus = async () => {
      try {
        const menuData = await fetchMenus();
        setMenus(menuData);
      } catch (error) {
        console.error('메뉴 로딩 실패:', error);
      } finally {
        setLoadingMenus(false);
      }
    };
    loadMenus();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isProcessing]);

  useEffect(() => {
    setStage('ordering');
    
    // 개발자 콘솔 테스트용 핸들러 등록
    speechService.setTestVoiceInputHandler(handleVoiceInput);
    
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
      // 음성 입력 실패 시 테스트 코드 사용 안내
      speechService.logTestCodeInstructions();
    });

    // 음성 인식 시작 (안전 장치 추가)
    // 이미 듣고 있는 중(isListening)이라면 start를 호출하지 않도록 막습니다.
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
      // 컴포넌트 언마운트 시 테스트 핸들러 제거
      speechService.clearTestVoiceInputHandler();
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

  const handleMenuClick = (menu) => {
    addItem({
      ...menu,
      quantity: 1
    });
    
    const confirmMessage = {
      role: 'assistant',
      content: `${menu.name}를 주문 목록에 추가했습니다. 추가로 주문하시겠습니까?`,
      suggestions: ['더 주문하기', '주문 완료', '주문 내역'],
      isTypingText: true // iMessage 스타일 타이핑 애니메이션
    };
    addChatMessage(confirmMessage);
    // 타이핑 애니메이션이 완료된 후 음성 출력
    setTimeout(() => {
      speechService.speak(confirmMessage.content);
    }, confirmMessage.content.length * 30 + 200);
  };

  const handleImageLoad = (menuId) => {
    setImageLoadingStates(prev => ({ ...prev, [menuId]: false }));
  };

  const handleImageError = (menuId) => {
    setImageLoadingStates(prev => ({ ...prev, [menuId]: false }));
    setImageErrorStates(prev => ({ ...prev, [menuId]: true }));
  };

  const handleImageLoadStart = (menuId) => {
    setImageLoadingStates(prev => ({ ...prev, [menuId]: true }));
    setImageErrorStates(prev => ({ ...prev, [menuId]: false }));
  };

  return (
    <div className="ordering-view">
      <div className="ordering-container">
      <div className="ordering-left">
          <div className="menu-board-section">
          <h2 className="section-title">메뉴 주문</h2>
            {loadingMenus ? (
              <div className="menu-loading">
                <div className="spinner"></div>
                <span>메뉴를 불러오는 중...</span>
              </div>
            ) : (
              <div className="menu-grid">
                {menus.length === 0 ? (
                  <div className="menu-empty-state">
                    <p>메뉴를 불러올 수 없습니다.</p>
                  </div>
                ) : (
                  menus.map((menu) => {
                    const isLoading = imageLoadingStates[menu.id];
                    const hasError = imageErrorStates[menu.id];
                    const showPlaceholder = !menu.imageUrl || hasError;
                    
                    return (
                      <div
                        key={menu.id}
                        className="menu-card"
                        onClick={() => handleMenuClick(menu)}
                      >
                        <div className="menu-card-image">
                          {showPlaceholder ? (
                            <div className="menu-card-placeholder">🍽️</div>
                          ) : (
                            <>
                              {isLoading && (
                                <div className="menu-image-loading">
                                  <div className="spinner"></div>
                                </div>
                              )}
                              <img
                                src={menu.imageUrl}
                                alt={menu.name}
                                onLoadStart={() => handleImageLoadStart(menu.id)}
                                onLoad={() => handleImageLoad(menu.id)}
                                onError={() => handleImageError(menu.id)}
                                style={{ display: isLoading ? 'none' : 'block' }}
                              />
                            </>
                          )}
                        </div>
                        <div className="menu-card-info">
                          <h3 className="menu-card-name">{menu.name}</h3>
                          {menu.description && (
                            <p className="menu-card-description">{menu.description}</p>
                          )}
                          <div className="menu-card-price">
                            {menu.price?.toLocaleString()}원
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        <div className="ordering-right">
          <div className="chat-section">
            <div className="chat-container">
              {chatHistory.map((msg, index) => (
                <ChatBubble
                  key={index}
                  message={msg.content}
                  isUser={msg.role === 'user'}
                  suggestions={msg.suggestions || []}
                  onSuggestionClick={handleSuggestionClick}
                  isTypingText={msg.isTypingText || false}
                />
              ))}
              {isProcessing && (
                <ChatBubble
                  key="typing-indicator"
                  isTyping
                />
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

            <div className="button-group">
              <button 
                className="older-list-button"
                onClick={handleOrderList}
              >
                주문 내역
              </button>

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
    </div>
  );
};

export default OrderingView;