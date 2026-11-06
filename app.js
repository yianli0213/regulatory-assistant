const STORAGE_KEY = "reglens-prototype-v3";
const REVIEW_STORAGE_KEY = "reglens-final-reviews-v2";
const STATUS_LABEL = { READY: "分類完成", REVIEW: "待人工審核", ISSUE: "資料缺口" };
const STATUS_CLASS = { READY: "ready", REVIEW: "review", ISSUE: "issue" };
const ACTION_CLASS = { 修正: "action-amend", 訂定: "action-create", 廢止: "action-abolish" };
const WORKFLOW_LABEL = {
  pending: "待接收", accepted: "已接收", notified: "等待部門回覆",
  replied: "待人工複核", closed: "已結案", na: "不適用"
};
const WORKFLOW_CLASS = {
  pending: "review", accepted: "doing", notified: "doing",
  replied: "issue", closed: "ready", na: "na"
};

const clone = value => JSON.parse(JSON.stringify(value));
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[char]));

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (_) {}
  return clone(PROTOTYPE_DATA);
}

let items = loadItems();
const WORKFLOW_DEFAULTS = {
  1: ["pending", ["商品", "精算"]],
  2: ["pending", ["法遵", "投資"]],
  3: ["accepted", ["財務", "會計"]],
  4: ["na", []],
  5: ["notified", ["精算", "法遵"]],
  6: ["replied", ["商品", "精算", "法遵"]],
  7: ["replied", ["商品", "精算", "法遵"]],
  8: ["notified", ["通路管理", "法遵"]],
  9: ["accepted", ["精算", "風險管理"]],
  10: ["closed", ["投資", "法遵"]]
};
function normalizeWorkflows() {
  items.forEach(item => {
    const setup = WORKFLOW_DEFAULTS[item.id] || ["pending", ["法遵"]];
    item.workflowStatus ??= setup[0];
    item.departments ??= setup[1];
    item.method ??= "通報";
    item.draft ??= `請相關單位檢視「${item.title}」的影響，並於期限內回覆。`;
    item.replies ??= Object.fromEntries(item.departments.map((department, index) => [
      department,
      item.workflowStatus === "replied" || item.workflowStatus === "closed" || (item.workflowStatus === "notified" && index === 0)
    ]));
    item.naReason ??= item.workflowStatus === "na" ? "與目前業務無直接關聯（示意）。" : "";
  });
}
normalizeWorkflows();
function loadReviews() {
  try {
    const saved = JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) || "null");
    if (Array.isArray(saved) && saved.length) return saved;
  } catch (_) {}
  return clone(PROTOTYPE_REVIEWS);
}
let reviews = loadReviews();
const state = {
  view: "home", query: "", action: "全部", category: "全部",
  status: "全部", caseReason: "全部",
  selectedId: null, selectedReviewId: null, editing: false, issueMode: false
};
const app = document.querySelector("#app");
const drawer = document.querySelector("#detailDrawer");
const backdrop = document.querySelector("#drawerBackdrop");

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
  } catch (_) {}
}

function toast(message) {
  const node = document.querySelector("#toast");
  node.textContent = message;
  node.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { node.hidden = true; }, 2500);
}

function actionTag(action) {
  return `<span class="tag ${ACTION_CLASS[action]}">${escapeHtml(action)}</span>`;
}

function statusTag(status) {
  return `<span class="status ${STATUS_CLASS[status]}">${STATUS_LABEL[status]}</span>`;
}

function workflowStatusTag(status) {
  return `<span class="status ${WORKFLOW_CLASS[status]}">${WORKFLOW_LABEL[status]}</span>`;
}

function reviewStatusTag(status) {
  const labels = { PENDING: "待審核", APPROVED: "已核准", RETURNED: "已退回", TAKEOVER: "人工接手" };
  const classes = { PENDING: "review", APPROVED: "ready", RETURNED: "issue", TAKEOVER: "takeover" };
  return `<span class="status ${classes[status]}">${labels[status]}</span>`;
}

function categoryTags(categories) {
  return `<div class="category-list">${categories.map(category =>
    `<span class="tag category">${escapeHtml(category)}</span>`
  ).join("")}</div>`;
}

function dateDisplay(date) {
  const [year, month, day] = date.split("-");
  return `${year}.<br>${month}.${day}`;
}

function filteredItems() {
  const query = state.query.trim().toLowerCase();
  return items.filter(item => {
    if (state.action !== "全部" && item.action !== state.action) return false;
    if (state.category !== "全部" && !item.categories.includes(state.category)) return false;
    if (state.status !== "全部" && item.workflowStatus !== state.status) return false;
    const haystack = [item.title, item.authority, item.documentNo, ...item.categories].join(" ").toLowerCase();
    return !query || haystack.includes(query);
  });
}

function renderMetrics() {
  const count = status => items.filter(item => item.workflowStatus === status).length;
  const processing = count("accepted") + count("notified") + count("replied");
  return `
    <section class="metrics" aria-label="法規統計">
      <article class="metric">
        <div class="metric-label"><span>待接收</span><i class="metric-icon">!</i></div>
        <div class="metric-value">${count("pending")}</div>
        <div class="metric-note">等待法遵檢視</div>
      </article>
      <article class="metric">
        <div class="metric-label"><span>處理中</span><i class="metric-icon">↻</i></div>
        <div class="metric-value">${processing}</div>
        <div class="metric-note">接收、分派或待複核</div>
      </article>
      <article class="metric">
        <div class="metric-label"><span>已結案</span><i class="metric-icon">✓</i></div>
        <div class="metric-value">${count("closed")}</div>
        <div class="metric-note">已完成人工複核</div>
      </article>
      <article class="metric">
        <div class="metric-label"><span>不適用</span><i class="metric-icon">–</i></div>
        <div class="metric-value">${count("na")}</div>
        <div class="metric-note">已記錄不適用理由</div>
      </article>
    </section>`;
}

function options(values, current, labelMap = {}) {
  return values.map(value =>
    `<option value="${escapeHtml(value)}"${value === current ? " selected" : ""}>${escapeHtml(labelMap[value] || value)}</option>`
  ).join("");
}

function renderDataTable() {
  const list = filteredItems();
  const availableCategories = [...new Set(items.flatMap(item => item.categories))].sort();
  return `
    <section class="data-card">
      <div class="card-toolbar">
        <div class="card-title">
          <strong>法規案件</strong>
          <span>顯示 ${list.length} 筆，共 ${items.length} 筆示意資料</span>
        </div>
        <div class="filters" aria-label="資料篩選">
          <label class="search">
            <input id="searchInput" type="search" value="${escapeHtml(state.query)}" placeholder="搜尋法規名稱、字號或類別" aria-label="搜尋法規">
          </label>
          <select class="filter-select" id="actionFilter" aria-label="異動類型">
            ${options(["全部", "訂定", "修正", "廢止"], state.action, { 全部: "全部異動" })}
          </select>
          <select class="filter-select" id="categoryFilter" aria-label="保險類別">
            ${options(["全部", ...availableCategories], state.category, { 全部: "全部類別" })}
          </select>
          <select class="filter-select" id="statusFilter" aria-label="審核狀態">
            ${options(["全部", "pending", "accepted", "notified", "replied", "closed", "na"], state.status, {
              全部: "全部狀態", pending: "待接收", accepted: "已接收", notified: "等待部門回覆",
              replied: "待人工複核", closed: "已結案", na: "不適用"
            })}
          </select>
          <button class="clear-filter" data-action="clear-filters" type="button">清除</button>
        </div>
      </div>
      <div class="table-scroll">
        ${list.length ? `
          <table>
            <thead><tr>
              <th>發布日期</th><th>法規名稱</th><th>異動</th><th>保險類別</th><th>AI 信心</th><th>狀態</th><th></th>
            </tr></thead>
            <tbody>
              ${list.map(item => `
                <tr>
                  <td class="date-cell">${dateDisplay(item.date)}</td>
                  <td class="regulation-title">
                    <button type="button" data-open-id="${item.id}">${escapeHtml(item.title)}</button>
                    <small>${escapeHtml(item.authority)} · ${escapeHtml(item.documentNo)}</small>
                  </td>
                  <td>${actionTag(item.action)}</td>
                  <td>${categoryTags(item.categories)}</td>
                  <td>
                    <div class="confidence">
                      <span>${item.confidence}%</span>
                      <span class="confidence-bar"><i style="width:${item.confidence}%"></i></span>
                    </div>
                  </td>
                  <td>${workflowStatusTag(item.workflowStatus)}</td>
                  <td><button class="row-action" type="button" data-open-id="${item.id}" aria-label="查看詳情">›</button></td>
                </tr>`).join("")}
            </tbody>
          </table>` : `
          <div class="empty-state"><strong>找不到符合條件的法規</strong>請調整搜尋文字或清除篩選條件。</div>`}
      </div>
      <footer class="table-footer">
        <span>資料來源：保險局公開資訊（prototype 示意資料）</span>
        <span class="coverage-badge">已涵蓋截止點 2026/09/04</span>
      </footer>
    </section>`;
}

function renderWorkspace() {
  return `
    <section class="page-heading">
      <div>
        <h1>動態首頁</h1>
        <p>最新法規、AI 對應與案件處理進度。</p>
      </div>
      <div class="heading-actions">
        <button class="button" data-action="export" type="button">↓ 匯出 CSV</button>
        <button class="button" data-action="reset" type="button">重設資料</button>
      </div>
    </section>
    ${renderMetrics()}
    ${renderDataTable()}`;
}

function renderCases() {
  const reasons = ["全部", ...new Set(PROTOTYPE_CASES.map(item => item.reason))];
  const list = PROTOTYPE_CASES.filter(item => state.caseReason === "全部" || item.reason === state.caseReason);
  return `
    <section class="page-heading">
      <div><h1>裁罰案例庫</h1><p>裁罰案例為示意資料，可用來驗證分類與關聯呈現。</p></div>
      <select class="filter-select" id="caseReasonFilter" aria-label="裁罰事由">
        ${options(reasons, state.caseReason, { 全部: "全部事由" })}
      </select>
    </section>
    <section class="data-card">
      <div class="card-toolbar">
        <div class="card-title"><strong>案例清單</strong><span>共 ${list.length} 筆</span></div>
      </div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>年度</th><th>案例</th><th>裁罰事由</th><th>違反規範</th><th>處分</th><th>與法規的關聯</th></tr></thead>
          <tbody>
            ${list.map(item => `
              <tr>
                <td class="date-cell">${escapeHtml(item.year)}</td>
                <td class="case-title"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.id)}</small></td>
                <td><span class="tag category">${escapeHtml(item.reason)}</span></td>
                <td>${escapeHtml(item.article)}</td>
                <td>${escapeHtml(item.penalty)}</td>
                <td>${escapeHtml(item.relation)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <footer class="table-footer"><span>此頁為 prototype 示意案例，不代表真實裁罰內容。</span></footer>
    </section>`;
}

function renderLog() {
  const lawLogs = items.flatMap(item => item.history.map(entry => ({
    date: item.date, time: entry[0], title: item.title, text: entry[1], status: item.workflowStatus, review: false
  })));
  const reviewLogs = reviews.filter(item => item.decisionAt).map(item => {
    const regulation = items.find(regulationItem => regulationItem.id === item.regulationId);
    return {
      date: item.decisionAt, time: "", title: regulation?.title || item.id,
      text: `人工審核：${item.note || "完成決定"}`, status: item.status, review: true
    };
  });
  const logs = [...reviewLogs, ...lawLogs].sort((a, b) => b.date.localeCompare(a.date));
  return `
    <section class="page-heading">
      <div><h1>處理紀錄</h1><p>法規分類、人工修改與確認紀錄。</p></div>
    </section>
    <section class="data-card">
      <div class="card-toolbar">
        <div class="card-title"><strong>操作紀錄</strong><span>共 ${logs.length} 筆</span></div>
      </div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>日期</th><th>時間</th><th>法規</th><th>處理內容</th><th>目前狀態</th></tr></thead>
          <tbody>
            ${logs.map(log => `
              <tr>
                <td class="date-cell">${escapeHtml(log.date)}</td>
                <td>${escapeHtml(log.time)}</td>
                <td class="log-title">${escapeHtml(log.title)}</td>
                <td>${escapeHtml(log.text)}</td>
                <td>${log.review ? reviewStatusTag(log.status) : workflowStatusTag(log.status)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
}

function renderFinalReview() {
  const pending = reviews.filter(item => item.status === "PENDING").length;
  const approved = reviews.filter(item => item.status === "APPROVED").length;
  const returned = reviews.filter(item => item.status === "RETURNED").length;
  const takeover = reviews.filter(item => item.status === "TAKEOVER").length;
  return `
    <section class="page-heading">
      <div><h1>人工審核</h1><p>確認商品影響、證據與 SOP 建議後做最終決定。</p></div>
    </section>
    <section class="metrics review-metrics" aria-label="人工審核統計">
      <article class="metric"><div class="metric-label">待審核</div><div class="metric-value">${pending}</div></article>
      <article class="metric"><div class="metric-label">已核准</div><div class="metric-value">${approved}</div></article>
      <article class="metric"><div class="metric-label">已退回</div><div class="metric-value">${returned}</div></article>
      <article class="metric"><div class="metric-label">人工接手</div><div class="metric-value">${takeover}</div></article>
    </section>
    <section class="data-card">
      <div class="card-toolbar">
        <div class="card-title"><strong>審核案件</strong><span>共 ${reviews.length} 筆</span></div>
      </div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>案件</th><th>法規</th><th>影響對象</th><th>VERIFY</th><th>SOP 判斷</th><th>狀態</th><th></th></tr></thead>
          <tbody>
            ${reviews.map(review => {
              const regulation = items.find(item => item.id === review.regulationId);
              return `
                <tr>
                  <td class="date-cell">${escapeHtml(review.id)}</td>
                  <td class="review-law">${escapeHtml(regulation?.title || "法規資料")}</td>
                  <td>${escapeHtml(review.product)}</td>
                  <td><span class="tag ${review.evidence === "充分" ? "action-create" : "action-abolish"}">${escapeHtml(review.evidence)}</span></td>
                  <td><span class="tag category">${escapeHtml(review.flow)}</span><br><small>${escapeHtml(review.sop)}</small></td>
                  <td>${reviewStatusTag(review.status)}</td>
                  <td><button class="row-action" type="button" data-review-id="${escapeHtml(review.id)}" aria-label="開啟審核">›</button></td>
                </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
}

function render() {
  app.innerHTML = state.view === "cases"
    ? renderCases()
    : state.view === "log"
      ? renderLog()
      : state.view === "review"
        ? renderFinalReview()
        : renderWorkspace();
  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("is-active", button.dataset.view === state.view);
  });
}

function workflowStep(status) {
  return { pending: 3, accepted: 4, notified: 5, replied: 6, closed: 7, na: 7 }[status] || 1;
}

function renderWorkflowStepper(item) {
  const current = workflowStep(item.workflowStatus);
  const steps = [
    ["AI", "新法規出現"], ["AI", "整理與對應"], ["人工", "法遵檢視"],
    ["AI", "建議處理方式"], ["人工", "決定與分派"], ["AI", "追蹤執行"]
  ];
  return `<div class="workflow-steps">${steps.map((step, index) => {
    const number = index + 1;
    const className = item.workflowStatus === "na"
      ? number <= 3 ? "done" : "skip"
      : number < current ? "done" : number === current ? "current" : "";
    return `<div class="workflow-step ${className}"><small>${number} · ${step[0]}</small><strong>${step[1]}</strong></div>`;
  }).join("")}</div>`;
}

function renderWorkflowPanel(item) {
  if (item.workflowStatus === "accepted") {
    return `
      <section class="detail-section">
        <h3>建議處理方式 <span>AI 草稿</span></h3>
        <div class="edit-form">
          <div class="field"><label for="workflowMethod">處理方式</label>
            <select id="workflowMethod">${options(["通報", "召開會議", "商品評議"], item.method)}</select>
          </div>
          <div class="field"><label for="workflowDraft">通知草稿</label>
            <textarea id="workflowDraft">${escapeHtml(item.draft)}</textarea>
          </div>
          <button class="button primary" data-workflow-action="assign" type="button">確認分派</button>
        </div>
      </section>`;
  }
  if (item.workflowStatus === "notified") {
    return `
      <section class="detail-section">
        <h3>部門回覆</h3>
        <div class="department-list">${item.departments.map(department => `
          <button class="button${item.replies[department] ? " primary" : ""}" data-department="${escapeHtml(department)}" type="button">
            ${escapeHtml(department)} · ${item.replies[department] ? "已回覆" : "待回覆"}
          </button>`).join("")}
        </div>
      </section>`;
  }
  if (item.workflowStatus === "replied") {
    const review = reviews.find(entry => entry.regulationId === item.id && entry.status !== "APPROVED");
    return `
      <section class="detail-section">
        <h3>人工複核</h3>
        <p>相關部門皆已回覆，案件可進入最後人工審核。</p>
        <div class="section-actions">
          ${review
            ? `<button class="button primary" data-linked-review="${escapeHtml(review.id)}" type="button">開啟人工審核</button>`
            : `<button class="button primary" data-workflow-action="close" type="button">複核並結案</button>`}
        </div>
      </section>`;
  }
  if (item.workflowStatus === "closed") {
    return `<section class="detail-section"><h3>案件結果</h3><p>相關單位已回覆，並由法遵完成複核結案。</p></section>`;
  }
  if (item.workflowStatus === "na") {
    return `<section class="detail-section"><h3>不適用理由</h3><p>${escapeHtml(item.naReason)}</p></section>`;
  }
  return `<section class="detail-section"><h3>法遵檢視</h3><p>請確認 AI 摘要與分類；可修正對應、接收案件或標記不適用。</p></section>`;
}

function renderDrawer() {
  const item = items.find(entry => entry.id === state.selectedId);
  if (!item) return closeDrawer();
  const categoryInputs = INSURANCE_CATEGORIES.map(category => `
    <label><input type="checkbox" name="category" value="${escapeHtml(category)}"${item.categories.includes(category) ? " checked" : ""}> ${escapeHtml(category)}</label>
  `).join("");

  drawer.innerHTML = `
    <div class="drawer-header">
      <span>法規資料 #REG-${String(item.id).padStart(3, "0")}</span>
      <button class="close-button" type="button" data-action="close-drawer" aria-label="關閉">×</button>
    </div>
    <div class="drawer-body">
      <div class="eyebrow">${escapeHtml(item.authority)} · ${escapeHtml(item.date)}</div>
      <h2>${escapeHtml(item.title)}</h2>
      <div class="drawer-meta">
        <span>發文字號 <b>${escapeHtml(item.documentNo)}</b></span>
        <span>生效日期 <b>${escapeHtml(item.effectiveDate)}</b></span>
      </div>
      <div class="detail-status-row">
        ${actionTag(item.action)}
        ${categoryTags(item.categories)}
        ${workflowStatusTag(item.workflowStatus)}
        <span class="tag category">AI分類：${STATUS_LABEL[item.status]}</span>
      </div>
      ${renderWorkflowStepper(item)}
      ${renderWorkflowPanel(item)}

      ${state.issueMode ? `
        <section class="detail-section">
          <h3>資料缺口</h3>
          <form class="edit-form" id="issueForm">
            <div class="field">
              <label for="issueReason">缺少什麼資料？</label>
              <textarea id="issueReason" name="reason" placeholder="例如：缺少正式生效日期或最新版附件">${escapeHtml(item.issueReason || "")}</textarea>
            </div>
          </form>
        </section>` : state.editing ? `
        <section class="detail-section">
          <h3>修改分類 <span>修改會留下紀錄</span></h3>
          <form class="edit-form" id="classificationForm">
            <div class="field">
              <label for="editAction">第一層｜異動類型</label>
              <select id="editAction" name="action">${options(["訂定", "修正", "廢止"], item.action)}</select>
            </div>
            <div class="field">
              <label>第二層｜保險類別（可複選）</label>
              <div class="checkbox-grid">${categoryInputs}</div>
            </div>
            <div class="field">
              <label for="editReason">分類理由</label>
              <textarea id="editReason" name="reason">${escapeHtml(item.classificationReason)}</textarea>
            </div>
          </form>
        </section>` : `
        <section class="detail-section">
          <h3>法規摘要 <span>AI 草稿</span></h3>
          <p>${escapeHtml(item.summary)}</p>
        </section>
        <section class="detail-section">
          <h3>分類依據 <span>信心 ${item.confidence}%</span></h3>
          <p>${escapeHtml(item.classificationReason)}</p>
          <div class="evidence-box"><strong>可核對證據</strong>${escapeHtml(item.evidence)}</div>
        </section>
        ${item.status === "ISSUE" ? `<section class="detail-section"><h3>資料缺口</h3><div class="evidence-box"><strong>待補資料</strong>${escapeHtml(item.issueReason || "尚未填寫原因")}</div></section>` : ""}
        <section class="detail-section">
          <h3>法規要求 <span>${item.requirements.length} 項</span></h3>
          <div class="requirement-list">
            ${item.requirements.map((requirement, index) => `
              <div class="requirement"><i>${index + 1}</i><div><strong>${escapeHtml(requirement[0])}</strong><span>${escapeHtml(requirement[1])}</span></div></div>
            `).join("")}
          </div>
        </section>
        <section class="detail-section">
          <h3>審核紀錄</h3>
          <div class="requirement-list">
            ${item.history.map(log => `<div class="requirement"><i>•</i><div><strong>${escapeHtml(log[0])}</strong><span>${escapeHtml(log[1])}</span></div></div>`).join("")}
          </div>
        </section>`}

      <div class="drawer-actions">
        ${state.issueMode ? `
          <button class="button" data-action="cancel-issue" type="button">取消</button>
          <button class="button primary" data-action="save-issue" type="button">儲存</button>` : state.editing ? `
          <button class="button" data-action="cancel-edit" type="button">取消</button>
          <button class="button primary" data-action="save-edit" type="button">儲存修改</button>` : `
          ${item.workflowStatus === "pending" ? `
            <button class="button" data-action="edit" type="button">修改 AI 對應</button>
            <button class="button danger" data-workflow-action="na" type="button">標記不適用</button>
            <button class="button primary" data-workflow-action="accept" type="button">接收案件</button>` :
            `<button class="button" data-action="close-drawer" type="button">關閉</button>`}`}
      </div>
    </div>`;
}

function renderReviewDrawer() {
  const review = reviews.find(item => item.id === state.selectedReviewId);
  if (!review) return closeDrawer();
  const regulation = items.find(item => item.id === review.regulationId);
  drawer.innerHTML = `
    <div class="drawer-header">
      <span>人工審核 ${escapeHtml(review.id)}</span>
      <button class="close-button" type="button" data-action="close-drawer" aria-label="關閉">×</button>
    </div>
    <div class="drawer-body">
      <div class="eyebrow">${escapeHtml(regulation?.authority || "保險局")} · ${escapeHtml(regulation?.date || "")}</div>
      <h2>${escapeHtml(regulation?.title || "法規審核案件")}</h2>
      <div class="drawer-meta"><span>影響對象 <b>${escapeHtml(review.product)}</b></span></div>
      <div class="detail-status-row">
        <span class="tag ${review.evidence === "充分" ? "action-create" : "action-abolish"}">VERIFY：${escapeHtml(review.evidence)}</span>
        <span class="tag category">${escapeHtml(review.flow)}</span>
        ${reviewStatusTag(review.status)}
      </div>

      <section class="detail-section">
        <h3>MAP 商品影響</h3>
        <p>${escapeHtml(review.impact)}</p>
      </section>
      <section class="detail-section">
        <h3>VERIFY 證據</h3>
        <p>${escapeHtml(review.evidenceDetail)}</p>
      </section>
      <section class="detail-section">
        <h3>SOP 建議 <span>${escapeHtml(review.flow)}</span></h3>
        <p><b>${escapeHtml(review.sop)}</b><br>${escapeHtml(review.recommendation)}</p>
      </section>
      <section class="detail-section">
        <h3>審核意見</h3>
        <div class="field">
          <textarea id="reviewNote" placeholder="退回補件時請填寫原因">${escapeHtml(review.note || "")}</textarea>
        </div>
      </section>

      <div class="drawer-actions">
        <button class="button danger" data-review-action="RETURNED" type="button">退回補件</button>
        <button class="button" data-review-action="TAKEOVER" type="button">人工接手</button>
        <button class="button primary" data-review-action="APPROVED" type="button">核准</button>
      </div>
    </div>`;
}

function openDrawer(id) {
  state.selectedId = Number(id);
  state.selectedReviewId = null;
  state.editing = false;
  state.issueMode = false;
  renderDrawer();
  backdrop.hidden = false;
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  drawer.querySelector(".close-button")?.focus();
}

function openReviewDrawer(id) {
  state.selectedReviewId = id;
  state.selectedId = null;
  state.editing = false;
  state.issueMode = false;
  renderReviewDrawer();
  backdrop.hidden = false;
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  drawer.querySelector(".close-button")?.focus();
}

function closeDrawer() {
  state.selectedId = null;
  state.selectedReviewId = null;
  state.editing = false;
  state.issueMode = false;
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  backdrop.hidden = true;
  document.body.style.overflow = "";
}

function currentItem() {
  return items.find(item => item.id === state.selectedId);
}

function addItemLog(item, text) {
  item.history.unshift([
    new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false }),
    text
  ]);
}

function handleWorkflowAction(action) {
  const item = currentItem();
  if (!item) return;
  if (action === "accept" && item.workflowStatus === "pending") {
    item.workflowStatus = "accepted";
    item.status = "READY";
    item.issueReason = "";
    addItemLog(item, "人工法遵檢視並接收案件");
    toast("已接收案件");
  } else if (action === "na" && item.workflowStatus === "pending") {
    const reason = window.prompt("請填寫不適用理由");
    if (!reason?.trim()) return;
    item.naReason = reason.trim();
    item.workflowStatus = "na";
    addItemLog(item, `人工標記不適用：${item.naReason}`);
    toast("已標記不適用");
  } else if (action === "assign" && item.workflowStatus === "accepted") {
    item.method = document.querySelector("#workflowMethod")?.value || item.method;
    item.draft = document.querySelector("#workflowDraft")?.value.trim() || item.draft;
    item.workflowStatus = "notified";
    item.replies = Object.fromEntries(item.departments.map(department => [department, false]));
    addItemLog(item, `人工選擇「${item.method}」並分派相關部門`);
    toast("已完成分派");
  } else if (action === "close" && item.workflowStatus === "replied") {
    item.workflowStatus = "closed";
    addItemLog(item, "人工複核並結案");
    toast("案件已結案");
  } else {
    return;
  }
  persist();
  render();
  renderDrawer();
}

function toggleDepartment(department) {
  const item = currentItem();
  if (!item || item.workflowStatus !== "notified" || !item.departments.includes(department)) return;
  item.replies[department] = !item.replies[department];
  addItemLog(item, `${department} ${item.replies[department] ? "已回覆" : "改為待回覆"}`);
  if (item.departments.every(name => item.replies[name])) {
    item.workflowStatus = "replied";
    toast("所有部門已回覆，等待人工複核");
  }
  persist();
  render();
  renderDrawer();
}

function resolveReview(status) {
  const review = reviews.find(item => item.id === state.selectedReviewId);
  if (!review) return;
  const note = document.querySelector("#reviewNote")?.value.trim() || "";
  if (status === "RETURNED" && !note) return toast("退回補件請填寫原因");
  review.status = status;
  review.note = note;
  review.decisionAt = new Date().toLocaleString("zh-TW", { hour12: false });
  const regulation = items.find(item => item.id === review.regulationId);
  if (regulation) {
    if (status === "APPROVED") {
      regulation.workflowStatus = "closed";
      addItemLog(regulation, `人工複核核准並結案：${note || "無補充意見"}`);
    } else if (status === "RETURNED") {
      regulation.workflowStatus = "notified";
      regulation.replies = Object.fromEntries(regulation.departments.map(department => [department, false]));
      addItemLog(regulation, `人工複核退回補件：${note}`);
    } else {
      regulation.workflowStatus = "replied";
      addItemLog(regulation, `案件改由人工接手：${note || "無補充意見"}`);
    }
  }
  persist();
  render();
  renderReviewDrawer();
  const labels = { APPROVED: "案件已核准", RETURNED: "已退回補件", TAKEOVER: "已改為人工接手" };
  toast(labels[status]);
}

function saveEdit() {
  const item = currentItem();
  const form = document.querySelector("#classificationForm");
  if (!item || !form) return;
  const categories = [...form.querySelectorAll('input[name="category"]:checked')].map(input => input.value);
  if (!categories.length) return toast("請至少選擇一個保險類別");
  item.action = form.elements.action.value;
  item.categories = categories;
  item.classificationReason = form.elements.reason.value.trim() || "人工已調整分類，理由待補充。";
  item.status = "REVIEW";
  item.issueReason = "";
  item.history.unshift([new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }), "人工修改分類，等待最終確認"]);
  state.editing = false;
  persist();
  render();
  renderDrawer();
  toast("分類已修改，請確認後完成審核");
}

function confirmClassification() {
  const item = currentItem();
  if (!item) return;
  item.status = "READY";
  item.issueReason = "";
  item.history.unshift([new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }), "人工確認 AI 分類"]);
  persist();
  render();
  renderDrawer();
  toast("已確認分類並留下審核紀錄");
}

function markIssue() {
  state.issueMode = true;
  renderDrawer();
}

function saveIssue() {
  const item = currentItem();
  const form = document.querySelector("#issueForm");
  if (!item || !form) return;
  const reason = form.elements.reason.value.trim();
  if (!reason) return toast("請填寫資料缺口");
  item.status = "ISSUE";
  item.issueReason = reason;
  item.history.unshift([new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }), `人工標記資料缺口：${reason}`]);
  state.issueMode = false;
  persist();
  render();
  renderDrawer();
  toast("已標記為資料缺口");
}

function exportCsv() {
  const rows = [["發布日期", "機關", "異動類型", "法規名稱", "保險類別", "AI分類狀態", "案件狀態", "AI信心"]];
  filteredItems().forEach(item => rows.push([
    item.date, item.authority, item.action, item.title, item.categories.join("／"),
    STATUS_LABEL[item.status], WORKFLOW_LABEL[item.workflowStatus], `${item.confidence}%`
  ]));
  const csv = "\uFEFF" + rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "reglens-prototype.csv";
  link.click();
  URL.revokeObjectURL(url);
  toast("已匯出目前篩選結果");
}

app.addEventListener("click", event => {
  const reviewOpener = event.target.closest("[data-review-id]");
  if (reviewOpener) return openReviewDrawer(reviewOpener.dataset.reviewId);
  const opener = event.target.closest("[data-open-id]");
  if (opener) return openDrawer(opener.dataset.openId);
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "clear-filters") {
    Object.assign(state, { query: "", action: "全部", category: "全部", status: "全部" });
    render();
  }
  if (action === "export") exportCsv();
  if (action === "reset" && window.confirm("要清除人工修改並還原示意資料嗎？")) {
    items = clone(PROTOTYPE_DATA);
    reviews = clone(PROTOTYPE_REVIEWS);
    normalizeWorkflows();
    Object.assign(state, { query: "", action: "全部", category: "全部", status: "全部" });
    persist();
    render();
    toast("已還原示意資料");
  }
});

app.addEventListener("input", event => {
  if (event.target.id !== "searchInput") return;
  state.query = event.target.value;
  const cursor = event.target.selectionStart;
  render();
  const input = document.querySelector("#searchInput");
  input.focus();
  input.setSelectionRange(cursor, cursor);
});

app.addEventListener("change", event => {
  if (event.target.id === "actionFilter") state.action = event.target.value;
  else if (event.target.id === "categoryFilter") state.category = event.target.value;
  else if (event.target.id === "statusFilter") state.status = event.target.value;
  else if (event.target.id === "caseReasonFilter") state.caseReason = event.target.value;
  else return;
  render();
});

drawer.addEventListener("click", event => {
  const linkedReview = event.target.closest("[data-linked-review]")?.dataset.linkedReview;
  if (linkedReview) return openReviewDrawer(linkedReview);
  const department = event.target.closest("[data-department]")?.dataset.department;
  if (department) return toggleDepartment(department);
  const workflowAction = event.target.closest("[data-workflow-action]")?.dataset.workflowAction;
  if (workflowAction) return handleWorkflowAction(workflowAction);
  const reviewAction = event.target.closest("[data-review-action]")?.dataset.reviewAction;
  if (reviewAction) return resolveReview(reviewAction);
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "close-drawer") closeDrawer();
  if (action === "edit") { state.editing = true; state.issueMode = false; renderDrawer(); }
  if (action === "cancel-edit") { state.editing = false; renderDrawer(); }
  if (action === "save-edit") saveEdit();
  if (action === "confirm") confirmClassification();
  if (action === "mark-issue") markIssue();
  if (action === "cancel-issue") { state.issueMode = false; renderDrawer(); }
  if (action === "save-issue") saveIssue();
});

backdrop.addEventListener("click", closeDrawer);
document.addEventListener("keydown", event => { if (event.key === "Escape") closeDrawer(); });

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    state.status = "全部";
    render();
    app.focus();
  });
});

document.querySelector("#themeToggle").addEventListener("click", () => {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("reglens-theme", next); } catch (_) {}
});

try {
  const savedTheme = localStorage.getItem("reglens-theme");
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
} catch (_) {}

render();
