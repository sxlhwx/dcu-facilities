/**
 * 공지사항 초기화
 * index.html의 startApp() -> setup.js의 init()을 거쳐 호출됨
 */
function initNotice() {
  const noticeBar = document.getElementById('top-notice-bar');
  const noticeTitle = document.getElementById('notice-bar-title');
  const modalContent = document.getElementById('notice-modal-content');

  // Firebase에서 데이터를 아직 못 가져왔거나 데이터가 없는 경우
  if (!window.NOTICE_DATA) return;

  const { active, title, content } = window.NOTICE_DATA;

  // 1. 공지사항 활성화 여부 체크
  if (active && noticeBar) {
    noticeBar.style.display = 'flex'; // 공지바 노출
    if (noticeTitle) noticeTitle.textContent = title || "공지사항";
  } else if (noticeBar) {
    noticeBar.style.display = 'none'; // 비활성 상태면 숨김
  }

  // 2. 모달 내용 채우기
  if (modalContent) {
    // 텍스트 내의 줄바꿈(\n)을 HTML 태그(<br>)로 변환하여 출력
    modalContent.innerHTML = (content || "").replace(/\n/g, '<br>');
  }
}

/**
 * 공지사항 모달 열기
 */
function openNotice() {
  const modal = document.getElementById('notice-modal');
  const overlay = document.getElementById('overlay');

  if (modal && overlay) {
    modal.classList.add('active');
    overlay.style.display = 'block';
    // 모달이 열릴 때 본문 스크롤 방지 (선택 사항)
    document.body.style.overflow = 'hidden';
  }
}

/**
 * 공지사항 모달 닫기
 */
function closeNotice() {
  const modal = document.getElementById('notice-modal');
  const overlay = document.getElementById('overlay');

  if (modal && overlay) {
    modal.classList.remove('active');
    // 사이드바도 닫혀있어야 하므로 사이드바 존재 여부에 따라 overlay 처리
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || !sidebar.classList.contains('active')) {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  }
}