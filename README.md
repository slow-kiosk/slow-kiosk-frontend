# slow-kiosk-frontend

## 요구사항

- **Node.js** v14 이상
- **npm** 또는 **yarn** (패키지 관리자)

### 의존성 설치

프로젝트 루트 디렉토리에서 다음 명령어를 실행하세요.

**npm 사용:**

```bash
npm install
```

**yarn 사용:**

```bash
yarn install
```

### 2WebSocket 라이브러리 설치

STOMP 및 SockJS 클라이언트를 추가로 설치합니다:

```bash
npm install @stomp/stompjs sockjs-client
```

또는

```bash
yarn add @stomp/stompjs sockjs-client
```

### 개발 서버 실행

**npm 사용:**

```bash
npm start
```

**yarn 사용:**

```bash
yarn start
```

서버가 성공적으로 실행되면 브라우저에서 `http://localhost:3000`으로 자동으로 열립니다.

## 참고사항

- 개발 서버 종료: `Ctrl + C` (Windows/Linux) 또는 `Cmd + C` (Mac)

## 주요 의존성

- **React** - UI 라이브러리
- **@stomp/stompjs** - WebSocket STOMP 프로토콜 클라이언트
- **sockjs-client** - SockJS 클라이언트
