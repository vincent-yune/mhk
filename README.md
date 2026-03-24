# 🏠 MyHouse - 토탈 홈 매니지먼트

> 집의 모든 것을 한 눈에 관리하는 스마트 홈 플랫폼

## 📋 프로젝트 개요

**MyHouse**는 집 관리, 물품 인벤토리, IoT 기기 제어, 이웃 커뮤니티 거래를 통합한 올인원 홈 매니지먼트 서비스입니다.

## ✅ 구현 완료 기능

### 인증 & 사용자
- [x] 회원가입 / 로그인 (JWT 토큰 기반)
- [x] 프로필 조회 및 수정
- [x] 비밀번호 변경
- [x] 등급 시스템 (브론즈 → 실버 → 골드 → 플래티넘)
- [x] 신뢰도 점수 관리

### 집(House) 관리
- [x] 집 등록 (아파트/빌라/주택/오피스텔 등 유형 선택)
- [x] 집별 구역(Zone) 자동 생성 (거실/주방/침실/욕실/베란다)
- [x] 주거 집 지정 (다중 집 관리 지원)
- [x] 입주일, 면적, 방/욕실 수 등 상세 정보 관리

### 물품 관리 (Item)
- [x] 구역별 물품 등록/수정/삭제
- [x] 카테고리 분류 (가전제품, 생활용품, 식품 등)
- [x] 유통기한 관리 및 임박 알림
- [x] 재고 수량 관리 및 재주문 임계값 설정
- [x] 물품 상태 관리 (정상/사용중/유통기한임박/재주문필요/폐기)
- [x] 영수증/바코드 스캔 UI (프론트)

### IoT 기기 관리
- [x] 기기 등록 (에어컨/냉장고/세탁기/TV/조명 등)
- [x] 기기 ON/OFF 토글 제어
- [x] 자동화 시나리오 설정 (외출/취침/기상 모드)
- [x] 기기별 구역 배치

### 커뮤니티 (Community)
- [x] 중고 물품 거래 게시판
- [x] 이웃 나눔/정보 공유
- [x] 게시글 작성/수정/삭제
- [x] 관심/댓글 기능

### 알림 (Notification)
- [x] 유통기한 임박 알림
- [x] 재주문 필요 알림
- [x] IoT 기기 알림
- [x] 커뮤니티/거래 알림
- [x] 읽음/전체 읽음/삭제 기능

### 대시보드
- [x] 집 현황 요약 카드
- [x] 관리비 추이 차트 (6개월)
- [x] 스마트 알림 섹션
- [x] 온보딩 플로우 (집 미등록 시)
- [x] 빠른 실행 메뉴

## 🚧 미구현 (예정)
- [ ] 부동산 연계 서비스
- [ ] 스마트 구매 (자동 재주문)
- [ ] 인테리어 솔루션
- [ ] AI 기반 홈 인사이트
- [ ] 실제 IoT 디바이스 연동 (SmartThings, Google Home)
- [ ] 실제 바코드/영수증 OCR 스캔

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | React 18, Vite, React Router v6, Zustand, Recharts, Lucide-react |
| **Backend** | Spring Boot 2.7, Spring Security, Spring Data JPA, JWT |
| **Database** | MariaDB 10.11 |
| **ORM** | Hibernate 5.6 |
| **빌드** | Maven 3.9, Node.js 20 |
| **서버** | PM2, Express.js (정적 파일 서빙) |

## 📂 프로젝트 구조

```
webapp/
├── backend/                     # Spring Boot API 서버
│   ├── src/main/java/com/myhouse/
│   │   ├── controller/          # REST API 컨트롤러
│   │   │   ├── AuthController       (회원가입/로그인)
│   │   │   ├── HouseController      (집/구역 관리)
│   │   │   ├── ItemController       (물품 관리)
│   │   │   ├── IotController        (IoT 기기)
│   │   │   ├── CommunityController  (커뮤니티)
│   │   │   ├── NotificationController (알림)
│   │   │   └── CategoryController   (카테고리)
│   │   ├── entity/              # JPA 엔티티
│   │   ├── repository/          # Spring Data JPA 리포지토리
│   │   ├── service/             # 비즈니스 로직
│   │   ├── dto/                 # 요청/응답 DTO
│   │   ├── security/            # JWT 인증
│   │   ├── config/              # Spring Security 설정
│   │   └── exception/           # 전역 예외 처리
│   └── src/main/resources/
│       ├── application.yml      # 설정 파일
│       └── db/schema.sql        # DB 스키마
│
└── frontend/                    # React SPA
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.jsx        (로그인/회원가입)
    │   │   ├── DashboardPage.jsx    (대시보드 + 온보딩)
    │   │   ├── HousePage.jsx        (집/구역 관리)
    │   │   ├── ItemPage.jsx         (물품 관리)
    │   │   ├── IotPage.jsx          (IoT 기기 관리)
    │   │   ├── CommunityPage.jsx    (커뮤니티)
    │   │   ├── ProfilePage.jsx      (내 프로필)
    │   │   └── NotificationPage.jsx (알림 센터)
    │   ├── components/
    │   │   ├── Sidebar.jsx          (네비게이션)
    │   │   ├── Header.jsx           (상단 헤더)
    │   │   └── ProtectedLayout.jsx  (인증 가드)
    │   ├── store/useStore.js        (Zustand 전역 상태)
    │   └── api/axios.js             (API 클라이언트)
    └── server.mjs                   (Express 정적 파일 서버)
```

## 🗄 데이터 모델

### 핵심 테이블
- `users` - 사용자 (이메일, 등급, 신뢰도)
- `houses` - 집 정보 (유형, 주소, 면적)
- `zones` - 구역 (거실/주방/침실 등)
- `items` - 물품 (유통기한, 재고, 카테고리)
- `categories` - 물품 카테고리 (계층형)
- `iot_devices` - IoT 기기 (상태, 자동화)
- `automation_scenarios` - 자동화 시나리오
- `community_posts` - 커뮤니티 게시글
- `notifications` - 알림
- `house_history` - 집 이력 타임라인

## 🔌 주요 API 엔드포인트

### 인증
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인

### 집 관리
- `GET/POST /api/houses` - 집 목록/등록
- `GET /api/houses/{id}/zones` - 구역 목록

### 물품 관리
- `GET/POST /api/houses/{id}/items` - 물품 목록/등록
- `GET /api/houses/{id}/items/expiring` - 유통기한 임박 물품
- `GET /api/houses/{id}/items/reorder` - 재주문 필요 물품

### IoT
- `GET/POST /api/houses/{id}/iot` - 기기 목록/등록
- `PATCH /api/iot/{id}/toggle` - 기기 ON/OFF

### 알림
- `GET /api/notifications` - 알림 목록
- `PATCH /api/notifications/{id}/read` - 읽음 처리
- `PATCH /api/notifications/read-all` - 전체 읽음

## 🚀 실행 방법

### 개발 환경 요구사항
- Java 11+
- Node.js 18+
- Maven 3.8+
- MariaDB 10.x

### 백엔드 실행
```bash
cd backend
mvn package -DskipTests
java -jar target/myhouse-backend-1.0.0.jar
# Port 8080에서 실행
```

### 프론트엔드 실행
```bash
cd frontend
npm install
npm run build
node server.mjs
# Port 3000에서 실행
```

### PM2로 실행 (샌드박스 환경)
```bash
pm2 start ecosystem.config.cjs  # 프론트엔드
# 백엔드는 별도 ecosystem 파일 사용
```

## 🔐 테스트 계정
- **이메일**: test@myhouse.com  
- **비밀번호**: test1234

## 📊 개발 현황

- **백엔드**: 핵심 API 구현 완료 (인증, 집/구역/물품/IoT/커뮤니티/알림)
- **프론트엔드**: 7개 주요 페이지 구현 완료
- **데이터베이스**: 13개 테이블 스키마 완성
- **상태**: ✅ MVP 버전 운영 중

## 📅 개발 로드맵

| 단계 | 기간 | 내용 |
|------|------|------|
| **1단계** | Q1 | 핵심 기능 MVP (✅ 완료) |
| **2단계** | Q2 | AI 추천, 바코드 스캔, 실시간 알림 |
| **3단계** | Q3 | 커뮤니티 거래 고도화, 신뢰도 시스템 |
| **4단계** | Q4 | 부동산/인테리어 연계, 프리미엄 구독 |

---

*Last Updated: 2026-03-24*
