// API 베이스 URL 설정
// 환경 변수 또는 기본값 사용
const getApiBaseUrl = () => {
  // 환경 변수가 있으면 사용, 없으면 개발 환경에서는 localhost:8080, 프로덕션에서는 3.34.58.161
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // 개발 환경 체크 (localhost에서 실행 중인지)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8080';
  }
  
  // 프로덕션 환경에서는 3.34.58.161 사용
  return 'http://3.34.58.161';
};

// WebSocket URL 생성
export const getWebSocketUrl = (endpoint = '/ws-kiosk') => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
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

const apiService = {
  getApiBaseUrl,
  getWebSocketUrl,
  getApiUrl,
  API_BASE_URL
};

export default apiService;

