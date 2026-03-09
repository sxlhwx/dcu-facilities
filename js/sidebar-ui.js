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