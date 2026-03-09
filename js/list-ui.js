function handleSearch(val) {
  if (currentView === 'mobile' && val.trim().length > 0) {
    selectedCats = new Set(['식당','편의점','카페','학습','복지','문화']);
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.add('active'));
    const select = document.getElementById('mobile-cat-select');
    if (select) select.value = 'all';
  }
  renderViewTable();
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