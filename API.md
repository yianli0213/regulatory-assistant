# 資料庫與介面說明（給後端／爬蟲同學）

資料庫是 SQL（目前用 SQLite，結構在 `backend/schema.sql`，欄位設計可直接搬到 PostgreSQL 或 MySQL）。

## 資料表

| 資料表 | 用途 |
|---|---|
| regulation_item | 每一筆法規更新或裁罰案例（含狀態、摘要、處理方式、通知草稿） |
| impact_row | 對應表：受影響項目、類型、依據條文、可能缺口、負責單位、建議影響程度、信心、條文原文 |
| dept_reply | 各部門是否已回覆 |
| penalty_case、item_case | 裁罰案例庫，以及案例和動態的關聯 |
| audit_log | 處理紀錄，只新增不修改 |

**爬蟲要寫入的地方**：新增一筆 `regulation_item`（status 用 `pending`）和它的 `impact_row`。日期請存 `YYYY-MM-DD` 到 `published_on`、`effective_on`，畫面上的「本月／近 3 個月／近 1 年」和「剩 N 天」會自動算。`period_label`、`pub_text`、`eff_text`、`left_text` 只給示意資料用，真實資料留空。
裁罰案例請填 `penalty_case.source_url`（可查證的公開網址）。

## 狀態

`pending`（待接收）→ `accepted`（已接收）→ `notified`（已送出通知）→ `replied`（各部門皆回覆）→ `closed`（結案）。另有 `na`（不適用，必須有理由）。

## 端點

- `GET /api/items`：所有動態，含對應表、部門回覆、處理紀錄。
- `GET /api/cases`：裁罰案例。
- `POST /api/items/{id}/action`：做一個操作，成功回傳更新後的該筆資料，不合規則回 409 並附 `error`。

| action | 需要的欄位 | 規則 |
|---|---|---|
| `accept` | 無 | 只有 pending 可以 |
| `edit` | `rows: [{id, gap, level}]` | 只有 pending 可以；level 只能是 高／中／低 |
| `na` | `reason` | 只有 pending 可以；理由不能是空的 |
| `send` | `method`（通報／召開會議／商品評議）、`draft` | 只有 accepted 可以 |
| `dept` | `dept`、`replied`（true／false） | 只有 notified 或 replied 可以；全部回覆後自動變 replied |
| `close` | 無 | 只有 replied 可以 |

每個操作都會在 `audit_log` 寫一筆紀錄。

## 原則

- AI 產出的摘要、對應、影響程度都只是草稿，由人工確認。
- 每筆摘要和對應都要有可回查的條文出處，沒有出處就不要顯示成確定結論。
