export async function fetchMenus() {
  try {
    const response = await fetch('http://localhost:8080/api/menu'); // 백엔드 엔드포인트
    if (!response.ok) {
      throw new Error('메뉴를 불러오는 데 실패했습니다.');
    }
    const menus = await response.json();
    return menus; // 배열 [{id, name, price, description, imageUrl, category}, ...]
  } catch (error) {
    console.error(error);
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
