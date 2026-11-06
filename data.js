const PROTOTYPE_DATA = [
  {
    id: 1,
    date: "2026-10-08",
    authority: "保險局",
    action: "修正",
    title: "修正「人壽保險商品死亡給付對保單價值準備金之最低比率規範」",
    categories: ["人身保險", "壽險"],
    status: "READY",
    confidence: 96,
    documentNo: "金管保壽字第1150490001號",
    effectiveDate: "2027-01-01",
    source: "保險局法規草案及法規命令",
    summary: "本次修正聚焦人壽保險商品死亡給付與保單價值準備金的最低比率，初步判定直接影響壽險商品設計及準備金檢核。",
    classificationReason: "標題明確出現「人壽保險商品」及「死亡給付」，屬人身保險中的壽險商品規範。",
    evidence: "標題關鍵詞：人壽保險商品、死亡給付、保單價值準備金。",
    requirements: [
      ["適用對象", "人壽保險商品"],
      ["主要義務", "檢視死亡給付與保單價值準備金的最低比率"],
      ["待確認", "正式施行日及過渡期間商品的適用方式"]
    ],
    history: [["10/08 09:14", "AI 完成第一、二層分類"], ["10/08 09:15", "規則檢核通過"]]
  },
  {
    id: 2,
    date: "2026-10-06",
    authority: "保險局",
    action: "訂定",
    title: "訂定「保險法第146條第4項」解釋令",
    categories: ["保險業共通", "資金運用"],
    status: "REVIEW",
    confidence: 82,
    documentNo: "金管保財字第1150490008號",
    effectiveDate: "2026-10-06",
    source: "保險局法規草案及法規命令",
    summary: "解釋令涉及保險業資金運用範圍，需要再確認不同保險業別與投資標的的適用條件。",
    classificationReason: "保險法第146條主要涉及保險業資金運用，對壽險與產險業者均可能適用，因此先歸入共通類。",
    evidence: "法源定位：保險法第146條第4項；標題未限定單一保險業別。",
    requirements: [
      ["適用對象", "保險業者，實際範圍待依解釋令內容確認"],
      ["主要義務", "依解釋令重新檢視特定資金運用項目"],
      ["人工確認", "是否需分拆為壽險業與產險業兩類"]
    ],
    history: [["10/06 14:20", "AI 完成第一層分類"], ["10/06 14:22", "送交人工確認保險類別"]]
  },
  {
    id: 3,
    date: "2026-10-05",
    authority: "保險局",
    action: "修正",
    title: "修正「保險業財務報告編製準則」",
    categories: ["保險業共通", "財務會計"],
    status: "READY",
    confidence: 94,
    documentNo: "金管保財字第1150490012號",
    effectiveDate: "2027-01-01",
    source: "保險局法規草案及法規命令",
    summary: "修正保險業財務報告的編製與揭露要求，適用範圍涵蓋保險業，初步歸類為共通財務會計規範。",
    classificationReason: "法規名稱使用「保險業」而非特定險種，且規範主題為財務報告。",
    evidence: "標題關鍵詞：保險業、財務報告、編製準則。",
    requirements: [
      ["適用對象", "保險業者"],
      ["主要義務", "更新財務報告編製與揭露格式"],
      ["待確認", "新舊準則差異與首次適用年度"]
    ],
    history: [["10/05 11:08", "AI 完成雙層分類"], ["10/05 11:09", "分類信心高於自動通過門檻"]]
  },
  {
    id: 4,
    date: "2026-10-02",
    authority: "保險局",
    action: "廢止",
    title: "廢止「財產保險業經營核能保險提存之各種準備金規範」",
    categories: ["財產保險", "特殊風險"],
    status: "ISSUE",
    issueReason: "缺少正式廢止生效日與替代規範。",
    confidence: 89,
    documentNo: "金管保財字第1150490018號",
    effectiveDate: "待確認",
    source: "保險局法規草案及法規命令",
    summary: "原核能保險準備金規範廢止。分類明確，但目前示意資料缺少正式廢止生效日，因此建立 ISSUE。",
    classificationReason: "標題明確限定財產保險業及核能保險。",
    evidence: "標題關鍵詞：廢止、財產保險業、核能保險、準備金。",
    requirements: [
      ["適用對象", "經營核能保險的財產保險業者"],
      ["異動性質", "既有規範廢止"],
      ["資料缺口", "缺少正式廢止生效日與替代規範"]
    ],
    history: [["10/02 16:41", "AI 完成雙層分類"], ["10/02 16:42", "缺少生效日，建立 ISSUE"]]
  },
  {
    id: 5,
    date: "2026-10-02",
    authority: "保險局",
    action: "訂定",
    title: "訂定「保險業各種準備金提存辦法第3條及第16條規定」",
    categories: ["保險業共通", "準備金"],
    status: "REVIEW",
    confidence: 78,
    documentNo: "金管保財字第1150490021號",
    effectiveDate: "待確認",
    source: "保險局法規草案及法規命令",
    summary: "規範涉及保險業準備金提存，但僅從標題無法判定是否對特定保險業別另有不同要求。",
    classificationReason: "名稱為保險業共通規範；因涉及指定條文，仍需閱讀全文確認細分類。",
    evidence: "標題關鍵詞：保險業、各種準備金、提存辦法。",
    requirements: [
      ["適用對象", "保險業者"],
      ["主要義務", "依第3條及第16條辦理準備金提存"],
      ["人工確認", "條文是否分別限定產險或壽險業者"]
    ],
    history: [["10/02 15:27", "AI 完成第一層分類"], ["10/02 15:29", "保險類別信心不足，送審"]]
  },
  {
    id: 6,
    date: "2026-10-02",
    authority: "保險局",
    action: "訂定",
    title: "訂定「財產保險業經營商業性地震保險及颱風洪水保險準備金規範」",
    categories: ["財產保險", "天災險"],
    status: "READY",
    confidence: 98,
    documentNo: "金管保財字第1150490022號",
    effectiveDate: "2027-01-01",
    source: "保險局法規草案及法規命令",
    summary: "新訂商業性地震與颱風洪水保險的準備金規範，直接適用經營相關天災險的財產保險業者。",
    classificationReason: "法規名稱同時明確指出財產保險業與特定天災保險商品。",
    evidence: "標題關鍵詞：財產保險業、商業性地震保險、颱風洪水保險。",
    requirements: [
      ["適用對象", "經營特定天災險的財產保險業者"],
      ["主要義務", "依新規範提存準備金"],
      ["生效日期", "2027年1月1日"]
    ],
    history: [["10/02 14:51", "AI 完成雙層分類"], ["10/02 14:52", "分類信心高於自動通過門檻"]]
  },
  {
    id: 7,
    date: "2026-10-02",
    authority: "保險局",
    action: "訂定",
    title: "訂定「財產保險業核能保險提存之各種準備金規範」之解釋令",
    categories: ["財產保險", "特殊風險"],
    status: "READY",
    confidence: 95,
    documentNo: "金管保財字第1150490024號",
    effectiveDate: "2026-10-02",
    source: "保險局法規草案及法規命令",
    summary: "針對核能保險準備金規範訂定解釋令，分類屬財產保險中的特殊風險業務。",
    classificationReason: "標題明確出現財產保險業與核能保險。",
    evidence: "標題關鍵詞：財產保險業、核能保險、準備金、解釋令。",
    requirements: [
      ["適用對象", "經營核能保險的財產保險業者"],
      ["主要義務", "依解釋令辦理相關準備金提存"],
      ["版本關聯", "應與同日廢止及新訂規範一併檢視"]
    ],
    history: [["10/02 14:18", "AI 完成雙層分類"], ["10/02 14:19", "建立同日法規版本關聯"]]
  },
  {
    id: 8,
    date: "2026-09-30",
    authority: "保險局",
    action: "修正",
    title: "修正「保險經紀人管理規則」及「保險代理人管理規則」",
    categories: ["保險中介", "通路管理"],
    status: "READY",
    confidence: 97,
    documentNo: "金管保綜字第1150490031號",
    effectiveDate: "2026-09-30",
    source: "保險局法規草案及法規命令",
    summary: "修正保險經紀人與代理人的管理規則，主要影響保險中介與銷售通路管理。",
    classificationReason: "法規名稱直接限定保險經紀人及保險代理人。",
    evidence: "標題關鍵詞：保險經紀人、保險代理人、管理規則。",
    requirements: [
      ["適用對象", "保險經紀人與保險代理人"],
      ["主要義務", "依修正規則調整中介與通路管理作業"],
      ["待確認", "公司合作通路是否涉及修正項目"]
    ],
    history: [["09/30 10:33", "AI 完成雙層分類"], ["09/30 10:34", "規則檢核通過"]]
  },
  {
    id: 9,
    date: "2026-09-08",
    authority: "保險局",
    action: "訂定",
    title: "訂定「保險業自有資本與風險資本之計算方法說明及相關報表」",
    categories: ["保險業共通", "資本適足"],
    status: "READY",
    confidence: 93,
    documentNo: "金管保財字第1150490038號",
    effectiveDate: "2027-01-01",
    source: "保險局法規草案及法規命令",
    summary: "新訂保險業自有資本與風險資本計算及報表要求，屬保險業共通的資本適足規範。",
    classificationReason: "規範對象為保險業，主題為自有資本、風險資本與申報報表。",
    evidence: "標題關鍵詞：保險業、自有資本、風險資本、相關報表。",
    requirements: [
      ["適用對象", "保險業者"],
      ["主要義務", "依新方法計算資本並使用指定報表"],
      ["待確認", "首次申報期間及新舊表格轉換方式"]
    ],
    history: [["09/08 13:07", "AI 完成雙層分類"], ["09/08 13:09", "分類信心高於自動通過門檻"]]
  },
  {
    id: 10,
    date: "2026-09-04",
    authority: "保險局",
    action: "修正",
    title: "修正「保險業辦理國外投資管理辦法」",
    categories: ["保險業共通", "資金運用"],
    status: "READY",
    confidence: 95,
    documentNo: "金管保財字第1150490042號",
    effectiveDate: "2026-09-04",
    source: "保險局法規草案及法規命令",
    summary: "修正保險業國外投資管理規範，屬跨業別的資金運用法規，也是本次 prototype 爬取範圍的截止資料。",
    classificationReason: "法規名稱使用保險業，未限定單一險種，且主題明確為國外投資。",
    evidence: "標題關鍵詞：保險業、國外投資、管理辦法。",
    requirements: [
      ["適用對象", "辦理國外投資的保險業者"],
      ["主要義務", "依修正辦法調整投資限額、程序或申報作業"],
      ["資料範圍", "本次 prototype 已涵蓋至 2026年9月4日"]
    ],
    history: [["09/04 09:02", "爬蟲完成資料蒐集"], ["09/04 09:04", "AI 完成雙層分類"]]
  }
];

const INSURANCE_CATEGORIES = [
  "保險業共通", "人身保險", "壽險", "健康險", "傷害險",
  "財產保險", "天災險", "特殊風險", "保險中介", "通路管理",
  "資金運用", "財務會計", "準備金", "資本適足"
];

const PROTOTYPE_CASES = [
  {
    id: "CASE-001",
    year: "2026",
    title: "【示意】人壽保險公司辦理商品招攬作業缺失",
    reason: "銷售行為",
    article: "保險法及招攬相關規範",
    penalty: "限期改善並處罰鍰（示意）",
    relation: "可供壽險商品與通路管理分類參考"
  },
  {
    id: "CASE-002",
    year: "2026",
    title: "【示意】財產保險公司準備金提存作業缺失",
    reason: "財務與準備金",
    article: "保險業各種準備金提存辦法",
    penalty: "限期改善（示意）",
    relation: "對應財產保險與準備金相關法規"
  },
  {
    id: "CASE-003",
    year: "2025",
    title: "【示意】保險代理人內部控制執行缺失",
    reason: "通路管理",
    article: "保險代理人管理規則",
    penalty: "糾正並處罰鍰（示意）",
    relation: "對應保險中介與通路管理分類"
  },
  {
    id: "CASE-004",
    year: "2025",
    title: "【示意】保險業辦理國外投資申報缺失",
    reason: "資金運用",
    article: "保險業辦理國外投資管理辦法",
    penalty: "限期改善（示意）",
    relation: "對應國外投資管理辦法修正"
  }
];

const PROTOTYPE_REVIEWS = [
  {
    id: "REV-001",
    regulationId: 6,
    product: "企業天災綜合保險（示意）",
    impact: "新訂地震、颱風及洪水準備金規範可能影響準備金計算。",
    evidence: "充分",
    evidenceDetail: "法規適用條件與商品險種相符，已定位商品文件與準備金計算表。",
    flow: "SEARCH",
    sop: "新增「天災險準備金檢核 SOP」候選流程",
    recommendation: "由商品、精算及法遵共同確認新流程。",
    status: "PENDING",
    note: ""
  },
  {
    id: "REV-002",
    regulationId: 7,
    product: "核能保險共保商品（示意）",
    impact: "核能保險準備金解釋令可能影響共保商品的準備金作業。",
    evidence: "充分",
    evidenceDetail: "已核對解釋令、商品條款與現行準備金作業文件。",
    flow: "STAY",
    sop: "維持既有「特殊風險準備金檢核 SOP」",
    recommendation: "更新法規依據與檢核表。",
    status: "PENDING",
    note: ""
  },
  {
    id: "REV-003",
    regulationId: 10,
    product: "保險業國外投資作業（示意）",
    impact: "管理辦法修正影響國外投資審查與申報程序。",
    evidence: "充分",
    evidenceDetail: "已核對解釋令、資金運用內規及現行投資審查流程。",
    flow: "STAY",
    sop: "維持既有「投資審查與申報 SOP」",
    recommendation: "更新法規附件後送法遵複核。",
    status: "APPROVED",
    decisionAt: "2026/10/06 16:40",
    note: "依既有流程辦理。"
  }
];
