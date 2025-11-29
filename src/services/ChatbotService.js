import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// 맞춤법 틀리거나 띄어쓰기 혹은 내용 포함 시 잘 주문이 이루어지도록 혹은 메뉴가 맞는지 확인하는 기능 추가 필요
class ChatbotService {
  constructor() {
    // 백엔드 WebSocket 엔드포인트 (Spring Boot 포트 8080)
    this.socketUrl = 'http://localhost:8080/ws-kiosk';
    this.client = null;
    this.connected = false;
    
    // 보낸 요청에 대한 응답을 기다리는 Promise의 resolve 함수들을 저장할 큐
    this.pendingResolvers = []; 
    
    this.conversationHistory = [];
    
    this.connect();
  }

  connect() {
    this.client = new Client({
      // WebSocketConfig.java에 설정된 SockJS 엔드포인트 연결
      webSocketFactory: () => new SockJS(this.socketUrl),
      reconnectDelay: 5000, // 연결 끊기면 5초 뒤 재연결 시도
      onConnect: () => {
        console.log('키오스크 WebSocket 연결 성공');
        this.connected = true;

        // 1. 서버 응답 구독 (/sub/kiosk/response)
        // KioskSocketController.java: @SendTo("/sub/kiosk/response")
        this.client.subscribe('/sub/kiosk/response', (message) => {
          if (message.body) {
            const responseDto = JSON.parse(message.body);
            this.handleServerResponse(responseDto);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });

    this.client.activate();
  }

  // 서버로부터 메시지가 왔을 때 처리
  handleServerResponse(responseDto) {
    // KioskResponse.java: { newState, spokenResponse, updatedCart, uiData }
    
    // 1. 응답 메시지를 대화 히스토리에 추가
    if (responseDto.spokenResponse) {
      this.conversationHistory.push({
        role: 'assistant',
        content: responseDto.spokenResponse
      });
    }

    // 2. 프론트엔드 포맷으로 변환
    // 기존 코드와의 호환성을 위해 구조를 맞춥니다.
    const mappedResponse = {
      message: responseDto.spokenResponse || '응답이 없습니다.',
      suggestions: [], // 필요 시 서버 uiData에서 추출 가능
      action: this.mapStateToAction(responseDto.newState),
      newState: responseDto.newState, // 직접 접근 가능하도록 추가
      updatedCart: responseDto.updatedCart, // 직접 접근 가능하도록 추가
      slowMode: responseDto.slowMode || false, // slowMode 추가
      metadata: {
        nextScene: responseDto.newState,
        cart: responseDto.updatedCart
      }
    };

    // 3. 대기 중인 요청(sendMessage의 await)을 해결(resolve)
    // 순차적 처리를 가정 (FIFO)
    if (this.pendingResolvers.length > 0) {
      const resolve = this.pendingResolvers.shift();
      resolve(mappedResponse);
    }
  }

  // 백엔드의 상태(State)를 프론트엔드의 액션(Action)으로 매핑
  mapStateToAction(newState) {
    if (newState === 'ORDER_COMPLETE' || newState === 'PAYMENT') {
      return 'proceed_to_payment';
    }
    // 필요에 따라 다른 상태 매핑 추가
    return null;
  }

  /**
   * 사용자 메시지 전송 (Promise 반환)
   * 기존 fetch 방식을 WebSocket publish 방식으로 대체하되,
   * 사용부(OrderingView.js)에서는 await로 결과를 받을 수 있게 유지함.
   */
  async sendMessage(userMessage, context = {}) {
    if (!this.connected || !this.client) {
      console.warn('WebSocket 연결되지 않음. 오프라인 응답 반환.');
      return this.getFallbackResponse(userMessage, context);
    }

    return new Promise((resolve, reject) => {
      try {
       // 1. 대화 히스토리 추가
        this.conversationHistory.push({
          role: 'user',
          content: userMessage
        });

        this.pendingResolvers.push(resolve);
        
        // 2. 최근 대화 내역 10개만 자르기 (데이터 절약)
        const recentHistory = this.conversationHistory.slice(-10);
        
        // 3. 서버로 전송할 데이터 구성
        const requestDto = {
          userText: userMessage,
          currentState: context.stage || 'ORDERING',
          // 대화 내역(history) 추가
          history: recentHistory 
        };

        this.client.publish({
          destination: '/pub/kiosk/message',
          body: JSON.stringify(requestDto),
        });

      } catch (error) {
        console.error('메시지 전송 실패:', error);
        // 에러 시 큐에서 제거하고 폴백 리턴
        this.pendingResolvers.pop(); 
        resolve(this.getFallbackResponse(userMessage, context));
      }
    });
  }

  getFallbackResponse(userMessage, context) {
    // 기존 오프라인 로직 유지
    const message = userMessage.toLowerCase();
    const currentOrder = context.currentOrder || [];
    
    if (message.includes('안녕') || message.includes('시작')) {
      return {
        message: '안녕하세요! 느린 키오스크입니다. 원하시는 메뉴를 말씀해주세요.',
        suggestions: ['치즈버거', '불고기버거'],
        action: null
      };
    }
    
    // ... (기타 기존 로직 생략) ...

    return {
      message: '서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
      suggestions: [],
      action: null
    };
  }

  resetConversation() {
    this.conversationHistory = [];
  }

  getHistory() {
    return this.conversationHistory;
  }
}

const chatbotService = new ChatbotService();
export default chatbotService;