// API 베이스 URL 설정
// 환경 변수 또는 기본값 사용
const getApiBaseUrl = () => {
  // 환경 변수가 있으면 사용
  if (process.env.REACT_APP_API_BASE_URL) {
    const url = process.env.REACT_APP_API_BASE_URL;
    console.log('[API] 환경 변수에서 API URL 사용:', url);
    return url;
  }
  
  // 개발 환경 체크 (localhost에서 실행 중인지)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const url = 'http://localhost:8080';
    console.log('[API] 개발 환경 - localhost 사용:', url);
    return url;
  }
  
  // 프로덕션 환경에서는 slow-kiosk-team.duckdns.org 사용
  const url = 'https://slow-kiosk-team.duckdns.org';
  console.log('[API] 프로덕션 환경 - 배포 서버 사용:', url);
  return url;
};

// WebSocket URL 생성
export const getWebSocketUrl = (endpoint = '/ws-kiosk') => {
  const baseUrl = getApiBaseUrl();
  // https를 사용하는 경우 wss로 변환, http를 사용하는 경우 ws로 변환
  if (baseUrl.startsWith('https://')) {
    const wsBaseUrl = baseUrl.replace(/^https:/, 'wss:');
    return `${wsBaseUrl}${endpoint}`;
  } else {
    const wsBaseUrl = baseUrl.replace(/^http:/, 'ws:');
    return `${wsBaseUrl}${endpoint}`;
  }
};

// REST API URL 생성
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  // endpoint가 이미 전체 URL인 경우 그대로 반환
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  // endpoint가 /로 시작하지 않으면 추가
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};

// API 베이스 URL 직접 접근
export const API_BASE_URL = getApiBaseUrl();

/**
 * 백엔드 서버 연결 상태 테스트
 * @returns {Promise<{success: boolean, status: number, message: string, url: string}>}
 */
export const testBackendConnection = async () => {
  const baseUrl = getApiBaseUrl();
  const testUrl = getApiUrl('/api/menu'); // 메뉴 API로 연결 테스트
  
  console.log('='.repeat(60));
  console.log('[백엔드 연결 테스트] 시작');
  console.log('[백엔드 연결 테스트] 서버 주소:', baseUrl);
  console.log('[백엔드 연결 테스트] 테스트 URL:', testUrl);
  console.log('[백엔드 연결 테스트] 요청 시간:', new Date().toISOString());
  
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log('[백엔드 연결 테스트] 응답 상태:', response.status, response.statusText);
    console.log('[백엔드 연결 테스트] 응답 시간:', duration + 'ms');
    console.log('[백엔드 연결 테스트] 응답 헤더:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('[백엔드 연결 테스트] 연결 성공!');
      console.log('[백엔드 연결 테스트] 응답 데이터 타입:', Array.isArray(data) ? `배열 (${data.length}개)` : typeof data);
      console.log('='.repeat(60));
      
      return {
        success: true,
        status: response.status,
        message: '백엔드 서버 연결 성공',
        url: testUrl,
        duration: duration,
        dataLength: Array.isArray(data) ? data.length : null
      };
    } else {
      const errorText = await response.text();
      console.error('[백엔드 연결 테스트] 연결 실패 - HTTP 상태:', response.status);
      console.error('[백엔드 연결 테스트] 에러 응답:', errorText);
      console.log('='.repeat(60));
      
      return {
        success: false,
        status: response.status,
        message: `HTTP ${response.status}: ${response.statusText}`,
        url: testUrl,
        duration: duration,
        error: errorText
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('[백엔드 연결 테스트] 연결 실패 - 네트워크 에러');
    console.error('[백엔드 연결 테스트] 에러 타입:', error.name);
    console.error('[백엔드 연결 테스트] 에러 메시지:', error.message);
    console.error('[백엔드 연결 테스트] 에러 상세:', error);
    
    if (error.name === 'AbortError') {
      console.error('[백엔드 연결 테스트] ⏱요청 타임아웃 (10초 초과)');
    } else if (error.message.includes('CORS')) {
      console.error('[백엔드 연결 테스트] CORS 정책 위반 - 서버에서 CORS 설정 확인 필요');
    } else if (error.message.includes('Failed to fetch')) {
      console.error('[백엔드 연결 테스트] 네트워크 연결 실패 - 서버가 응답하지 않거나 도메인을 찾을 수 없음');
    }
    
    console.log('='.repeat(60));
    
    return {
      success: false,
      status: 0,
      message: error.message || '네트워크 에러',
      url: testUrl,
      duration: duration,
      error: error.name,
      errorDetails: error.message
    };
  }
};

const apiService = {
  getApiBaseUrl,
  getWebSocketUrl,
  getApiUrl,
  API_BASE_URL,
  testBackendConnection
};

export default apiService;

