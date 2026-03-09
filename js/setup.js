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