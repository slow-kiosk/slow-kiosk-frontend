// 음성 인식 및 합성 서비스
class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.currentTranscript = '';
    this.sendToBackend = false; // 백엔드 전송 여부
    this.apiService = null; // API 서비스 인스턴스
    
    this.initRecognition();
  }

  /**
   * 백엔드 전송 활성화 및 API 서비스 설정
   * @param {boolean} enable - 백엔드 전송 활성화 여부
   * @param {object} apiService - API 서비스 인스턴스 (선택사항)
   */
  enableBackendSync(enable = true, apiService = null) {
    this.sendToBackend = enable;
    if (apiService) {
      this.apiService = apiService;
    }
  }

  initRecognition() {
    // Web Speech API 지원 확인
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // 한국어 설정
      this.recognition.lang = 'ko-KR';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      
      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // 현재 전사본 업데이트
        this.currentTranscript = interimTranscript || finalTranscript;
        
        // 최종 텍스트가 있고 백엔드 전송이 활성화된 경우 백엔드로 전송
        if (finalTranscript && this.sendToBackend && this.apiService) {
          this.apiService.sendSTTText(finalTranscript, {
            source: 'web-speech-api',
            lang: 'ko-KR'
          }).catch(error => {
            console.error('백엔드 전송 실패:', error);
          });
        }
        
        if (this.onResultCallback) {
          this.onResultCallback({
            interim: interimTranscript,
            final: finalTranscript
          });
        }
      };
      
      this.recognition.onerror = (event) => {
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };
      
      this.recognition.onend = () => {
        this.isListening = false;
        // 자동 재시작 (연속 인식 모드)
        if (this.shouldContinueListening) {
          this.start();
        }
      };
    } else {
      console.warn('Speech Recognition API를 지원하지 않는 브라우저입니다.');
    }
  }

  start(shouldContinue = true) {
    if (!this.recognition) {
      console.error('음성 인식이 지원되지 않습니다.');
      return;
    }
    
    if (this.isListening) {
      return;
    }
    
    this.shouldContinueListening = shouldContinue;
    this.isListening = true;
    
    try {
      this.recognition.start();
    } catch (error) {
      console.error('음성 인식 시작 실패:', error);
      this.isListening = false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.shouldContinueListening = false;
      this.recognition.stop();
      this.isListening = false;
    }
  }

  onResult(callback) {
    this.onResultCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  speak(text, options = {}) {
    if (!this.synthesis) {
      console.error('음성 합성이 지원되지 않습니다.');
      return;
    }

    // 기존 음성 중지
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    utterance.onend = () => {
      if (options.onEnd) {
        options.onEnd();
      }
    };

    utterance.onerror = (error) => {
      console.error('음성 합성 오류:', error);
      if (options.onError) {
        options.onError(error);
      }
    };

    this.synthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  isSupported() {
    return !!(this.recognition && this.synthesis);
  }
}

// 싱글톤 인스턴스
const speechService = new SpeechService();

export default speechService;

