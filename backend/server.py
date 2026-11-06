"""法規情報助手後端：只用 Python 標準函式庫 + SQLite，不需要安裝任何套件。
用法：先執行 python3 seed.py，再執行 python3 server.py，瀏覽器開 http://localhost:8000
注意：目前沒有登入機制，所有操作的執行者一律記為「人工」。正式使用前必須加上身分驗證與權限。
"""
import json, mimetypes, os, re, sqlite3
from datetime import date, datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DB = os.path.join(HERE, "regulatory.db")
METHODS = ("通報", "召開會議", "商品評議")
LEVELS = ("高", "中", "低")


def connect():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


def period_of(row):
    d = row["published_on"]
    if d and re.fullmatch(r"\d{4}-\d{2}-\d{2}", d):
        days = (date.today() - date.fromisoformat(d)).days
        return "本月" if days <= 31 else "近 3 個月" if days <= 92 else "近 1 年"
    return row["period_label"] or "近 1 年"


def left_of(row):
    d = row["effective_on"]
    if d and re.fullmatch(r"\d{4}-\d{2}-\d{2}", d):
        days = (date.fromisoformat(d) - date.today()).days
        return f"剩 {days} 天" if days >= 0 else "已生效"
    return row["left_text"] or "—"


def depts_of(con, item_id):
    seen = []
    for (unit,) in con.execute("SELECT unit FROM impact_row WHERE item_id=? ORDER BY sort_no", (item_id,)):
        for d in (unit or "").split("、"):
            if d and d != "—" and d not in seen:
                seen.append(d)
    return seen


def item_dict(con, row):
    i = row["id"]
    rows = [
        {"id": r["id"], "name": r["name"], "kind": r["kind"], "art": r["article"], "gap": r["gap"],
         "unit": r["unit"], "level": r["level"], "why": r["why"], "conf": r["confidence"], "quote": r["quote"]}
        for r in con.execute("SELECT * FROM impact_row WHERE item_id=? ORDER BY sort_no, id", (i,))
    ]
    replied = {r["dept"]: True for r in con.execute("SELECT dept FROM dept_reply WHERE item_id=? AND replied=1", (i,))}
    log = [[(r["at"][11:16] if r["at"] else "○:○"), r["actor"], r["text"]]
           for r in con.execute("SELECT * FROM audit_log WHERE item_id=? ORDER BY id", (i,))]
    cases = [r["case_id"] for r in con.execute("SELECT case_id FROM item_case WHERE item_id=?", (i,))]
    out = {
        "id": i, "type": row["type"], "title": row["title"], "period": period_of(row), "status": row["status"],
        "source": row["source"], "no": row["doc_no"], "pub": row["published_on"] or row["pub_text"],
        "eff": row["effective_on"] or row["eff_text"], "left": left_of(row), "summary": row["summary"],
        "rows": rows, "cases": cases, "method": row["method"], "draft": row["draft"],
        "replied": replied, "log": log,
    }
    if row["na_reason"]:
        out["naReason"] = row["na_reason"]
    return out


def get_item(con, item_id):
    row = con.execute("SELECT * FROM regulation_item WHERE id=?", (item_id,)).fetchone()
    return item_dict(con, row) if row else None


def audit(con, item_id, text, actor="人工"):
    con.execute("INSERT INTO audit_log(item_id,at,actor,text) VALUES(?,?,?,?)",
                (item_id, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), actor, text))


class Conflict(Exception):
    pass


def apply_action(con, item_id, body):
    row = con.execute("SELECT * FROM regulation_item WHERE id=?", (item_id,)).fetchone()
    if not row:
        raise LookupError("找不到這筆資料")
    st, act = row["status"], body.get("action")

    if act == "accept":
        if st != "pending":
            raise Conflict("只有「待接收」的項目可以接收")
        con.execute("UPDATE regulation_item SET status='accepted' WHERE id=?", (item_id,))
        audit(con, item_id, "法遵檢視並接收")

    elif act == "edit":
        if st != "pending":
            raise Conflict("只有「待接收」的項目可以修正對應")
        for r in body.get("rows", []):
            if r.get("level") not in LEVELS:
                raise Conflict("影響程度只能是 高、中、低")
            con.execute("UPDATE impact_row SET gap=?, level=? WHERE id=? AND item_id=?",
                        (r.get("gap", ""), r["level"], r["id"], item_id))
        audit(con, item_id, "修正對應並儲存")

    elif act == "na":
        reason = (body.get("reason") or "").strip()
        if st != "pending":
            raise Conflict("只有「待接收」的項目可以標記不適用")
        if not reason:
            raise Conflict("標記不適用必須填寫理由")
        con.execute("UPDATE regulation_item SET status='na', na_reason=? WHERE id=?", (reason, item_id))
        audit(con, item_id, "標記不適用，理由：" + reason)

    elif act == "send":
        method = body.get("method")
        if st != "accepted":
            raise Conflict("必須先接收，才能送出通知")
        if method not in METHODS:
            raise Conflict("處理方式不正確")
        con.execute("UPDATE regulation_item SET status='notified', method=?, draft=? WHERE id=?",
                    (method, body.get("draft", ""), item_id))
        for d in depts_of(con, item_id):
            con.execute("INSERT OR IGNORE INTO dept_reply(item_id,dept,replied) VALUES(?,?,0)", (item_id, d))
        audit(con, item_id, f"選擇「{method}」並確認送出通知（目前僅記錄，尚未接上寄信功能）")

    elif act == "dept":
        dept = body.get("dept")
        if st not in ("notified", "replied"):
            raise Conflict("尚未送出通知，無法登記部門回覆")
        if dept not in depts_of(con, item_id):
            raise Conflict("不是這筆項目的負責單位")
        value = 1 if body.get("replied") else 0
        con.execute("""INSERT INTO dept_reply(item_id,dept,replied,updated_at) VALUES(?,?,?,?)
                       ON CONFLICT(item_id,dept) DO UPDATE SET replied=excluded.replied, updated_at=excluded.updated_at""",
                    (item_id, dept, value, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        pending = con.execute("SELECT COUNT(*) FROM dept_reply WHERE item_id=? AND replied=0", (item_id,)).fetchone()[0]
        con.execute("UPDATE regulation_item SET status=? WHERE id=?", ("notified" if pending else "replied", item_id))
        audit(con, item_id, f"{dept} {'已回覆' if value else '改為待回覆'}")

    elif act == "close":
        if st != "replied":
            raise Conflict("各部門都回覆後才能結案")
        con.execute("UPDATE regulation_item SET status='closed' WHERE id=?", (item_id,))
        audit(con, item_id, "複核並結案")

    else:
        raise Conflict("不支援的操作")


class Handler(BaseHTTPRequestHandler):
    def send_json(self, code, obj):
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/items":
            con = connect()
            try:
                rows = con.execute("SELECT * FROM regulation_item ORDER BY id").fetchall()
                return self.send_json(200, [item_dict(con, r) for r in rows])
            finally:
                con.close()
        if path == "/api/cases":
            con = connect()
            try:
                return self.send_json(200, [
                    {"id": r["id"], "title": r["title"], "year": r["year"], "reason": r["reason"],
                     "article": r["article"], "penalty": r["penalty"], "rel": r["relation"]}
                    for r in con.execute("SELECT * FROM penalty_case ORDER BY id")])
            finally:
                con.close()
        # 其餘路徑當作靜態檔案
        rel = "index.html" if path in ("", "/") else path.lstrip("/")
        full = os.path.realpath(os.path.join(ROOT, rel))
        if not full.startswith(ROOT + os.sep) or full.startswith(HERE) or not os.path.isfile(full):
            self.send_response(404)
            self.end_headers()
            return
        data = open(full, "rb").read()
        self.send_response(200)
        self.send_header("Content-Type", (mimetypes.guess_type(full)[0] or "application/octet-stream") + "; charset=utf-8"
                         if full.endswith((".html", ".js", ".css", ".md")) else (mimetypes.guess_type(full)[0] or "application/octet-stream"))
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        m = re.fullmatch(r"/api/items/(\d+)/action", self.path.split("?")[0])
        if not m:
            return self.send_json(404, {"error": "找不到"})
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        except ValueError:
            return self.send_json(400, {"error": "資料格式錯誤"})
        con = connect()
        try:
            item_id = int(m.group(1))
            apply_action(con, item_id, body)
            con.commit()
            return self.send_json(200, get_item(con, item_id))
        except LookupError as e:
            con.rollback()
            return self.send_json(404, {"error": str(e)})
        except Conflict as e:
            con.rollback()
            return self.send_json(409, {"error": str(e)})
        finally:
            con.close()


if __name__ == "__main__":
    if not os.path.exists(DB):
        raise SystemExit("找不到 regulatory.db，請先執行：python3 seed.py")
    port = int(os.environ.get("PORT", "8000"))
    print(f"http://localhost:{port}  （按 Ctrl+C 結束）")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
