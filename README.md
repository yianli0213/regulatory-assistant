# RegLens 前端 Prototype

## 啟動

```bash
cd /Users/phoebe/Documents/github/regulatory-assistant
python3 -m http.server 8000
```

開啟 http://localhost:8000。

## 功能

- 動態首頁
- 裁罰案例庫
- 處理紀錄
- 最終人工審核（核准、退回補件、人工接手）
- 搜尋及篩選法規
- 訂定／修正／廢止分類
- 保險類別多標籤
- 修改及確認分類
- 資料缺口與原因
- 審核紀錄
- CSV 匯出
- 深色模式

目前使用示意資料，涵蓋至 2026-09-04。修改結果保存在瀏覽器 `localStorage`；「重設資料」可還原。

真實爬蟲、RAG 與後端 API 尚未串接。

案件流程：待接收 → 已接收 → 等待部門回覆 → 待人工複核 → 已結案；也可在待接收階段標記不適用。
