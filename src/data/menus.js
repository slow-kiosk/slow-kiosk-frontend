import { getApiUrl } from '../services/Api';

export async function fetchMenus() {
  try {
    const apiUrl = getApiUrl('/api/menu');
    console.log('[fetchMenus] API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // CORS 문제 해결을 위한 옵션
      mode: 'cors',
    });
    
    console.log('[fetchMenus] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[fetchMenus] Response error:', errorText);
      throw new Error(`메뉴를 불러오는 데 실패했습니다. (${response.status}: ${response.statusText})`);
    }
    
    const menus = await response.json();
    console.log('[fetchMenus] 메뉴 로드 성공, 개수:', menus?.length || 0);
    return menus; // 배열 [{id, name, price, description, imageUrl, category}, ...]
  } catch (error) {
    console.error('[fetchMenus] 에러 발생:', error);
    console.error('[fetchMenus] 에러 상세:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
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
