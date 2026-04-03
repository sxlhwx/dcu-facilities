const TimeManager = {
  // 학기 및 방학 기간 설정
  SEMESTER_PERIODS: [
    { start: "2026-03-03", end: "2026-06-15", type: "semester" },
    { start: "2025-09-01", end: "2025-12-19", type: "semester" }
  ],

  // 공휴일 리스트
  HOLIDAYS: [
    "2026-01-01", "2026-02-16", "2026-02-17", "2026-02-18",
    "2026-03-01", "2026-03-02", "2026-05-05", "2026-05-24",
    "2026-05-25", "2026-06-06", "2026-08-15", "2026-08-17",
    "2026-09-24", "2026-09-25", "2026-09-26", "2026-10-03",
    "2026-10-05", "2026-10-09", "2026-12-25"
  ],

  /**
   * "HH:mm" 문자열을 분 단위 숫자로 변환
   */
  timeToMin(t) {
    if (!t) return -1;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  },

  /**
   * 오늘이 학기(semester)인지 방학(vacation)인지 판별
   */
  getPeriodKey(date) {
    const s = date.toISOString().split('T')[0];
    for (const p of this.SEMESTER_PERIODS) {
      if (s >= p.start && s <= p.end) return 'semester';
    }
    return 'vacation';
  },

  /**
   * 요일 인덱스를 데이터 키(mon, tue...)로 변환
   */
  getDayKey(date) {
    const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return keys[date.getDay()];
  },

  /**
   * 특정 날짜의 운영 정보(스케줄)를 가져옴 (우선순위 적용)
   */
  getScheduleForDate(f, date) {
    const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    
    // 1순위: temporary (임시 공지)
    const temp = (f.temporary || []).find(t => t.date === dateStr);
    if (temp) return temp;

    // 2순위: holiday (공휴일 체크)
    if (this.HOLIDAYS.includes(dateStr)) {
      if (f.holiday === 'closed') return { type: '휴무' };
      if (typeof f.holiday === 'object') return { type: '영업', ...f.holiday }; // {open, close} 객체인 경우
      // 'open'이거나 'unknown'이면 일반 요일 스케줄로 넘어감
    }

    // 3순위: 일반 스케줄 (학기/방학 + 요일)
    const period = this.getPeriodKey(date);
    const dayKey = this.getDayKey(date);
    return f.schedule[period][dayKey];
  },

  /**
   * 현재 상태(영업중, 종료 등) 판별
   */
  getStatus(f, now) {
    const curMin = now.getHours() * 60 + now.getMinutes();
    const sched = this.getScheduleForDate(f, now);

    // 영업 타입이고 시간이 설정된 경우
    if (sched && sched.type === '영업' && sched.open && sched.close) {
      const openMin = this.timeToMin(sched.open);
      const closeMin = this.timeToMin(sched.close);

      // 현재 영업 시간 내에 있음
      if (curMin >= openMin && curMin < closeMin) {
        return { 
          status: 'green', 
          rem: closeMin - curMin, 
          timeStr: `${sched.open}~${sched.close}` 
        };
      }
    }

    // 영업 중이 아니면 다음 개방 시간을 찾아서 반환
    return this.formatGrayStatus(f, now);
  },

  /**
   * 닫혀있을 때 표시할 상태 정보
   */
  formatGrayStatus(f, now) {
    const next = this.getNextOpenInfo(f, now);
    return { 
      status: 'gray', 
      rem: next ? next.wait : null, 
      timeStr: next ? next.sched : null
    };
  },

  /**
   * 다음 오픈 시간까지의 대기 시간과 정보를 탐색
   */
  getNextOpenInfo(f, now) {
    const curMin = now.getHours() * 60 + now.getMinutes();
    
    // 오늘 포함 향후 7일까지 탐색
    for (let d = 0; d <= 7; d++) {
      const target = new Date(now);
      target.setDate(now.getDate() + d);
      
      const sched = this.getScheduleForDate(f, target);
      
      if (sched && sched.type === '영업' && sched.open) {
        const openMin = this.timeToMin(sched.open);
        
        // 오늘(d=0)이라면 현재 시간 이후여야 함, 내일 이후(d>0)라면 무조건 유효
        if (d > 0 || openMin > curMin) {
          return { 
            wait: (d * 1440) + openMin - curMin, 
            sched: `${sched.open}~${sched.close}`
          };
        }
      }
    }
    return null;
  }
};