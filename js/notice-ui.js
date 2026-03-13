function initNotice() {
  const bar = document.getElementById('top-notice-bar');
  const title = document.getElementById('notice-bar-title');
  const content = document.getElementById('notice-modal-content');
  const modalHeader = document.querySelector('.notice-modal-header');
  
  // ✅ window.NOTICE_DATA 참조로 변경
  if (typeof window.NOTICE_DATA !== 'undefined' && window.NOTICE_DATA.active) {
    bar.style.display = 'flex';
    
    // 상단 공지사항 바 제목 + 부제 적용
    title.innerHTML = `<span style="font-weight:700;">${window.NOTICE_DATA.title}</span>` + 
                      (window.NOTICE_DATA.subtitle ? ` <span style="font-weight:400; margin-left:6px; color:#fecaca;">${window.NOTICE_DATA.subtitle}</span>` : '');
    
    // 모달 창 제목 + 부제 줄바꿈 적용
    if (modalHeader) {
      modalHeader.innerHTML = `<div style="font-weight:700;">📢 ${window.NOTICE_DATA.title}</div>` + 
                              (window.NOTICE_DATA.subtitle ? `<div style="font-weight:400; font-size:13px; color:var(--gray-600); margin-top:6px;">${window.NOTICE_DATA.subtitle}</div>` : '');
    }

    // ✅ 엔터(\n)를 <br> 태그로 자동 치환
    content.innerHTML = (window.NOTICE_DATA.content || '').replace(/\n/g, '<br>');
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