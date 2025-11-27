// 음성 인식 및 합성 서비스
class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.shouldContinueListening = false;
    this.permissionDenied = false; // 마이크 권한 거부 여부
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.currentTranscript = '';
    this.sendToBackend = false; // 백엔드 전송 여부
    this.apiService = null; // API 서비스 인스턴스
    this.testVoiceInputHandler = null; // 개발자 콘솔 테스트용 핸들러

    // TTS 관련 변수
    this.voices = [];
    this.isReady = false;
    this.retryCount = 0; // 재시도 횟수 제한용

    // 목소리 로드 리스너
    if (this.synthesis && this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
    
    // 초기화
    this.loadVoices();
    this.initRecognition();
  }

  loadVoices() {
    if (!this.synthesis) return;
    const allVoices = this.synthesis.getVoices();
    if (allVoices.length > 0) {
      this.voices = allVoices.filter(voice => voice.lang.includes('ko'));
      this.isReady = true;
    }
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
        // 권한 거부가 발생한 경우 자동 재시작 중단
        if (event.error === 'not-allowed') {
          this.permissionDenied = true;
          this.shouldContinueListening = false;
          this.isListening = false;
          // 테스트 코드 사용 안내 출력
          this.logTestCodeInstructions();
        }
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };
      
      this.recognition.onend = () => {
        console.log('음성 인식이 종료되었습니다.');
        this.isListening = false;
        // 의도적으로 끈 게 아니라면(shouldContinueListening === true), 다시 켭니다.
        if (this.shouldContinueListening && !this.permissionDenied) {
          console.log('음성 인식을 재시작합니다...');
          try {
            this.recognition.start();
            this.isListening = true;
          } catch (e) {
            console.error('재시작 실패:', e);
          }
        }
      };
    } else {
      console.warn('Speech Recognition API를 지원하지 않는 브라우저입니다.');
      // 테스트 코드 사용 안내 출력
      this.logTestCodeInstructions();
    }
  }

  start(shouldContinue = true) {
    if (!this.recognition) {
      console.error('음성 인식이 지원되지 않습니다.');
      // 테스트 코드 사용 안내 출력
      this.logTestCodeInstructions();
      return;
    }

    // 이미 켜져 있으면 무시
    if (this.isListening) {
      return;
    }

    // 이전에 권한이 거부된 상태라면, 불필요한 재요청을 막기 위해 바로 종료
    if (this.permissionDenied) {
      console.warn('마이크 권한이 거부된 상태입니다. 브라우저 설정에서 권한을 다시 허용해주세요.');
      // 테스트 코드 사용 안내 출력
      this.logTestCodeInstructions();
      if (this.onErrorCallback) {
        this.onErrorCallback('not-allowed');
      }
      return;
    }
    
    // TTS가 말하고 있다면 TTS가 끝날 때까지 대기 (중단하지 않음)
    if (this.synthesis && (this.synthesis.speaking || this.synthesis.pending)) {
        // TTS가 끝날 때까지 대기 후 마이크 시작
        const checkAndStart = () => {
          if (this.synthesis.speaking || this.synthesis.pending) {
            setTimeout(checkAndStart, 100);
          } else {
            // TTS가 끝났으므로 마이크 시작
            this._doStart(shouldContinue);
          }
        };
        checkAndStart();
        return;
    }
    
    this._doStart(shouldContinue);
  }

  _doStart(shouldContinue = true) {
    this.shouldContinueListening = shouldContinue; // 재시작 허용 플래그 켜기
    
    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      // 이미 시작된 상태이거나 권한 관련 오류 처리
      if (error.name === 'NotAllowedError' || error.error === 'not-allowed') {
        this.permissionDenied = true;
        this.shouldContinueListening = false;
        this.isListening = false;
        // 테스트 코드 사용 안내 출력
        this.logTestCodeInstructions();
        if (this.onErrorCallback) {
          this.onErrorCallback('not-allowed');
        }
      } else if (error.name !== 'InvalidStateError') {
        console.error('음성 인식 시작 실패:', error);
        // 테스트 코드 사용 안내 출력
        this.logTestCodeInstructions();
      }
      // 이미 시작된 상태라면 오류 무시
      console.warn('마이크 시작 시도 중 오류:', error);
      this.isListening = false;
    }
  }

  stop() {
    if (this.recognition) {
      this.shouldContinueListening = false; // 재시작 플래그 끄기 (진짜 종료)
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

  // 개발자 콘솔 테스트용 핸들러 등록
  setTestVoiceInputHandler(handler) {
    this.testVoiceInputHandler = handler;
  }

  // 개발자 콘솔 테스트용 핸들러 제거
  clearTestVoiceInputHandler() {
    this.testVoiceInputHandler = null;
  }

  // 테스트 코드 사용 안내 로그 출력
  logTestCodeInstructions() {

    console.log('%c[음성 입력 테스트 코드 사용 안내]', 'color: #FF9800; font-weight: bold;');
    console.log('음성 입력이 작동하지 않는 경우, 개발자 콘솔에서 다음 명령어로 테스트할 수 있습니다:');
    console.log('testVoiceInput("입력할 텍스트")', 'color: #4CAF50; font-weight: bold;');
  }

  speak(text, options = {}) {
    // 음성 출력 내용을 콘솔에 로깅
    console.log('[음성 출력]', text);
    
    if (!this.synthesis) {
      console.error('음성 합성이 지원되지 않습니다.');
      // TTS 미지원 시 바로 종료 처리하여 마이크 켜지도록 유도
      if (options.onEnd) options.onEnd();
      return;
    }

    // [수정] 무한 대기 방지: 목소리 로딩 재시도 10회(1초)로 제한
    if ((!this.isReady || this.voices.length === 0) && this.retryCount < 10) {
      this.loadVoices(); 
      if (this.voices.length === 0) {
          this.retryCount++;
          setTimeout(() => this.speak(text, options), 100);
          return;
      }
    }

    // 재시도 횟수 초기화
    this.retryCount = 0;

    // 기존 음성이 재생 중이면 대기 후 재생 (중단하지 않음)
    if (this.synthesis.speaking || this.synthesis.pending) {
        // 현재 재생 중인 음성이 끝날 때까지 대기
        const checkAndSpeak = () => {
          if (this.synthesis.speaking || this.synthesis.pending) {
            setTimeout(checkAndSpeak, 100);
          } else {
            // 이전 음성이 끝났으므로 새 음성 재생
            this._doSpeak(text, options);
          }
        };
        checkAndSpeak();
        return;
    }
    
    this._doSpeak(text, options);
  }

  _doSpeak(text, options = {}) {

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 목소리 설정 (없으면 시스템 기본값 사용)
    const korVoice = this.voices.find(v => v.name.includes('Google') && v.lang.includes('ko')) 
                  || this.voices.find(v => v.lang.includes('ko')) 
                  || this.voices[0];

    if (korVoice) {
        utterance.voice = korVoice;
    }

    utterance.lang = 'ko-KR';
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    // [중요] 말하기가 끝나면 onEnd 실행 -> 여기서 보통 this.start()가 호출됨
    utterance.onend = () => {
      if (options.onEnd) {
        options.onEnd();
      }
    };

    utterance.onerror = (event) => {
      // "interrupted"와 "canceled"는 의도된 중단이므로 정상 동작으로 처리
      if (event.error === 'canceled' || event.error === 'interrupted') {
          // 의도된 취소/중단이므로 로그만 남기고 정상 처리
          console.log('[음성 출력] 중단됨:', text, `(${event.error})`);
          // 중단된 경우에도 흐름이 끊기지 않게 onEnd 호출
          if (options.onEnd) options.onEnd();
      } else {
        // 실제 오류만 에러로 로깅
        console.error('[음성 합성 오류]', event.error, '- 원본 텍스트:', text);
        this.synthesis.cancel();
        // 에러 발생 시에도 흐름이 끊기지 않게 onEnd 호출
        if (options.onEnd) options.onEnd();
      }
      
      if (options.onError) {
        options.onError(event.error);
      }
    };

    try {
        this.synthesis.speak(utterance);
    } catch (e) {
        console.error("Speak 호출 실패", e);
        // 실패 시 바로 onEnd를 호출하여 마이크라도 켜지게 함
        if (options.onEnd) options.onEnd();
    }
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

// 개발자 콘솔에서 음성 입력을 테스트하기 위한 전역 함수
// 사용법: window.testVoiceInput('메뉴 이름') 또는 testVoiceInput('메뉴 이름')
if (typeof window !== 'undefined') {
  window.testVoiceInput = (text) => {
    if (!text) {
      console.warn('사용법: testVoiceInput("입력할 텍스트")');
      console.log('예시: testVoiceInput("스테디 와퍼")');
      return;
    }
    
    console.log('[테스트 음성 입력]', text);
    
    // 현재 등록된 음성 입력 핸들러가 있으면 호출
    if (speechService.testVoiceInputHandler) {
      speechService.testVoiceInputHandler(text);
    } else {
      console.warn('현재 활성화된 음성 입력 핸들러가 없습니다. 주문 화면으로 이동해주세요.');
    }
  };
  
  // 도움말 출력
  console.log('%c[음성 테스트 도움말]', 'color: #4CAF50; font-weight: bold;');
  console.log('개발자 콘솔에서 다음 명령어로 음성 입력을 테스트할 수 있습니다:');
  console.log('  testVoiceInput("메뉴 이름")');
  console.log('  예: testVoiceInput("스테디 와퍼")');
}

export default speechService;

