/**
 * list-ui.js - 에러 수정 버전
 */

// 1. 카테고리 설정 (기존에 선언되어 있지 않을 때만 선언)
if (typeof selectedCats === 'undefined') {
  window.selectedCats = new Set(['식당', '카페', '매점', '학습', '편의']);
}
const DEFAULT_CATS = ['식당', '카페', '매점', '학습', '편의'];

// 2. 페이지 로드 시 초기 실행
window.addEventListener('DOMContentLoaded', () => {
  renderViewTable();
});

/**
 * 검색 처리 함수
 */
function search(val) {
  if (val.trim().length > 0) {
    selectedCats = new Set(DEFAULT_CATS);
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.add('active'));
    const select = document.getElementById('mobile-cat-select');
    if (select) select.value = 'all';
  }
  renderViewTable();
}

/**
 * 시간 포맷팅
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
  const now = new Date();
  const tbody = document.getElementById('view-tbody');
  const searchInput = document.getElementById('search-input');
  const q = searchInput ? searchInput.value.toLowerCase() : "";
  
  if (!tbody) return;

  // 변수 미선언 에러 방지 (currentView)
  const viewMode = typeof currentView !== 'undefined' ? currentView : 'desktop';

  // 1. 카테고리 필터링
  let list = FACILITY.filter(f => selectedCats.has(f.category));
  
  // 2. 검색어 필터링
  if (q) {
    list = list.filter(f => 
      f.name.toLowerCase().includes(q) || 
      f.buildingCode.toLowerCase().includes(q)
    );
  }
  
  // 3. 정렬
  list.sort((a, b) => {
    try {
      const stA = TimeManager.getStatus(a, now);
      const stB = TimeManager.getStatus(b, now);
      if (stA.status === 'green' && stB.status !== 'green') return -1;
      if (stA.status !== 'green' && stB.status === 'green') return 1;
      return (stA.rem || 9999) - (stB.rem || 9999);
    } catch (e) { return 0; }
  });

  // 4. HTML 생성
  tbody.innerHTML = list.map(f => {
    const st = TimeManager.getStatus(f, now);
    const b = BUILDING[f.buildingCode] || {name: ''};
    
    const remV = st.status === 'green' ? formatTimeWithDimming(st.rem) : (st.rem ? (st.rem < 1440 ? formatTimeWithDimming(st.rem) : Math.floor(st.rem/1440)+'일') : '');
    const remL = st.status === 'green' ? ' 뒤 폐쇄' : (st.rem ? ' 뒤 개방' : '운영 종료');
    
    let dotCl = `dot-${st.status}`;
    if (st.rem !== null && st.rem < 60) dotCl = 'dot-yellow';
    
    let tCell = '<span class="time-cell" style="color:#aaa">-</span>';
    if (st.timeStr) {
      const p = st.timeStr.split('~');
      tCell = `<span class="time-cell" style="color:${st.status==='green'?'#aaa':'var(--black)'}">${p[0]}~</span><span class="time-cell" style="color:${st.status==='green'?'var(--black)':'#aaa'}">${p[1]}</span>`;
    }

    const isMob = viewMode === 'mobile';
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

    const trTag = isMob ? `<tr>` : `<tr onclick="openSidebar('${f.id}')" style="cursor:pointer">`;

    return `${trTag}
      <td class="col-loc">${locHtml}</td>
      <td class="col-cat"><span style="color:#aaa;font-size:13px;font-weight:300">${f.category.slice(0,2)}</span></td>
      <td class="col-name">${nameHtml}</td>
      <td class="col-rem"><span class="time-cell" style="color:var(--black)">${remV}</span><span class="time-cell" style="color:#aaa">${remL}</span></td>
      <td class="col-time">${tCell}</td>
    </tr>`;
  }).join('');
}

// 필터 함수들
function filterMobile(val) {
  selectedCats = (val === 'all') ? new Set(DEFAULT_CATS) : new Set([val]);
  updateCatButtons();
  renderViewTable();
}

function filterCategory(cat, btn) {
  if (selectedCats.size === 1 && selectedCats.has(cat)) {
    selectedCats = new Set(DEFAULT_CATS);
  } else {
    selectedCats = new Set([cat]);
  }
  updateCatButtons();
  renderViewTable();
}

function updateCatButtons() {
  const allActive = selectedCats.size === DEFAULT_CATS.length;
  document.querySelectorAll('.cat-btn').forEach(b => {
    const bT = b.textContent.trim();
    b.classList.toggle('active', allActive || selectedCats.has(bT));
  });
  const select = document.getElementById('mobile-cat-select');
  if (select) select.value = allActive ? 'all' : Array.from(selectedCats)[0];
}