// 초기 선택 카테고리 설정 (HTML 버튼의 텍스트와 일치시킴)
let selectedCats = new Set(['식당', '편의점', '카페', '학습', '복지·문화']);
let currentSourceIdx = 0;
let currentView = 'desktop';
let isManualToggle = false;

/**
 * 앱 초기화 함수
 * index.html의 startApp() 마지막 단계에서 호출됨
 */
function init() {
  const notice = document.getElementById('bottom-notice');
  // 규칙 적용: SAMPLE_FACILITIES -> FACILITY
  if (notice && typeof FACILITY !== 'undefined') {
    notice.textContent = `등록된 시설 ${FACILITY.length}개 · 운영 시간은 변경될 수 있음`;
  }
  
  // 공지사항 및 레이아웃 초기화
  if (typeof initNotice === "function") initNotice();

  handleResize();
  window.addEventListener('resize', handleResize);
  
  // 첫 화면 리스트 출력
  renderViewTable();
  startClock();
}

/**
 * 화면 크기에 따른 뷰 모드 자동 전환
 */
function handleResize() {
  if (isManualToggle) return;
  const w = window.innerWidth;
  if (w < 750 && currentView === 'desktop') setView('mobile');
  else if (w >= 750 && currentView === 'mobile') setView('desktop');
}

/**
 * 뷰 모드 설정 (데스크탑/모바일)
 */
function setView(mode) {
  currentView = mode;
  document.body.className = mode + '-view';
  
  const btnDesktop = document.getElementById('btn-desktop');
  const btnMobile = document.getElementById('btn-mobile');
  
  if (btnDesktop) btnDesktop.classList.toggle('active', mode === 'desktop');
  if (btnMobile) btnMobile.classList.toggle('active', mode === 'mobile');
  
  const btnMini = document.getElementById('btn-mini');
  if (btnMini) btnMini.textContent = mode === 'desktop' ? '💻' : '📱';
  
  renderViewTable();
}

/**
 * 사용자가 직접 뷰 모드 전환 버튼을 눌렀을 때
 */
function toggleView(mode) {
  isManualToggle = true;
  setView(mode);
}

/**
 * 상단 시계 구동 및 주기적 화면 갱신
 */
function startClock() {
  function tick() {
    const now = new Date();
    const dN = ['일', '월', '화', '수', '목', '금', '토'];
    const clock = document.getElementById('clock');
    
    if (clock) {
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      
      if (window.innerWidth < 450) {
        const mo = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        clock.innerHTML = `${mo}. ${dd}. ${hh}:${mm}`;
      } else {
        clock.innerHTML = `${now.getMonth() + 1}월 ${now.getDate()}일 (${dN[now.getDay()]}) ${hh}:${mm}`;
      }
    }
    // 시간이 변함에 따라 운영 여부(남은 시간)가 달라지므로 테이블 갱신
    renderViewTable();
  }
  
  tick(); 
  window.addEventListener('resize', tick);
  setInterval(tick, 30000); // 30초마다 갱신
}