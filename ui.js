let selectedCats = new Set(['식당','편의점','카페','학습','복지','문화']);
let currentSourceIdx = 0;
let currentView = 'desktop';
let isManualToggle = false;

function init() {
  const notice = document.getElementById('bottom-notice');
  if (notice) notice.textContent = `등록된 시설 ${SAMPLE_FACILITIES.length}개 · 운영 시간은 변경될 수 있음`;
  
  initNotice(); // 공지사항 초기화

  handleResize();
  window.addEventListener('resize', handleResize);
  renderViewTable();
  startClock();
}

function initNotice() {
  const bar = document.getElementById('top-notice-bar');
  const title = document.getElementById('notice-bar-title');
  const content = document.getElementById('notice-modal-content');
  const modalHeader = document.querySelector('.notice-modal-header');
  
  if (typeof NOTICE_DATA !== 'undefined' && NOTICE_DATA.active) {
    bar.style.display = 'flex';
    
    // 상단 공지사항 바 제목 + 부제 적용
    title.innerHTML = `<span style="font-weight:700;">${NOTICE_DATA.title}</span>` + 
                      (NOTICE_DATA.subtitle ? ` <span style="font-weight:400; margin-left:6px; color:#fecaca;">${NOTICE_DATA.subtitle}</span>` : '');
    
    // 모달 창 제목 + 부제 적용 (index.html 수정 없이 DOM으로 덮어쓰기)
    if (modalHeader) {
      modalHeader.innerHTML = `<span style="font-weight:700;">📢 ${NOTICE_DATA.title}</span>` + 
                              (NOTICE_DATA.subtitle ? ` <span style="font-weight:400; margin-left:6px; color:var(--gray-600);">${NOTICE_DATA.subtitle}</span>` : '');
    }

    content.innerHTML = NOTICE_DATA.content;
  } else {
    bar.style.display = 'none';
  }
}

function openNoticeModal() {
  document.getElementById('overlay').classList.add('active');
  document.getElementById('notice-modal').classList.add('active');
}

function closeNoticeModal() {
  document.getElementById('notice-modal').classList.remove('active');
  if (!document.getElementById('sidebar').classList.contains('active')) {
    document.getElementById('overlay').classList.remove('active');
  }
}

function handleResize() {
  if (isManualToggle) return;
  const w = window.innerWidth;
  if (w < 750 && currentView === 'desktop') setView('mobile');
  else if (w >= 750 && currentView === 'mobile') setView('desktop');
}

function setView(mode) {
  currentView = mode;
  document.body.className = mode + '-view';
  document.getElementById('btn-desktop').classList.toggle('active', mode === 'desktop');
  document.getElementById('btn-mobile').classList.toggle('active', mode === 'mobile');
  
  const btnMini = document.getElementById('btn-mini');
  if (btnMini) btnMini.textContent = mode === 'desktop' ? '💻' : '📱';
  
  renderViewTable();
}

function toggleView(mode) {
  isManualToggle = true;
  setView(mode);
}

function handleSearch(val) {
  if (currentView === 'mobile' && val.trim().length > 0) {
    selectedCats = new Set(['식당','편의점','카페','학습','복지','문화']);
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.add('active'));
    const select = document.getElementById('mobile-cat-select');
    if (select) select.value = 'all';
  }
  renderViewTable();
}

function startClock() {
  function tick() {
    const now = new Date(), dN = ['일','월','화','수','목','금','토'];
    const clock = document.getElementById('clock');
    if (clock) {
      const hh = String(now.getHours()).padStart(2,'0');
      const mm = String(now.getMinutes()).padStart(2,'0');
      if (window.innerWidth < 450) {
        const mo = String(now.getMonth()+1).padStart(2,'0');
        const dd = String(now.getDate()).padStart(2,'0');
        clock.innerHTML = `${mo}. ${dd}. ${hh}:${mm}`;
      } else {
        clock.innerHTML = `${now.getMonth()+1}월 ${now.getDate()}일 (${dN[now.getDay()]}) ${hh}:${mm}`;
      }
    }
    renderViewTable();
  }
  tick(); 
  window.addEventListener('resize', tick);
  setInterval(tick, 30000);
}

function formatTimeWithDimming(totalMin) {
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  const hS = String(h).padStart(2, '0'), mS = String(m).padStart(2, '0');
  const hH = (hS[0] === '0' ? `<span class="dim-zero">0</span>` : hS[0]) + hS[1];
  const mH = (mS[0] === '0' ? `<span class="dim-zero">0</span>` : mS[0]) + mS[1];
  return `${hH} : ${mH}`;
}

function renderViewTable() {
  const now = new Date(), tbody = document.getElementById('view-tbody');
  const q = document.getElementById('search-input').value.toLowerCase();
  if (!tbody) return;

  let list = SAMPLE_FACILITIES.filter(f => selectedCats.has(f.category) || (selectedCats.has('복지') && f.category.includes('복지')));
  if (q) list = list.filter(f => f.name.toLowerCase().includes(q) || f.buildingCode.toLowerCase().includes(q));
  
  list.sort((a,b) => {
    const stA = TimeManager.getStatus(a, now), stB = TimeManager.getStatus(b, now);
    if (stA.status === 'green' && stB.status !== 'green') return -1;
    if (stA.status !== 'green' && stB.status === 'green') return 1;
    return (stA.rem || 9999) - (stB.rem || 9999);
  });

  tbody.innerHTML = list.map(f => {
    const st = TimeManager.getStatus(f, now), b = BUILDINGS[f.buildingCode] || {name:''};
    const remV = st.status === 'green' ? formatTimeWithDimming(st.rem) : (st.rem ? (st.rem < 1440 ? formatTimeWithDimming(st.rem) : Math.floor(st.rem/1440)+'일') : '');
    const remL = st.status === 'green' ? ' 뒤 폐쇄' : (st.rem ? ' 뒤 개방' : '운영 종료');
    let dotCl = `dot-${st.status}`;
    if (st.rem !== null && st.rem < 60) dotCl = 'dot-yellow';
    
    let tCell = '<span class="time-cell" style="color:#aaa">-</span>';
    if (st.timeStr) {
      const p = st.timeStr.split('~');
      tCell = `<span class="time-cell" style="color:${st.status==='green'?'#aaa':'var(--black)'}">${p[0]}~</span><span class="time-cell" style="color:${st.status==='green'?'var(--black)':'#aaa'}">${p[1]}</span>`;
    }

    const isMob = currentView === 'mobile';
    const locHtml = isMob ? '' : `<span style="font-family:var(--mono);font-weight:700;font-size:13px">${f.buildingCode}-${f.floor}</span> <span style="color:#aaa;font-size:13px;font-weight:300">${b.name}</span>`;
    
    const nameHtml = isMob 
      ? `<div class="facility-name-cell">
           <div class="mobile-loc-text">${f.buildingCode}-${f.floor} · ${b.name}</div>
           <div onclick="openSidebar('${f.id}')" style="display:inline-flex; align-items:center; gap:8px; cursor:pointer;">
             <span class="status-dot ${dotCl}"></span>${f.name}
             <span style="color:var(--gray-400); font-size:11px; margin-left:2px;">❯</span>
           </div>
         </div>`
      : `<div class="facility-name-cell"><span class="status-dot ${dotCl}"></span>${f.name}</div>`;

    const trTag = isMob ? `<tr>` : `<tr onclick="openSidebar('${f.id}')">`;

    return `${trTag}
      <td class="col-loc">${locHtml}</td>
      <td class="col-cat"><span style="color:#aaa;font-size:13px;font-weight:300">${f.category.slice(0,2)}</span></td>
      <td class="col-name">${nameHtml}</td>
      <td class="col-rem"><span class="time-cell" style="color:var(--black)">${remV}</span><span class="time-cell" style="color:#aaa">${remL}</span></td>
      <td class="col-time">${tCell}</td>
    </tr>`;
  }).join('');
}

function handleMobileCat(val) {
  if (val === 'all') {
    selectedCats = new Set(['식당','편의점','카페','학습','복지','문화']);
  } else if (val === '복지·문화') {
    selectedCats = new Set(['복지', '문화']);
  } else {
    selectedCats = new Set([val]);
  }
  
  const allActive = selectedCats.size === 6;
  document.querySelectorAll('.cat-btn').forEach(b => {
    const bT = b.textContent;
    let act = (bT === '복지·문화') ? (selectedCats.has('복지') || selectedCats.has('문화') || allActive) : (selectedCats.has(bT) || allActive);
    b.classList.toggle('active', act);
  });
  
  renderViewTable();
}

function toggleCat(cat, btn) {
  if (cat === '복지·문화') {
    if (selectedCats.size <= 2 && (selectedCats.has('복지') || selectedCats.has('문화'))) {
      selectedCats = new Set(['식당','편의점','카페','학습','복지','문화']);
    } else { selectedCats = new Set(['복지', '문화']); }
  } else {
    if (selectedCats.size === 1 && selectedCats.has(cat)) {
      selectedCats = new Set(['식당','편의점','카페','학습','복지','문화']);
    } else { selectedCats = new Set([cat]); }
  }
  
  const allActive = selectedCats.size === 6;
  
  document.querySelectorAll('.cat-btn').forEach(b => {
    const bT = b.textContent;
    let act = (bT === '복지·문화') ? (selectedCats.has('복지') || selectedCats.has('문화') || allActive) : (selectedCats.has(bT) || allActive);
    b.classList.toggle('active', act);
  });
  
  const select = document.getElementById('mobile-cat-select');
  if (select) {
    if (allActive) select.value = 'all';
    else select.value = cat;
  }
  
  renderViewTable();
}

function openSidebar(id) { currentSourceIdx = 0; renderSidebarContent(id); document.getElementById('sidebar').classList.add('active'); document.getElementById('overlay').classList.add('active'); }
function goToSource(id, index) { currentSourceIdx = index; renderSidebarContent(id); }

function renderSidebarContent(id) {
  const f = SAMPLE_FACILITIES.find(i => i.id === id), b = BUILDINGS[f.buildingCode] || { name: f.buildingCode, alias: "" };
  const now = new Date(), st = TimeManager.getStatus(f, now), photos = PHOTO_UPDATES[id] || [], info = photos[currentSourceIdx] || null;
  let dotC = st.status === 'green' ? 'var(--green)' : 'var(--gray-dot)';
  if (st.rem !== null && st.rem < 60) dotC = 'var(--yellow)';
  const remInfo = st.rem ? `<span style="color:${dotC}; margin-left: 12px;">${formatTimeWithDimming(st.rem)} 뒤 ${st.status === 'green' ? '폐쇄' : '개방'}</span>` : '';
  const targetFile = info ? info.file : `${id}_1.jpg`;
  const imgPath = `image/${targetFile}`;
  let dotHtml = photos.length > 1 ? `<div class="sb-dot-container">` + photos.map((_, i) => `<div class="sb-dot ${i === currentSourceIdx ? 'active' : ''}" onclick="goToSource('${id}', ${i})"></div>`).join('') + `</div>` : '';
  const body = document.getElementById('sb-body');
  if (!body) return;

  body.innerHTML = `
    <div class="sb-section" style="margin-bottom:28px;">
      <div style="font-size:13.5px; margin-bottom:6px; font-weight:400; color:var(--black);">${f.buildingCode}-${f.floor} ${b.name} <span style="color:var(--gray-400); margin-left:6px;">${b.alias}</span></div>
      <div style="font-size:20px; line-height:1.2; display:flex; align-items:baseline; gap:10px;"><span style="color:var(--black); font-weight:700;">${f.name}</span><span style="color:var(--gray-400); font-weight:400;">${f.category}</span></div>
      <div style="font-weight:700; font-size:13px; color:${dotC}; margin-top:10px;">● ${st.status==='green'?'운영 중':'운영 종료'}${remInfo}</div>
    </div>
    <div class="sb-section" style="margin-bottom:30px;"><div class="sb-label">Operation Hours</div><div class="sb-content">${renderOpHours(f.schedules)}</div></div>
    <div class="sb-section" style="margin-bottom:30px;"><div class="sb-label">Tag</div><div class="sb-content" style="font-size:14px;">${f.tag || '-'}</div></div>
    <div class="sb-source-section">
      <div class="sb-source-header"><div class="sb-label" style="margin-bottom:0;">Info Source</div><div style="display:flex; align-items:center;">${info ? `<span class="sb-source-date">Updated: ${info.date}</span>` : ''}${info && info.url ? `<a href="${info.url}" target="_blank" class="sb-source-emoji">🔗</a>` : ''}</div></div>
      <div class="sb-source-wrapper">
        <img src="${imgPath}" class="sb-source-img" onclick="expandImage('${imgPath}')" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <div class="sb-no-image-placeholder" style="display:none; font-size:12px; color:var(--gray-400); text-align:center; padding:15px; background:var(--gray-100); border-radius:4px; border:1px dashed var(--gray-200); width:100%;">
          준비된 이미지 없음<br>파일명: <b style="color:var(--black); font-family:var(--mono);">${targetFile}</b>
        </div>
        ${dotHtml}
      </div>
      ${info && info.memo ? `<div style="font-size:12px; color:var(--gray-400); margin-top:12px; line-height:1.5; word-break:break-all;">${info.memo}</div>` : ''}
    </div>`;
}

function renderOpHours(schedules) {
  let d = { sem_wk: '휴무', sem_we: '휴무', vac_wk: '휴무', vac_we: '휴무', hol: '운영' };
  (schedules || []).forEach(s => {
    let t = s.closed ? '휴무' : `${s.open} ~ ${s.close}`;
    if (s.dayType === '평일') { if (s.period !== '방학중') d.sem_wk = t; if (s.period !== '학기중') d.vac_wk = t; }
    else if (['주말', '토', '일'].includes(s.dayType)) { if (s.period !== '방학중') d.sem_we = t; if (s.period !== '학기중') d.vac_we = t; }
    else if (s.dayType === '공휴일') d.hol = t;
  });
  const row = (l, v) => `<div style="font-size:14px; margin-top:2px; font-weight:400;"><span style="color:var(--gray-400); margin-right: 15px;">${l}</span><span style="font-family:var(--mono); color:var(--black);">${v}</span></div>`;
  return `<div style="font-size:14px; font-weight: 400;">[학기중]</div>${row('주중', d.sem_wk)}${row('주말', d.sem_we)}<div style="font-size:14px; font-weight: 400; margin-top: 6px;">[방학중]</div>${row('주중', d.vac_wk)}${row('주말', d.vac_we)}<div style="margin-top: 12px; font-size:14px; font-weight: 400;">[공휴일] ${d.hol}</div>`;
}

function expandImage(src) { const overlay = document.getElementById('img-overlay'); const img = document.getElementById('img-expanded'); if (overlay && img) { img.src = src; overlay.style.display = 'flex'; } }
function closeImage() { const ov = document.getElementById('img-overlay'); if (ov) ov.style.display = 'none'; }
function closeSidebar() { document.getElementById('sidebar').classList.remove('active'); document.getElementById('overlay').classList.remove('active'); }