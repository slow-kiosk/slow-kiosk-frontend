import { getApiUrl } from '../services/Api';

export async function fetchMenus() {
  const startTime = Date.now();
  const apiUrl = getApiUrl('/api/menu');
  
  console.log('='.repeat(60));
  console.log('[fetchMenus] 메뉴 데이터 요청 시작');
  console.log('[fetchMenus] 요청 URL:', apiUrl);
  console.log('[fetchMenus] 요청 시간:', new Date().toISOString());
  console.log('[fetchMenus] 요청 메서드: GET');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('[fetchMenus] 요청 타임아웃 (10초 초과)');
      controller.abort();
    }, 10000);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log('[fetchMenus] 응답 수신');
    console.log('[fetchMenus] 응답 상태:', response.status, response.statusText);
    console.log('[fetchMenus] 응답 시간:', duration + 'ms');
    console.log('[fetchMenus] 응답 헤더:', {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length'),
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[fetchMenus] HTTP 에러 응답');
      console.error('[fetchMenus] 에러 상태:', response.status, response.statusText);
      console.error('[fetchMenus] 에러 본문:', errorText);
      console.log('='.repeat(60));
      throw new Error(`메뉴를 불러오는 데 실패했습니다. (${response.status}: ${response.statusText})`);
    }
    
    const menus = await response.json();
    const finalDuration = Date.now() - startTime;
    
    console.log('[fetchMenus] 메뉴 로드 성공');
    console.log('[fetchMenus] 총 소요 시간:', finalDuration + 'ms');
    console.log('[fetchMenus] 메뉴 개수:', menus?.length || 0);
    if (menus && menus.length > 0) {
      console.log('[fetchMenus] 첫 번째 메뉴 샘플:', {
        id: menus[0].id,
        name: menus[0].name,
        price: menus[0].price
      });
    }
    console.log('='.repeat(60));
    
    return menus; // 배열 [{id, name, price, description, imageUrl, category}, ...]
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('[fetchMenus] 요청 실패');
    console.error('[fetchMenus] 에러 타입:', error.name);
    console.error('[fetchMenus] 에러 메시지:', error.message);
    
    if (error.name === 'AbortError') {
      console.error('[fetchMenus] ⏱요청 타임아웃 - 서버 응답이 없습니다');
    } else if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      console.error('[fetchMenus] 네트워크/CORS 에러');
      console.error('[fetchMenus] 가능한 원인:');
      console.error('  - 백엔드 서버가 실행 중이지 않음');
      console.error('  - CORS 설정이 올바르지 않음');
      console.error('  - 네트워크 연결 문제');
      console.error('  - 잘못된 서버 주소');
    }
    
    console.error('[fetchMenus] 요청 URL:', apiUrl);
    console.error('[fetchMenus] 실패 시간:', duration + 'ms');
    console.error('[fetchMenus] 에러 스택:', error.stack);
    console.log('='.repeat(60));
    
    return [];
  }
}

// 메뉴 이름으로 검색
export function findMenuByName(menus, name) {
  const normalizedName = name.toLowerCase().trim();
  return menus.find(menu =>
    menu.name.toLowerCase().includes(normalizedName)
  );
}

// 메뉴 ID로 검색
export function findMenuById(menus, id) {
  return menus.find(menu => menu.id === id);
}
