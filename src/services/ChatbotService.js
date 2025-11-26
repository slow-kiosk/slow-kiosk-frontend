// AI 챗봇 서비스 (GPT 기반)
class ChatbotService {
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    this.conversationHistory = [];
  }

  async sendMessage(userMessage, context = {}) {
    try {
      // 대화 히스토리에 사용자 메시지 추가
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // API 호출
      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: this.conversationHistory.slice(-10), // 최근 10개만 전송
          context: {
            currentOrder: context.currentOrder || [],
            availableMenus: context.availableMenus || [],
            stage: context.stage || 'ordering', // ordering, discount, payment
            ...context
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.ok}`);
      }

      const data = await response.json();
      
      // 응답을 대화 히스토리에 추가
      if (data.message) {
        this.conversationHistory.push({
          role: 'assistant',
          content: data.message
        });
      }

      return {
        message: data.message || '죄송합니다. 응답을 생성할 수 없습니다.',
        suggestions: data.suggestions || [],
        action: data.action || null, // 예: 'add_to_cart', 'proceed_to_payment' 등
        metadata: data.metadata || {}
      };
    } catch (error) {
      console.error('챗봇 API 오류:', error);
      
      // 오프라인 모드: 간단한 규칙 기반 응답
      return this.getFallbackResponse(userMessage, context);
    }
  }

  getFallbackResponse(userMessage, context) {
    const message = userMessage.toLowerCase();
    const currentOrder = context.currentOrder || [];
    
    // 간단한 키워드 매칭
    if (message.includes('안녕') || message.includes('시작')) {
      return {
        message: '안녕하세요! 느린 키오스크입니다. 원하시는 메뉴를 말씀해주세요.',
        suggestions: ['치즈버거', '카페라떼', '카푸치노'],
        action: null
      };
    }
    
    if (message.includes('주문') || message.includes('완료')) {
      if (currentOrder.length === 0) {
        return {
          message: '주문하실 메뉴를 먼저 말씀해주세요.',
          suggestions: ['아메리카노', '카페라떼'],
          action: null
        };
      }
      return {
        message: `현재 ${currentOrder.length}개의 메뉴가 주문되었습니다. 결제로 진행하시겠습니까?`,
        suggestions: ['결제하기', '더 주문하기'],
        action: 'proceed_to_payment'
      };
    }
    
    if (message.includes('추가') || message.includes('더')) {
      return {
        message: '추가로 주문하실 메뉴를 말씀해주세요.',
        suggestions: ['아메리카노', '카페라떼', '카푸치노'],
        action: null
      };
    }
    
    // 기본 응답
    return {
      message: '이해하지 못했습니다. 다시 말씀해주시거나 화면의 버튼을 눌러주세요.',
      suggestions: ['메뉴 보기', '주문 확인'],
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

// 싱글톤 인스턴스
const chatbotService = new ChatbotService();

export default chatbotService;


