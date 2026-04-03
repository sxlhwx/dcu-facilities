/**
 * 사이드바 열기
 */
function openSidebar(id) {
  window.currentSourceIdx = 0; // 전역 변수 사용 (setup.js 등에 선언됨)
  renderSidebarContent(id);
  document.getElementById('sidebar').classList.add('active');
  document.getElementById('overlay').style.display = 'block';
}

/**
 * 정보 출처(사진) 슬라이드 이동
 */
function goToSource(id, index) {
  window.currentSourceIdx = index;
  renderSidebarContent(id);
}

/**
 * 사이드바 내용 렌더링
 */
function renderSidebarContent(id) {
  // 1. 데이터 찾기 (FACILITY, BUILDING 상수 사용)
  const f = FACILITY.find(i => i.id === id);
  if (!f) return;
  
  const b = BUILDING[f.buildingCode] || { name: f.buildingCode, alias: "" };
  const now = new Date();
  
  // 2. 상태 및 사진 정보 가져오기
  const st = TimeManager.getStatus(f, now);
  const photos = window.PHOTO_UPDATES[id] || [];
  const info = photos[window.currentSourceIdx] || null;
  
  // 3. 상태 점 색상 및 남은 시간 텍스트
  let dotC = st.status === 'green' ? 'var(--green)' : 'var(--gray-dot)';
  if (st.rem !== null && st.rem < 60) dotC = 'var(--yellow)';
  const remInfo = st.rem ? `<span style="color:${dotC}; margin-left: 12px;">${formatTimeWithDimming(st.rem)} 뒤 ${st.status === 'green' ? '폐쇄' : '개방'}</span>` : '';
  
  // 4. 이미지 경로 처리 (Firebase 데이터 우선)
  let imgPath = "";
  if (info && info.file) {
    imgPath = info.file.startsWith('data:image') ? info.file : `image/${info.file}`;
  } else {
    // 이미지가 없을 때 기본 이미지 규칙 (예: f101_1.jpg)
    imgPath = `image/${id}_1.jpg`;
  }

  // 5. 사진 슬라이드 도트(점) 생성
  let dotHtml = photos.length > 1 ? `<div class="sb-dot-container">` + photos.map((_, i) => `<div class="sb-dot ${i === window.currentSourceIdx ? 'active' : ''}" onclick="goToSource('${id}', ${i})"></div>`).join('') + `</div>` : '';
  
  const body = document.getElementById('sb-body');
  if (!body) return;

  body.innerHTML = `
    <div class="sb-section" style="margin-bottom:28px;">
      <div style="font-size:13.5px; margin-bottom:6px; font-weight:400; color:var(--black);">${f.buildingCode}-${f.floor} ${b.name} <span style="color:var(--gray-400); margin-left:6px;">${b.alias || ""}</span></div>
      <div style="font-size:20px; line-height:1.2; display:flex; align-items:baseline; gap:10px;">
        <span style="color:var(--black); font-weight:700;">${f.name}</span>
        <span style="color:var(--gray-400); font-weight:400;">${f.category}</span>
      </div>
      <div style="font-weight:700; font-size:13px; color:${dotC}; margin-top:10px;">
        ● ${st.status === 'green' ? '운영 중' : '운영 종료'}${remInfo}
      </div>
    </div>

    <div class="sb-section" style="margin-bottom:30px;">
      <div class="sb-label">Tag</div>
      <div class="sb-content" style="font-size:14px;">${f.tag.length > 0 ? f.tag.join(', ') : '-'}</div>
    </div>

    <div class="sb-source-section" style="margin-bottom:30px;">
      <div class="sb-source-header">
        <div class="sb-label" style="margin-bottom:0;">Info Source</div>
        <div style="display:flex; align-items:center;">
          ${info && info.date ? `<span class="sb-source-date">Updated: ${info.date}</span>` : ''}
          ${info && info.url ? `<a href="${info.url}" target="_blank" class="sb-source-emoji">🔗</a>` : ''}
        </div>
      </div>
      <div class="sb-source-wrapper">
        <img src="${imgPath}" class="sb-source-img" onclick="expandImage('${imgPath}')" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <div class="sb-no-image-placeholder" style="display:none; font-size:12px; color:var(--gray-400); text-align:center; padding:30px; background:var(--gray-100); border-radius:4px; border:1px dashed var(--gray-200); width:100%;">
          준비된 이미지 없음
        </div>
        ${dotHtml}
      </div>
      ${info && info.memo ? `<div style="font-size:12px; color:var(--gray-400); margin-top:12px; line-height:1.5; word-break:break-all;">${info.memo}</div>` : ''}
    </div>
    
    <div class="sb-section" style="border-top: 1px dashed var(--gray-200); padding-top: 20px;">
      <div class="sb-label">Operation Data (Raw)</div>
      <pre style="background:var(--gray-100); padding:12px; border-radius:6px; font-family:var(--mono); font-size:12px; color:var(--gray-600); overflow-x:auto; white-space:pre-wrap; word-break:break-all;"><code>${JSON.stringify(f, null, 2)}</code></pre>
    </div>`;
}

/**
 * 이미지 확대/축소 및 닫기 로직
 */
function expandImage(src) { 
  const overlay = document.getElementById('img-overlay'); 
  const img = document.getElementById('img-expanded'); 
  if (overlay && img) { 
    img.src = src; 
    overlay.style.display = 'flex'; 
  } 
}
function closeImage() { 
  const ov = document.getElementById('img-overlay'); 
  if (ov) ov.style.display = 'none'; 
}
function closeSidebar() { 
  document.getElementById('sidebar').classList.remove('active'); 
  document.getElementById('overlay').style.display = 'none';
  document.body.style.overflow = ''; // 스크롤 잠금 해제
}