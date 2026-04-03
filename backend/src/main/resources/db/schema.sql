-- =============================================
-- MyHouse Database Schema
-- Total Home Management Platform
-- =============================================

USE myhouse_db;

-- =============================================
-- 1. 사용자 (Users)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    name        VARCHAR(50) NOT NULL,
    phone       VARCHAR(20),
    profile_img VARCHAR(500),
    role        ENUM('USER', 'ADMIN') DEFAULT 'USER',
    grade       ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM') DEFAULT 'BRONZE',
    trust_score    INT DEFAULT 0,
    is_active      BOOLEAN DEFAULT TRUE,
    smart_things_token VARCHAR(500) NULL,
    lg_thinq_token     VARCHAR(500) NULL,
    hue_bridge_ip      VARCHAR(50) NULL,
    hue_username       VARCHAR(255) NULL,
    provider           VARCHAR(20) NULL,
    provider_id        VARCHAR(200) NULL,
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 2. 집 정보 (Houses)
-- =============================================
CREATE TABLE IF NOT EXISTS houses (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    name         VARCHAR(100) NOT NULL DEFAULT '우리집',
    house_type   ENUM('APARTMENT', 'HOUSE', 'VILLA', 'OFFICETEL', 'OTHER') DEFAULT 'APARTMENT',
    address      VARCHAR(300),
    area         DECIMAL(8, 2) COMMENT '면적(㎡)',
    floor        INT COMMENT '층수',
    rooms        INT DEFAULT 1 COMMENT '방 개수',
    bathrooms    INT DEFAULT 1,
    move_in_date DATE,
    purchase_price DECIMAL(15, 2) COMMENT '매입가(원)',
    current_price  DECIMAL(15, 2) COMMENT '현재 시세(원)',
    theme        ENUM('DEFAULT', 'MODERN', 'NATURAL', 'VINTAGE', 'MINIMAL') DEFAULT 'DEFAULT',
    is_primary   BOOLEAN DEFAULT TRUE,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. 구역 (Zones - 거실, 주방, 침실 등)
-- =============================================
CREATE TABLE IF NOT EXISTS zones (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    house_id   BIGINT NOT NULL,
    name       VARCHAR(50) NOT NULL,
    zone_type  ENUM('LIVING_ROOM', 'KITCHEN', 'BEDROOM', 'BATHROOM',
                    'STUDY', 'BALCONY', 'GARAGE', 'OTHER') DEFAULT 'OTHER',
    icon       VARCHAR(100),
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 4. 카테고리 (Categories)
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_id   BIGINT,
    name        VARCHAR(50) NOT NULL,
    icon        VARCHAR(100),
    sort_order  INT DEFAULT 0,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 5. 물품 (Items - 가전, 가구, 소모품 등)
-- =============================================
CREATE TABLE IF NOT EXISTS items (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    house_id        BIGINT NOT NULL,
    zone_id         BIGINT,
    category_id     BIGINT,
    name            VARCHAR(200) NOT NULL,
    brand           VARCHAR(100),
    model           VARCHAR(200),
    barcode         VARCHAR(100),
    description     TEXT,
    image_url       VARCHAR(500),
    purchase_date   DATE,
    purchase_price  DECIMAL(12, 2),
    warranty_expire DATE COMMENT '보증기간 만료일',
    expiry_date     DATE COMMENT '유통기한',
    quantity        INT DEFAULT 1,
    unit            VARCHAR(20) DEFAULT 'EA' COMMENT '단위',
    status          ENUM('ACTIVE', 'BROKEN', 'DISCARDED', 'SOLD') DEFAULT 'ACTIVE',
    is_consumable   BOOLEAN DEFAULT FALSE COMMENT '소모품 여부',
    reorder_level   INT COMMENT '재주문 기준 수량',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 6. IoT 기기 (IoT Devices)
-- =============================================
CREATE TABLE IF NOT EXISTS iot_devices (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    house_id     BIGINT NOT NULL,
    zone_id      BIGINT,
    name         VARCHAR(100) NOT NULL,
    device_type  ENUM('LIGHT', 'THERMOSTAT', 'LOCK', 'CAMERA', 'TV',
                      'AC', 'WASHER', 'REFRIGERATOR', 'OTHER') DEFAULT 'OTHER',
    manufacturer VARCHAR(100),
    model        VARCHAR(200),
    device_uid   VARCHAR(200) COMMENT '기기 고유 식별자',
    platform     ENUM('SMARTTHINGS', 'GOOGLE_HOME', 'APPLE_HOME', 'TUYA', 'OTHER') DEFAULT 'OTHER',
    status       ENUM('ONLINE', 'OFFLINE', 'STANDBY') DEFAULT 'OFFLINE',
    is_active    BOOLEAN DEFAULT TRUE,
    settings     JSON COMMENT '기기별 설정값 (JSON)',
    last_seen    DATETIME,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 7. IoT 자동화 시나리오 (Automation Scenarios)
-- =============================================
CREATE TABLE IF NOT EXISTS automation_scenarios (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    house_id    BIGINT NOT NULL,
    name        VARCHAR(100) NOT NULL,
    scenario_type ENUM('ARRIVE_HOME', 'LEAVE_HOME', 'SLEEP', 'WAKE_UP', 'CUSTOM') DEFAULT 'CUSTOM',
    trigger_info  JSON COMMENT '트리거 조건 (JSON)',
    actions       JSON COMMENT '실행 동작 목록 (JSON)',
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 8. 관리비 내역 (Maintenance Fees)
-- =============================================
CREATE TABLE IF NOT EXISTS maintenance_fees (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    house_id      BIGINT NOT NULL,
    fee_year      INT NOT NULL,
    fee_month     INT NOT NULL,
    total_amount  DECIMAL(10, 2) NOT NULL,
    electricity   DECIMAL(10, 2) DEFAULT 0,
    gas           DECIMAL(10, 2) DEFAULT 0,
    water         DECIMAL(10, 2) DEFAULT 0,
    internet      DECIMAL(10, 2) DEFAULT 0,
    common_area   DECIMAL(10, 2) DEFAULT 0 COMMENT '공용관리비',
    memo          TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
    UNIQUE KEY uq_house_yearmonth (house_id, fee_year, fee_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 9. 커뮤니티 게시글 (Community Posts - 중고거래/나눔)
-- =============================================
CREATE TABLE IF NOT EXISTS community_posts (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    item_id      BIGINT COMMENT '연결된 물품(선택)',
    title        VARCHAR(200) NOT NULL,
    content      TEXT NOT NULL,
    post_type    ENUM('SELL', 'BUY', 'SHARE', 'RENT', 'FREE') DEFAULT 'SELL',
    price        DECIMAL(12, 2),
    is_negotiable BOOLEAN DEFAULT FALSE COMMENT '가격 협의 가능',
    status       ENUM('ACTIVE', 'RESERVED', 'COMPLETED', 'CLOSED') DEFAULT 'ACTIVE',
    view_count   INT DEFAULT 0,
    image_urls   JSON COMMENT '이미지 URL 목록',
    location     VARCHAR(200) COMMENT '거래 희망 장소',
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 10. 댓글 (Comments)
-- =============================================
CREATE TABLE IF NOT EXISTS comments (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id    BIGINT NOT NULL,
    user_id    BIGINT NOT NULL,
    content    TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 11. 찜/좋아요 (Likes)
-- =============================================
CREATE TABLE IF NOT EXISTS likes (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id    BIGINT NOT NULL,
    user_id    BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_post_user (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 12. 알림 (Notifications)
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id   BIGINT NOT NULL,
    type      ENUM('EXPIRY_WARN', 'REORDER', 'IOT_ALERT', 'COMMUNITY',
                   'TRADE', 'SYSTEM') DEFAULT 'SYSTEM',
    title     VARCHAR(200) NOT NULL,
    message   TEXT NOT NULL,
    ref_id    BIGINT COMMENT '참조 데이터 ID',
    ref_type  VARCHAR(50) COMMENT '참조 테이블명',
    is_read   BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 13. 홈 이력 (House History - 수리/리모델링 등)
-- =============================================
CREATE TABLE IF NOT EXISTS house_history (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    house_id     BIGINT NOT NULL,
    event_type   ENUM('REPAIR', 'REMODEL', 'PURCHASE', 'SELL', 'MOVE_IN', 'MOVE_OUT', 'OTHER') DEFAULT 'OTHER',
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    cost         DECIMAL(12, 2),
    event_date   DATE NOT NULL,
    image_urls   JSON,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 기본 카테고리 데이터
-- =============================================
INSERT INTO categories (id, parent_id, name, icon, sort_order) VALUES
(1,  NULL, '가전제품', 'tv',           1),
(2,  NULL, '가구',    'sofa',          2),
(3,  NULL, '식품',    'shopping-cart', 3),
(4,  NULL, '생활용품', 'home',         4),
(5,  NULL, '의류',    'shirt',         5),
(6,  NULL, '스포츠',  'dumbbell',      6),
(7,  NULL, '기타',    'box',           7),
-- 가전제품 하위
(10, 1, 'TV/영상기기', 'tv',           1),
(11, 1, '냉장고',      'thermometer',  2),
(12, 1, '세탁기/건조기','washer',      3),
(13, 1, '에어컨',      'wind',         4),
(14, 1, '청소기',      'package',      5),
(15, 1, '주방가전',    'coffee',       6),
-- 가구 하위
(20, 2, '쇼파/의자',  'sofa',          1),
(21, 2, '침대/매트리스','bed',          2),
(22, 2, '책상/테이블', 'table',        3),
(23, 2, '수납/선반',   'archive',      4),
-- 식품 하위
(30, 3, '냉장식품',   'thermometer',   1),
(31, 3, '냉동식품',   'snowflake',     2),
(32, 3, '음료/주류',  'coffee',        3),
(33, 3, '조미료/양념', 'box',          4),
-- 생활용품 하위
(40, 4, '세제/청소',  'package',       1),
(41, 4, '욕실용품',   'droplets',      2),
(42, 4, '의약품',     'pill',          3)
ON DUPLICATE KEY UPDATE name=VALUES(name);
