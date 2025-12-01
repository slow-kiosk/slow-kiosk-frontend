<div align="center">

# 🐢 Slow Kiosk Frontend

**더 천천히, 더 편안하게, 모두를 위한 느린 키오스크**

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://slow-kiosk-frontend.vercel.app/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)


</div>

<br/>

---

<br/>

## 주요 기능

- **음성 주문 (Web Speech API):** 음성 인식을 통해 메뉴를 주문할 수 있습니다.
- **AI 챗봇 상호작용 (WebSocket):** 사용자의 질문에 AI가 답변하며 주문을 돕습니다.
- **접근성 설정:** 고대비 모드, 글자 크기 조절, 색약 모드 등을 지원합니다.
- **다양한 결제 수단:** 카드, 모바일 결제, 기프티콘(바코드 스캔)을 지원합니다.

<br/>

---

<br/>

## 배포 주소
**Vercel 배포 링크:** [https://slow-kiosk-frontend.vercel.app/](https://slow-kiosk-frontend.vercel.app/)

## ⚠️ 시작하기 전에

> **💡 이 서비스는 키오스크 환경과 음성/화상 기능을 기반으로 합니다.**  
> 원활한 테스트를 위해 아래 설정을 반드시 확인해주세요!

<br/>

### 1️⃣ 마이크 및 카메라 권한 허용

```
브라우저 진입 시 마이크와 카메라 사용 권한을 반드시 [허용]해주세요.
음성 주문 및 바코드 스캔 기능이 정상 작동하기 위해 필요합니다.
```

<br/>

### 2️⃣ 해상도 설정 (1080 x 1920)

본 프로젝트는 **FHD 세로형 키오스크** 환경에 최적화되어 있습니다.

<details>
<summary><b>🪟 Windows에서 설정하기</b></summary>

<br/>

1. `F12` 키를 눌러 개발자 도구를 엽니다
2. `Ctrl` + `Shift` + `M` 을 눌러 **기기 툴바(Device Toolbar)** 를 활성화합니다
3. 상단 해상도 입력란에 `1080 x 1920` 을 입력합니다

</details>

<details>
<summary><b>🍎 Mac에서 설정하기</b></summary>

<br/>

1. `Cmd` + `Option` + `I` 를 눌러 개발자 도구를 엽니다
2. `Cmd` + `Shift` + `M` 을 눌러 **기기 툴바(Device Toolbar)** 를 활성화합니다
3. 상단 해상도 입력란에 `1080 x 1920` 을 입력합니다

</details>

<br/>

---

<br/>

## 🛠️ 설치 및 실행

### 📌 요구사항

```bash
Node.js v14 이상
npm 또는 yarn
```

<br/>

### 1️⃣ 저장소 클론

```bash
git clone https://github.com/your-username/slow-kiosk-frontend.git
cd slow-kiosk-frontend
```

<br/>

### 2️⃣ 패키지 설치

```bash
# npm 사용 시
npm install

# yarn 사용 시
yarn install
```

<br/>

### 3️⃣ WebSocket 및 추가 라이브러리 설치

```bash
# npm 사용 시
npm install @stomp/stompjs sockjs-client

# yarn 사용 시
yarn add @stomp/stompjs sockjs-client
```

<br/>

### 4️⃣ 개발 서버 실행

```bash
# npm 사용 시
npm start

# yarn 사용 시
yarn start
```

<br/>

> 🎉 서버가 성공적으로 실행되면 브라우저에서 `http://localhost:3000` 으로 자동으로 열립니다.

> ⏹️ 개발 서버 종료: `Ctrl` + `C` 또는 `Cmd` + `C`

<br/>

---

<br/>

## 🔄 플로우 다이어그램

<details open>
<summary><b>전체 사용자 플로우 보기</b></summary>

<br/>

```text
┌─────────────────────────────────────────────────────────────────┐
│                         KioskView                                │
│                    (메인 화면: /, /kiosk)                        │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─[모드 선택]────► 느린 키오스크 모드 / 일반 키오스크 모드
             │
             ├─[주문 시작하기 버튼]────► PaymentView
             │
             └─[사용자 맞춤 버튼]────► GlobalView
                                         │
                                         └─[돌아가기]────► KioskView

┌─────────────────────────────────────────────────────────────────┐
│                        PaymentView                               │
│                   (결제 수단 선택: /payment)                     │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─[포장/매장 선택]────► 서비스 타입 설정
             │
             ├─[결제 수단 선택]
             │   ├─ 카드 ────────────► CheckoutView
             │   ├─ 모바일 ──────────► CheckoutView
             │   └─ 기프티콘 ────────► OrderingView (바코드 스캔 후)
             │
             └─[결제 수단 확정]────► CheckoutView / OrderingView

┌─────────────────────────────────────────────────────────────────┐
│                       OrderingView                               │
│                     (주문 화면: /ordering)                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─[음성 주문]──────────────────► 메뉴 추가
             │
             ├─[메뉴 카드 클릭]────────────► 메뉴 추가
             │
             ├─[주문 내역 버튼/음성]───────► OrderListView
             │
             ├─[주문 완료 버튼/음성]───────► CheckoutView
             │
             └─[AI 챗봇 응답]──► ORDER_COMPLETE ──► CheckoutView (4초 후)

┌─────────────────────────────────────────────────────────────────┐
│                      OrderListView                               │
│                  (주문 내역 확인: /order-list)                   │
└────────────┬────────────────────────────────────────────────────┘
             │
             └─[주문 계속하기]────► OrderingView

┌─────────────────────────────────────────────────────────────────┐
│                       CheckoutView                               │
│                  (결제 확인 및 완료: /checkout)                  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├─[기프티콘 코드 입력]────► 할인 적용
             │
             ├─[결제하기 버튼]────────► 결제 프로세스 시작
             │
             └─[결제 완료]────► 번호표 발급 ──► 메뉴 준비 안내
                                              │
                                              └─► KioskView (13.5초 후)
```

</details>

<br/>

---

<br/>

### Key Libraries

| Library | Version | Description |
|---------|---------|-------------|
| **React** | 18+ | UI 라이브러리 |
| **@stomp/stompjs** | Latest | WebSocket STOMP 프로토콜 클라이언트 |
| **sockjs-client** | Latest | SockJS 클라이언트 |
| **Web Speech API** | Native | 음성 인식 기능 |

<br/>

---



</div>
