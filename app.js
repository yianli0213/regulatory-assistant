const TYPE_LABEL={law:'法規更新',case:'裁罰案例'};
const PERIODS=['本月','近 3 個月','近 1 年'];
const IMPACTS=['商品','內規','作業流程'];
const STATUS_LABEL={pending:'待接收',accepted:'處理中',notified:'處理中',replied:'處理中',closed:'已結案',na:'不適用'};
const STATUS_CLASS={pending:'pending',accepted:'doing',notified:'doing',replied:'doing',closed:'closed',na:'na'};
let ITEMS=[],CASES=[];
// 用 backend/server.py 開啟（http://localhost:8000）時，自動讀寫資料庫；直接用檔案開啟（file://）則使用 data.js 的示意資料
const API_BASE=location.protocol==='file:'?'':location.origin;
let useApi=false;
function normalize(){ITEMS.forEach(i=>{i.log=i.log||[['○:○','AI','抓取並標示生效日（示意）'],['○:○','AI','整理重點並對應項目，附條文依據（示意）']];
 i.replied=i.replied||{};i.method=i.method||'通報';i.draft=i.draft||null;i.editing=false;i.naOpen=false;i.open=null;});}
async function remote(it,payload){
  try{
    const res=await fetch(API_BASE+'/api/items/'+it.id+'/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await res.json();
    if(!res.ok){toast(data.error||'操作失敗');return false;}
    const open=it.open;
    Object.assign(it,data,{editing:false,naOpen:false,open});
    return true;
  }catch(e){toast('連不到後端');return false;}
}
async function loadData(){
  if(!API_BASE){ITEMS=SAMPLE_ITEMS;CASES=SAMPLE_CASES;normalize();return;}
  try{
    const [a,b]=await Promise.all([fetch(API_BASE+'/api/items'),fetch(API_BASE+'/api/cases')]);
    if(!a.ok||!b.ok)throw new Error('HTTP '+a.status+'/'+b.status);
    ITEMS=await a.json();CASES=await b.json();useApi=true;
  }catch(err){
    ITEMS=SAMPLE_ITEMS;CASES=SAMPLE_CASES;
    setTimeout(()=>toast('讀取後端失敗，暫用示意資料'),0);
  }
  normalize();
}
const state={filters:{status:[],type:[],impact:[],period:[]},caseReason:'全部',closedGlobal:[]};
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const now=()=>{try{return new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false})}catch(e){return '--:--'}};
function addLog(it,who,text){it.log.push([now(),who,text]);}
function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>el.hidden=true,2200);}
function depts(it){return [...new Set(it.rows.flatMap(r=>r.unit.split('、')).filter(x=>x&&x!=='—'))];}
function step(it){ // current step 1..6, 7 = finished
  if(it.status==='pending')return 3; if(it.status==='accepted')return 4; if(it.status==='notified')return 5; if(it.status==='replied')return 6; return 7;}
function draftText(it){return '【草稿】主旨：'+it.title.replace('【範例】','')+'\n說明：請 '+depts(it).join('、')+' 檢視本項法規對所屬業務的影響，並於 ○/○ 前回覆（日期為示意）。\n處理方式：'+it.method+'。';}

function filtered(){const f=state.filters;
  return ITEMS.filter(i=>(!f.status.length||f.status.includes(STATUS_LABEL[i.status]))&&(!f.type.length||f.type.includes(TYPE_LABEL[i.type]))&&
   (!f.impact.length||i.rows.some(r=>f.impact.includes(r.kind)))&&(!f.period.length||f.period.includes(i.period)));}
function group(name,key,opts){return '<div><h3>'+name+'</h3>'+opts.map(o=>'<label><input type="checkbox" data-f="'+key+'" value="'+o+'"'+(state.filters[key].includes(o)?' checked':'')+'> '+o+'</label>').join('')+'</div>';}

function viewHome(){
  const list=filtered();
  const cnt=k=>ITEMS.filter(i=>STATUS_LABEL[i.status]===k).length;
  return '<div class="stats">'+['待接收','處理中','已結案','不適用'].map(k=>'<div class="stat"><b>'+cnt(k)+'</b><small>'+k+'</small></div>').join('')+'</div>'+
  '<div class="layout"><aside class="filters" aria-label="篩選">'+
   group('狀態','status',['待接收','處理中','已結案','不適用'])+group('類型','type',['法規更新','裁罰案例'])+group('影響項目','impact',IMPACTS)+group('時間','period',PERIODS)+
   '<button class="btn" type="button" data-act="clear">清除篩選</button></aside>'+
   '<section class="feed" aria-label="最新動態">'+(list.length?list.map(i=>
    '<article class="card" tabindex="0" data-open="'+i.id+'"><div><h2>'+esc(i.title)+'</h2><div class="meta">'+i.source+'｜'+i.no+'｜發布 '+i.pub+'｜生效 '+i.eff+'（'+i.left+'）</div>'+
    '<div class="chips"><span class="chip type">'+TYPE_LABEL[i.type]+'</span>'+[...new Set(i.rows.map(r=>r.kind))].map(k=>'<span class="chip">'+k+'</span>').join('')+'<span class="chip">'+i.period+'</span></div></div>'+
    '<span class="pill '+STATUS_CLASS[i.status]+'">'+STATUS_LABEL[i.status]+'</span></article>').join(''):'<div class="empty">沒有符合條件的項目。調整左側篩選，或按「清除篩選」。</div>')+'</section></div>';
}

function stepper(it){
  const cur=step(it);
  const S=[['AI','新法規出現'],['AI','整理與對應'],['人','法遵檢視'],['AI','建議處理方式'],['人','決定與分派'],['AI','追蹤執行']];
  return '<div class="steps">'+S.map((s,i)=>{const n=i+1;let c='step'+(s[0]==='人'?' human':'');
    if(it.status==='na'){c+=n<3?' done':(n===3?' done':' skip');}else{if(n<cur)c+=' done';else if(n===cur)c+=' current';}
    return '<div class="'+c+'"><span class="who2">'+n+'　'+(s[0]==='AI'?'AI 協助':'人工')+'</span><b>'+s[1]+'</b></div>';}).join('')+'</div>';
}

function mapTable(it){
  const ed=it.editing;
  return '<div class="tablewrap"><table><thead><tr><th>受影響項目</th><th>類型</th><th>依據條文</th><th>可能缺口（草稿）</th><th>負責單位</th><th>建議影響程度</th></tr></thead><tbody>'+
  it.rows.map((r,i)=>{
    const open=it.open===i;
    const lvl=ed?'<select data-lvl="'+i+'" aria-label="影響程度">'+['高','中','低'].map(l=>'<option'+(l===r.level?' selected':'')+'>'+l+'</option>').join('')+'</select>':
      '<span class="lvl '+({高:'h',中:'m',低:'l'}[r.level])+'">'+r.level+'</span>（AI 建議）<br><span class="hint">'+esc(r.why)+'</span>';
    const gap=ed?'<input type="text" data-gap="'+i+'" value="'+esc(r.gap)+'" aria-label="可能缺口">':esc(r.gap);
    return '<tr class="row'+(open?' open':'')+'" data-row="'+i+'"><td>'+(open?'▾ ':'▸ ')+esc(r.name)+'</td><td>'+r.kind+'</td><td>'+r.art+'</td><td>'+gap+'</td><td>'+esc(r.unit)+'</td><td>'+lvl+'</td></tr>'+
    (open?'<tr class="open"><td colspan="6" class="detail"><b>條文原文：</b>'+QUOTE+'　<b>信心：</b>'+r.conf+'</td></tr>':'');}).join('')+'</tbody></table></div>';
}

function viewDetail(it){
  const cur=step(it);
  let h='<a class="back" href="#home">← 回動態首頁</a><div class="dhead"><div><h2>'+esc(it.title)+'</h2><div class="meta">'+it.source+'｜'+it.no+'｜發布 '+it.pub+'｜生效 '+it.eff+'（'+it.left+'）</div></div><span class="pill '+STATUS_CLASS[it.status]+'">'+STATUS_LABEL[it.status]+'</span></div>';
  if(it.status==='pending'){
    h+='<div class="actions"><button class="btn primary" type="button" data-act="accept">接收</button><button class="btn" type="button" data-act="edit">'+(it.editing?'儲存修正':'修正對應')+'</button><button class="btn" type="button" data-act="naopen">標記不適用（填理由）</button></div>';
    if(it.naOpen)h+='<div class="panel"><h3>標記不適用</h3><label for="nareason" class="hint">請寫下理由，這會留在處理紀錄中。</label><textarea id="nareason" placeholder="例如：與本公司業務無關"></textarea><div class="actions"><button class="btn primary" type="button" data-act="nasave">確認標記</button><button class="btn" type="button" data-act="naclose">取消</button></div></div>';
  }
  h+=stepper(it);
  h+='<div class="panel"><h3>重點摘要（AI 擷取）</h3><p style="margin:0">'+esc(it.summary)+'</p></div>';
  h+='<div class="panel"><h3>對應表</h3>'+mapTable(it)+'<p class="hint" style="margin:8px 0 0">點一列可看條文原文與信心。建議影響程度由 AI 先給，人再確認或修改。</p></div>';
  if(it.status==='na')h+='<div class="panel"><h3>不適用理由</h3><p style="margin:0">'+esc(it.naReason||'')+'</p></div>';
  if(['accepted','notified','replied','closed'].includes(it.status)){
    const locked=it.status!=='accepted';
    h+='<div class="panel"><h3>建議處理方式與通知草稿</h3><div class="opts" role="radiogroup" aria-label="處理方式">'+['通報','召開會議','商品評議'].map(m=>'<label><input type="radio" name="method" value="'+m+'"'+(it.method===m?' checked':'')+(locked?' disabled':'')+'> '+m+'</label>').join('')+'</div>'+
     '<label class="hint" for="draft">通知草稿（可編輯，送出前不會通知任何人）</label><textarea id="draft"'+(locked?' disabled':'')+'>'+esc(it.draft||draftText(it))+'</textarea>'+
     (locked?'':'<div class="actions"><button class="btn primary" type="button" data-act="send">確認送出（示意）</button></div>')+'</div>';
  }
  if(['notified','replied','closed'].includes(it.status)){
    h+='<div class="panel"><h3>決定與分派：部門回覆</h3><div class="depts">'+depts(it).map(d=>{const ok=it.replied[d];return '<button class="btn'+(ok?' primary':'')+'" type="button" data-dept="'+esc(d)+'"'+(it.status==='closed'?' disabled':'')+'>'+esc(d)+(ok?'　已回覆':'　待回覆')+'</button>';}).join('')+'</div><p class="hint" style="margin:8px 0 0">按部門名稱可切換回覆狀態（示意）。全部回覆後可進入追蹤。</p></div>';
  }
  if(it.status==='replied')h+='<div class="panel"><h3>追蹤執行</h3><p style="margin:0">生效日倒數：'+it.left+'。各部門皆已回覆，由法遵複核後結案。</p><div class="actions"><button class="btn primary" type="button" data-act="close">複核並結案</button></div></div>';
  const cs=CASES.filter(c=>it.cases.includes(c.id));
  h+='<div class="panel"><h3>相關裁罰案例（示意）</h3>'+(cs.length?cs.map(c=>'<p style="margin:0 0 8px"><b>'+esc(c.title)+'</b><br><span class="hint">年度：'+c.year+'｜事由／違反條文：'+c.article+'｜處分內容與金額：'+c.penalty+'｜與本法規的關聯：'+c.rel+'｜來源：金管會裁罰公告連結（示意）</span></p>').join(''):'<p class="hint" style="margin:0">目前沒有對應的案例。</p>')+'</div>';
  h+='<div class="panel"><h3>本項處理紀錄</h3><ul class="log">'+it.log.map(l=>'<li><span class="t">'+l[0]+'</span><span class="who-tag">'+l[1]+'</span><span>'+esc(l[2])+'</span></li>').join('')+'</ul></div>';
  return h;
}

function viewCases(){
  const reasons=['全部',...new Set(CASES.map(c=>c.reason))];
  const list=CASES.filter(c=>state.caseReason==='全部'||c.reason===state.caseReason);
  return '<h2 style="font-size:18px;color:var(--heading);margin:0 0 6px">裁罰案例庫</h2><p class="hint" style="margin:0 0 12px">蒐集公開裁罰案例，作為判斷風險輕重的參考。下列案例皆為示意。</p>'+
   '<div class="toolbar" role="group" aria-label="事由篩選">'+reasons.map(r=>'<button class="btn'+(state.caseReason===r?' primary':'')+'" type="button" data-reason="'+r+'">'+r+'</button>').join('')+'</div>'+
   '<div class="panel"><div class="tablewrap"><table><thead><tr><th>案例</th><th>年度</th><th>事由</th><th>違反條文</th><th>處分內容與金額</th><th>來源</th></tr></thead><tbody>'+
   (list.length?list.map(c=>'<tr><td>'+esc(c.title)+'</td><td>'+c.year+'</td><td>'+c.reason+'</td><td>'+c.article+'</td><td>'+c.penalty+'</td><td>金管會裁罰公告連結（示意）</td></tr>').join(''):'<tr><td colspan="6">沒有符合的案例。</td></tr>')+'</tbody></table></div></div>';
}
function viewLog(){
  const all=ITEMS.flatMap(i=>i.log.map(l=>({t:l[0],who:l[1],text:l[2],title:i.title,id:i.id})));
  return '<h2 style="font-size:18px;color:var(--heading);margin:0 0 6px">處理紀錄</h2><p class="hint" style="margin:0 0 12px">誰在何時接收、通知了哪些部門、做了什麼決定，都留在這裡，方便稽核與回顧。</p>'+
   '<div class="panel"><ul class="log">'+all.map(l=>'<li><span class="t">'+l.t+'</span><span class="who-tag">'+l.who+'</span><span><a href="#detail-'+l.id+'">'+esc(l.title)+'</a>：'+esc(l.text)+'</span></li>').join('')+'</ul></div>';
}

function route(){
  const h=(location.hash||'#home').slice(1);
  let tab='home',html;
  const m=h.match(/^detail-(\d+)$/);
  if(m){const it=ITEMS.find(i=>i.id==m[1]);if(it){html=viewDetail(it);}else{html=viewHome();}}
  else if(h==='cases'){tab='cases';html=viewCases();}
  else if(h==='log'){tab='log';html=viewLog();}
  else html=viewHome();
  $('#view').innerHTML=html;
  document.querySelectorAll('#tabs a').forEach(a=>{if(a.dataset.tab===tab)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
}
function cur(){const m=(location.hash||'').match(/^#detail-(\d+)$/);return m?ITEMS.find(i=>i.id==m[1]):null;}
function keepDraft(it){const d=$('#draft');if(d&&!d.disabled)it.draft=d.value;const m=document.querySelector('input[name=method]:checked');if(m&&!m.disabled)it.method=m.value;}

document.addEventListener('click',async e=>{
  const open=e.target.closest('[data-open]');if(open){location.hash='detail-'+open.dataset.open;return;}
  const row=e.target.closest('[data-row]');if(row&&!e.target.closest('select,input')){const it=cur();if(it){it.open=it.open==+row.dataset.row?null:+row.dataset.row;route();}return;}
  const reason=e.target.closest('[data-reason]');if(reason){state.caseReason=reason.dataset.reason;route();return;}
  const dept=e.target.closest('[data-dept]');if(dept){const it=cur();if(!it)return;const d=dept.dataset.dept;
    if(useApi){const ok=await remote(it,{action:'dept',dept:d,replied:!it.replied[d]});route();return;}
    it.replied[d]=!it.replied[d];
    addLog(it,'人工',d+(it.replied[d]?' 已回覆':' 改為待回覆'));
    it.status=depts(it).every(x=>it.replied[x])?'replied':'notified';route();return;}
  const b=e.target.closest('[data-act]');if(!b)return;const it=cur();const a=b.dataset.act;
  if(a==='clear'){state.filters={status:[],type:[],impact:[],period:[]};route();return;}
  if(!it)return;
  if(useApi){
    let p=null,msg='';
    if(a==='accept'){p={action:'accept'};msg='已接收，請選擇處理方式';}
    else if(a==='edit'&&it.editing){p={action:'edit',rows:it.rows.map(r=>({id:r.id,gap:r.gap,level:r.level}))};msg='已儲存修正，並記入處理紀錄';}
    else if(a==='nasave'){const v=($('#nareason').value||'').trim();if(!v){toast('請先寫下不適用的理由');return;}p={action:'na',reason:v};msg='已標記不適用，理由已留下紀錄';}
    else if(a==='send'){keepDraft(it);p={action:'send',method:it.method,draft:it.draft||draftText(it)};msg='已記錄送出';}
    else if(a==='close'){p={action:'close'};msg='已結案';}
    if(p){const ok=await remote(it,p);route();if(ok)toast(msg);return;}
  }
  if(a==='accept'){it.status='accepted';it.editing=false;addLog(it,'人工','法遵檢視並接收');route();toast('已接收，請選擇處理方式');}
  else if(a==='edit'){if(it.editing){it.editing=false;addLog(it,'人工','修正對應並儲存');toast('已儲存修正，並記入處理紀錄');}else{it.editing=true;}route();}
  else if(a==='naopen'){it.naOpen=true;route();}
  else if(a==='naclose'){it.naOpen=false;route();}
  else if(a==='nasave'){const v=($('#nareason').value||'').trim();if(!v){toast('請先寫下不適用的理由');return;}it.naReason=v;it.status='na';it.naOpen=false;addLog(it,'人工','標記不適用，理由：'+v);route();toast('已標記不適用，理由已留下紀錄');}
  else if(a==='send'){keepDraft(it);it.draft=it.draft||draftText(it);it.status='notified';addLog(it,'人工','選擇「'+it.method+'」並確認送出通知（示意，未真的寄出）');route();toast('已記錄送出（示意）');}
  else if(a==='close'){it.status='closed';addLog(it,'人工','複核並結案');route();toast('已結案');}
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.card')){e.preventDefault();location.hash='detail-'+e.target.dataset.open;}});
document.addEventListener('change',e=>{
  const f=e.target.dataset&&e.target.dataset.f;
  if(f){const arr=state.filters[f];const v=e.target.value;if(e.target.checked)arr.push(v);else arr.splice(arr.indexOf(v),1);route();return;}
  const it=cur();if(!it)return;
  if(e.target.dataset.lvl!==undefined){it.rows[+e.target.dataset.lvl].level=e.target.value;}
  if(e.target.name==='method'){it.method=e.target.value;if(!$('#draft').disabled){const was=$('#draft').value;if(!it.draft||was===draftText({...it,method:it.prevMethod||'通報'}))it.draft=null;it.prevMethod=e.target.value;route();}}
});
document.addEventListener('input',e=>{const it=cur();if(!it)return;if(e.target.dataset.gap!==undefined)it.rows[+e.target.dataset.gap].gap=e.target.value;if(e.target.id==='draft')it.draft=e.target.value;});
window.addEventListener('hashchange',route);
$('#themebtn').addEventListener('click',()=>{const r=document.documentElement;const dark=r.getAttribute('data-theme')==='dark'||(!r.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme: dark)').matches);r.setAttribute('data-theme',dark?'light':'dark');});
loadData().then(route);
