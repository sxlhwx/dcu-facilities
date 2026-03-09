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
    
    // 모달 창 제목 + 부제 줄바꿈 적용
    if (modalHeader) {
      modalHeader.innerHTML = `<div style="font-weight:700;">📢 ${NOTICE_DATA.title}</div>` + 
                              (NOTICE_DATA.subtitle ? `<div style="font-weight:400; font-size:13px; color:var(--gray-600); margin-top:6px;">${NOTICE_DATA.subtitle}</div>` : '');
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