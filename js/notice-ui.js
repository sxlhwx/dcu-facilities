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
    
    // 모달 창 제목 + 부제 적용 (index.html 수정 없이 DOM으로 덮어쓰기)
    if (modalHeader) {
      modalHeader.innerHTML = `<span style="font-weight:700;">📢 ${NOTICE_DATA.title}</span>` + 
                              (NOTICE_DATA.subtitle ? ` <span style="font-weight:400; margin-left:6px; color:var(--gray-600);">${NOTICE_DATA.subtitle}</span>` : '');
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