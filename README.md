# 法規情報助手（原型）

## 怎麼跑

只需要 Python 3，不用安裝任何套件。在終端機：

```
cd regulatory-assistant/backend
python3 seed.py        # 第一次：建立資料庫並放入示意資料
python3 server.py      # 啟動，然後用瀏覽器開 http://localhost:8000
```

- 重置資料：`python3 seed.py --reset`（會清空現有資料）。
- 直接雙擊 index.html（file://）也能開，但只有示意資料，操作不會保存。

## 檔案

| 檔案 | 用途 |
|---|---|
| index.html / style.css / app.js | 前端 |
| data.js | 沒有後端時使用的示意資料 |
| backend/schema.sql | 資料表定義（SQL） |
| backend/seed.py、seed.json | 建立資料庫並匯入示意資料 |
| backend/server.py | API 與靜態檔案伺服器 |
| API.md | 給後端／爬蟲同學的介面說明 |

## 目前的限制

- 沒有登入機制，所有操作都記為「人工」。正式使用前必須加上身分驗證與權限。
- 「送出通知」只會寫入紀錄，沒有真的寄出。
- 資料庫裡全是示意資料。爬蟲抓到真實公告後，寫入 regulation_item 與 impact_row 即可；AI 的摘要與對應必須附可回查的條文出處。
