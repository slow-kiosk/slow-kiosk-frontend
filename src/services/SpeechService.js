// 음성 인식 및 합성 서비스
class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.shouldContinueListening = false;
    this.isPausedForTTS = false;
    this.shouldResumeAfterTTS = false;
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
    this.recentTTSOutputs = []; // 최근 TTS 출력 텍스트 목록 (자기 음성 필터링용)
    this.lastTTSEndTime = 0; // 마지막 TTS 종료 시간
    this.TTS_FILTER_DURATION = 2000; // TTS 종료 후 필터링 지속 시간 (ms)

    // 침묵 시간 지연 처리 관련 변수
    this.pendingFinalResult = null; // 대기 중인 최종 결과
    this.finalResultTimeout = null; // 최종 결과 처리 타이머
    this.SILENCE_DELAY = 500; // 침묵 시간 추가 지연 (ms) - 0.5초

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
        
        // 중간 결과(interim)가 있으면, 대기 중인 최종 결과 처리를 취소
        // (사용자가 계속 말하고 있다는 의미)
        if (interimTranscript) {
          if (this.finalResultTimeout) {
            clearTimeout(this.finalResultTimeout);
            this.finalResultTimeout = null;
            this.pendingFinalResult = null;
            console.log('[음성 인식] 중간 결과 감지 - 최종 결과 처리 취소');
          }
          
          // 중간 결과는 즉시 콜백 호출
          if (this.onResultCallback) {
            this.onResultCallback({
              interim: interimTranscript,
              final: ''
            });
          }
        }
        
        // 최종 텍스트가 있는 경우, 침묵 시간 지연 후 처리
        if (finalTranscript) {
          // 기존 대기 중인 최종 결과가 있으면 취소
          if (this.finalResultTimeout) {
            clearTimeout(this.finalResultTimeout);
          }
          
          // 최종 결과를 대기 목록에 저장
          this.pendingFinalResult = finalTranscript;
          
          // 침묵 시간 추가 지연 후 처리
          this.finalResultTimeout = setTimeout(() => {
            const resultToProcess = this.pendingFinalResult;
            this.pendingFinalResult = null;
            this.finalResultTimeout = null;
            
            if (!resultToProcess) return;
            
            // TTS 출력 필터링: 최근 TTS 출력과 유사한 텍스트는 무시
            if (this.isSimilarToRecentTTS(resultToProcess)) {
              console.log('[음성 인식 필터링] TTS 출력과 유사한 텍스트를 무시합니다:', resultToProcess);
              return; // TTS 출력으로 인식된 텍스트는 무시
            }
            
            // TTS 종료 후 일정 시간 내의 인식 결과도 필터링
            const timeSinceLastTTS = Date.now() - this.lastTTSEndTime;
            if (timeSinceLastTTS < this.TTS_FILTER_DURATION) {
              console.log('[음성 인식 필터링] TTS 종료 직후 인식 결과를 무시합니다:', resultToProcess);
              return;
            }
            
            // 최종 텍스트가 있고 백엔드 전송이 활성화된 경우 백엔드로 전송
            if (this.sendToBackend && this.apiService) {
              this.apiService.sendSTTText(resultToProcess, {
                source: 'web-speech-api',
                lang: 'ko-KR'
              }).catch(error => {
                console.error('백엔드 전송 실패:', error);
              });
            }
            
            // 최종 결과 콜백 호출
            if (this.onResultCallback) {
              this.onResultCallback({
                interim: '',
                final: resultToProcess
              });
            }
          }, this.SILENCE_DELAY);
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
        // TTS로 인해 일시 중지된 경우 자동 재시작을 건너뜁니다.
        if (this.isPausedForTTS) {
          return;
        }
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
    // 대기 중인 최종 결과 처리 취소
    if (this.finalResultTimeout) {
      clearTimeout(this.finalResultTimeout);
      this.finalResultTimeout = null;
      this.pendingFinalResult = null;
    }
  }

  pauseRecognitionForTTS() {
    if (!this.recognition) {
      return;
    }

    this.shouldResumeAfterTTS = this.shouldContinueListening;
    this.isPausedForTTS = true;

    // 대기 중인 최종 결과 처리 취소
    if (this.finalResultTimeout) {
      clearTimeout(this.finalResultTimeout);
      this.finalResultTimeout = null;
      this.pendingFinalResult = null;
    }

    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.warn('TTS 중지용 마이크 스톱 실패:', error);
      }
      this.isListening = false;
    }
  }

  resumeRecognitionAfterTTS() {
    if (!this.recognition) {
      this.isPausedForTTS = false;
      this.shouldResumeAfterTTS = false;
      return;
    }

    if (!this.isPausedForTTS) {
      return;
    }

    const shouldResume = this.shouldResumeAfterTTS && !this.permissionDenied;
    this.isPausedForTTS = false;
    this.shouldResumeAfterTTS = false;

    if (shouldResume) {
      this.start(true);
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

    // 기존 음성이 재생 중이면 중단하고 새로운 음성 재생
    if (this.synthesis.speaking || this.synthesis.pending) {
        console.log('[음성 출력] 기존 음성 중단 후 새 음성 재생');
        this.stopSpeaking();
    }
    
    this._doSpeak(text, options);
  }

  _doSpeak(text, options = {}) {

    // TTS 출력 동안 음성 인식을 일시 중지하여 자기 목소리를 인식하지 않도록 함
    this.pauseRecognitionForTTS();
    
    // TTS 출력 텍스트를 최근 목록에 추가 (자기 음성 필터링용)
    this.addRecentTTSOutput(text);

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
      // TTS 종료 시간 기록
      this.lastTTSEndTime = Date.now();
      this.resumeRecognitionAfterTTS();
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
        this.lastTTSEndTime = Date.now();
        this.resumeRecognitionAfterTTS();
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

  /**
   * 최근 TTS 출력 텍스트 목록에 추가
   * @param {string} text - TTS 출력 텍스트
   */
  addRecentTTSOutput(text) {
    if (!text || !text.trim()) return;
    
    const normalizedText = this.normalizeText(text);
    this.recentTTSOutputs.push({
      text: normalizedText,
      originalText: text,
      timestamp: Date.now()
    });
    
    // 최근 10개만 유지 (메모리 관리)
    if (this.recentTTSOutputs.length > 10) {
      this.recentTTSOutputs.shift();
    }
  }

  /**
   * 텍스트 정규화 (비교를 위해)
   * @param {string} text - 원본 텍스트
   * @returns {string} 정규화된 텍스트
   */
  normalizeText(text) {
    return text.trim()
      .replace(/\s+/g, ' ') // 연속된 공백을 하나로
      .replace(/[.,!?]/g, '') // 구두점 제거
      .toLowerCase();
  }

  /**
   * 인식된 텍스트가 최근 TTS 출력과 유사한지 확인
   * @param {string} recognizedText - 음성 인식으로 받은 텍스트
   * @returns {boolean} 유사하면 true
   */
  isSimilarToRecentTTS(recognizedText) {
    if (!recognizedText || !recognizedText.trim()) return false;
    
    const normalizedRecognized = this.normalizeText(recognizedText);
    
    // 중요한 키워드가 포함된 경우 필터링하지 않음 (사용자 의도 명확)
    const importantKeywords = [
      '매장', '포장', '먹고', '자리',
      '카드', '신용',
      '모바일', '삼성', '애플', '폰',
      '바코드', '캡쳐', '캡처',
      '기프티콘', '쿠폰', '할인',
      '결제', '완료', '좋아',
      '주문 내역', '주문내역', '주문 완료', '주문완료',
      // 메뉴 항목
      '치즈버거', '더블 치즈버거', '더블치즈버거', '더블 치즈 버거',
      '불고기버거', '불고기 버거',
      '와퍼', '스테디 와퍼', '스테디와퍼',
      '콜라', '콜라 제로', '콜라제로',
      '프렌치프라이', '프렌치 프라이', '감자튀김', '감자 튀김',
      '모짜렐라 스틱', '모짜렐라스틱', '치즈스틱',
      '샐러드', '애플파이', '애플 파이',
      '버거', '햄버거'
    ];
    
    // 중요한 키워드가 포함되어 있으면 필터링하지 않음
    for (const keyword of importantKeywords) {
      if (normalizedRecognized.includes(keyword)) {
        return false;
      }
    }
    
    // 최근 TTS 출력들과 비교
    for (const ttsOutput of this.recentTTSOutputs) {
      const similarity = this.calculateSimilarity(normalizedRecognized, ttsOutput.text);
      
      // 유사도가 70% 이상이면 TTS 출력으로 간주
      if (similarity >= 0.7) {
        return true;
      }
      
      // 부분 일치 확인 (인식된 텍스트가 TTS 출력의 일부를 포함하는 경우)
      if (ttsOutput.text.includes(normalizedRecognized) || 
          normalizedRecognized.includes(ttsOutput.text)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 두 텍스트 간의 유사도 계산 (간단한 레벤슈타인 거리 기반)
   * @param {string} text1 - 첫 번째 텍스트
   * @param {string} text2 - 두 번째 텍스트
   * @returns {number} 유사도 (0.0 ~ 1.0)
   */
  calculateSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    if (text1 === text2) return 1;
    
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    if (longer.length === 0) return 1;
    
    // 간단한 유사도 계산: 공통 문자 비율
    let commonChars = 0;
    const shorterSet = new Set(shorter);
    for (const char of longer) {
      if (shorterSet.has(char)) {
        commonChars++;
      }
    }
    
    return commonChars / longer.length;
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

