/**
 * 검색 처리 함수
 */
function search(val) {
  // 모바일에서 검색 시 모든 카테고리를 활성화 (순서 준수)
  if (currentView === 'mobile' && val.trim().length > 0) {
    selectedCats = new Set(['식당', '카페', '매점', '학습', '편의']);
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.add('active'));
    const select = document.getElementById('mobile-cat-select');
    if (select) select.value = 'all';
  }
  renderViewTable();
}

/**
 * 시간 포맷팅 (0을 흐리게 표시)
 */
function formatTimeWithDimming(totalMin) {
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  const hS = String(h).padStart(2, '0'), mS = String(m).padStart(2, '0');
  const hH = (hS[0] === '0' ? `<span class="dim-zero">0</span>` : hS[0]) + hS[1];
  const mH = (mS[0] === '0' ? `<span class="dim-zero">0</span>` : mS[0]) + mS[1];
  return `${hH} : ${mH}`;
}

/**
 * 메인 리스트 테이블 렌더링
 */
function renderViewTable() {
  const now = new Date(), tbody = document.getElementById('view-tbody');
  const q = document.getElementById('search-input').value.toLowerCase();
  if (!tbody) return;

  // 1. 카테고리 필터링 (상수명 FACILITY 사용)
  let list = FACILITY.filter(f => selectedCats.has(f.category));
  
  // 2. 검색어 필터링 (시설명 또는 건물코드)
  if (q) list = list.filter(f => f.name.toLowerCase().includes(q) || f.buildingCode.toLowerCase().includes(q));
  
  // 3. 정렬 (운영중인 시설 우선 -> 남은 시간순)
  list.sort((a,b) => {
    const stA = TimeManager.getStatus(a, now), stB = TimeManager.getStatus(b, now);
    if (stA.status === 'green' && stB.status !== 'green') return -1;
    if (stA.status !== 'green' && stB.status === 'green') return 1;
    return (stA.rem || 9999) - (stB.rem || 9999);
  });

  tbody.innerHTML = list.map(f => {
    const st = TimeManager.getStatus(f, now);
    const b = BUILDING[f.buildingCode] || {name:''};
    
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

/**
 * 모바일 카테고리 필터 (Select Box)
 */
function filterMobile(val) {
  if (val === 'all') {
    selectedCats = new Set(['식당', '카페', '매점', '학습', '편의']);
  } else {
    selectedCats = new Set([val]);
  }
  
  const allActive = selectedCats.size === 5;
  document.querySelectorAll('.cat-btn').forEach(b => {
    const bT = b.textContent;
    b.classList.toggle('active', allActive || selectedCats.has(bT));
  });
  
  renderViewTable();
}

/**
 * 카테고리 버튼 필터 (Button Click)
 */
function filterCategory(cat, btn) {
  if (selectedCats.size === 1 && selectedCats.has(cat)) {
    // 이미 하나만 선택된 상태에서 다시 누르면 전체 선택으로 복구 (순서 준수)
    selectedCats = new Set(['식당', '카페', '매점', '학습', '편의']);
  } else {
    selectedCats = new Set([cat]);
  }
  
  const allActive = selectedCats.size === 5;
  
  document.querySelectorAll('.cat-btn').forEach(b => {
    const bT = b.textContent;
    b.classList.toggle('active', allActive || selectedCats.has(bT));
  });
  
  const select = document.getElementById('mobile-cat-select');
  if (select) {
    select.value = allActive ? 'all' : cat;
  }
  
  renderViewTable();
}