-- 法規情報助手 資料庫結構（SQLite 語法；欄位設計可直接搬到 PostgreSQL / MySQL）
PRAGMA foreign_keys = ON;

-- 法規更新或裁罰案例的每一筆動態
CREATE TABLE IF NOT EXISTS regulation_item (
  id            INTEGER PRIMARY KEY,
  type          TEXT NOT NULL CHECK (type IN ('law','case')),
  title         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','notified','replied','closed','na')),
  source        TEXT,                -- 來源機關
  doc_no        TEXT,                -- 公告字號
  published_on  TEXT,                -- 發布日，格式 YYYY-MM-DD；示意資料可為空
  effective_on  TEXT,                -- 生效日，格式 YYYY-MM-DD；示意資料可為空
  period_label  TEXT,                -- 發布日為空時才使用的時間區間文字
  pub_text      TEXT,                -- 示意用的日期文字
  eff_text      TEXT,
  left_text     TEXT,                -- 示意用的生效倒數文字
  summary       TEXT,                -- AI 擷取的重點摘要（草稿，需附條文出處）
  na_reason     TEXT,                -- 標記不適用時必填
  method        TEXT NOT NULL DEFAULT '通報' CHECK (method IN ('通報','召開會議','商品評議')),
  draft         TEXT,                -- 通知草稿
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 對應表：每筆動態影響到的商品 / 內規 / 作業流程
CREATE TABLE IF NOT EXISTS impact_row (
  id          INTEGER PRIMARY KEY,
  item_id     INTEGER NOT NULL REFERENCES regulation_item(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,         -- 受影響項目
  kind        TEXT NOT NULL CHECK (kind IN ('商品','內規','作業流程')),
  article     TEXT,                  -- 依據條文
  gap         TEXT,                  -- 可能缺口（草稿，可由人修正）
  unit        TEXT,                  -- 負責單位，多個用「、」分隔
  level       TEXT NOT NULL CHECK (level IN ('高','中','低')),  -- AI 建議，可由人修正
  why         TEXT,
  confidence  TEXT,                  -- 信心說明
  quote       TEXT,                  -- 條文原文
  sort_no     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_impact_item ON impact_row(item_id);

-- 各部門是否已回覆
CREATE TABLE IF NOT EXISTS dept_reply (
  item_id     INTEGER NOT NULL REFERENCES regulation_item(id) ON DELETE CASCADE,
  dept        TEXT NOT NULL,
  replied     INTEGER NOT NULL DEFAULT 0 CHECK (replied IN (0,1)),
  updated_at  TEXT,
  PRIMARY KEY (item_id, dept)
);

-- 裁罰案例庫
CREATE TABLE IF NOT EXISTS penalty_case (
  id        TEXT PRIMARY KEY,
  title     TEXT NOT NULL,
  year      TEXT,
  reason    TEXT,                    -- 事由
  article   TEXT,                    -- 違反條文
  penalty   TEXT,                    -- 處分內容與金額
  relation  TEXT,                    -- 與本法規的關聯
  source_url TEXT                    -- 來源連結（必須是可查證的公開網址）
);

CREATE TABLE IF NOT EXISTS item_case (
  item_id  INTEGER NOT NULL REFERENCES regulation_item(id) ON DELETE CASCADE,
  case_id  TEXT NOT NULL REFERENCES penalty_case(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, case_id)
);

-- 處理紀錄：只新增、不修改，方便稽核
CREATE TABLE IF NOT EXISTS audit_log (
  id       INTEGER PRIMARY KEY,
  item_id  INTEGER NOT NULL REFERENCES regulation_item(id) ON DELETE CASCADE,
  at       TEXT,                     -- 時間；示意資料可為空
  actor    TEXT NOT NULL,            -- 'AI' 或 '人工'
  text     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_item ON audit_log(item_id);
