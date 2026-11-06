"""建立資料庫並匯入示意資料。用法：python3 seed.py [--reset]"""
import json, os, sqlite3, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(HERE, "regulatory.db")

if os.path.exists(DB):
    if "--reset" not in sys.argv:
        sys.exit("regulatory.db 已存在。若要清空重建請加 --reset（會刪除現有資料）。")
    os.remove(DB)

seed = json.load(open(os.path.join(HERE, "seed.json"), encoding="utf-8"))
con = sqlite3.connect(DB)
con.execute("PRAGMA foreign_keys = ON")
con.executescript(open(os.path.join(HERE, "schema.sql"), encoding="utf-8").read())

for c in seed["SAMPLE_CASES"]:
    con.execute(
        "INSERT INTO penalty_case(id,title,year,reason,article,penalty,relation) VALUES(?,?,?,?,?,?,?)",
        (c["id"], c["title"], c["year"], c["reason"], c["article"], c["penalty"], c["rel"]),
    )

for it in seed["SAMPLE_ITEMS"]:
    con.execute(
        """INSERT INTO regulation_item(id,type,title,status,source,doc_no,period_label,pub_text,eff_text,left_text,
                                       summary,na_reason,method,draft)
           VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (it["id"], it["type"], it["title"], it["status"], it["source"], it["no"], it["period"], it["pub"],
         it["eff"], it["left"], it["summary"], it.get("naReason"), it.get("method", "通報"), it.get("draft")),
    )
    for n, r in enumerate(it["rows"]):
        con.execute(
            """INSERT INTO impact_row(item_id,name,kind,article,gap,unit,level,why,confidence,quote,sort_no)
               VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
            (it["id"], r["name"], r["kind"], r["art"], r["gap"], r["unit"], r["level"], r["why"], r["conf"], r["quote"], n),
        )
    depts = []
    for r in it["rows"]:
        for d in r["unit"].split("、"):
            if d and d != "—" and d not in depts:
                depts.append(d)
    if it["status"] in ("notified", "replied", "closed"):
        for d in depts:
            con.execute("INSERT INTO dept_reply(item_id,dept,replied) VALUES(?,?,?)",
                        (it["id"], d, 1 if it.get("replied", {}).get(d) else 0))
    for cid in it["cases"]:
        con.execute("INSERT INTO item_case(item_id,case_id) VALUES(?,?)", (it["id"], cid))
    logs = it.get("log") or [["○:○", "AI", "抓取並標示生效日（示意）"],
                             ["○:○", "AI", "整理重點並對應項目，附條文依據（示意）"]]
    for _, actor, text in logs:
        con.execute("INSERT INTO audit_log(item_id,at,actor,text) VALUES(?,?,?,?)", (it["id"], None, actor, text))

con.commit()
con.close()
print("完成：", DB)
