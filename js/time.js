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
   * 로컬 타임존 기준 YYYY-MM-DD 포맷 반환 (UTC 오차 방지)
   */
  formatDateStr(date) {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0');
  },

  /**
   * 오늘이 학기(semester)인지 방학(vacation)인지 판별
   */
  getPeriodKey(date) {
    const s = this.formatDateStr(date);
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
    const dateStr = this.formatDateStr(date);
    
    // 1순위: temporary (임시 공지 및 연속 운영 범위)
    if (f.temporary && f.temporary.length > 0) {
      const temp = f.temporary.find(t => {
        if (t.date) return t.date === dateStr;
        if (t.range) return dateStr >= t.range.start && dateStr <= t.range.end;
        return false;
      });
      if (temp) return temp;
    }

    // 2순위: holiday (공휴일 체크)
    if (this.HOLIDAYS.includes(dateStr)) {
      if (f.holiday === 'closed') return { type: '휴무' };
      if (f.holiday === 'unknown') return { type: 'unknown' };
      if (typeof f.holiday === 'object') return { type: '영업', ...f.holiday, break: f.holiday.break || [] };
      // 'open'이면 아래 정규 스케줄로 넘어감
    }

    // 3순위: 일반 스케줄 (학기/방학 + 요일)
    const period = this.getPeriodKey(date);
    const dayKey = this.getDayKey(date);
    
    if (!f.schedule || !f.schedule[period] || !f.schedule[period][dayKey]) {
      return { type: 'unknown' };
    }
    
    return f.schedule[period][dayKey];
  },

  /**
   * 현재 상태(영업중, 종료 등) 판별 및 연속 운영 병합 로직
   */
  getStatus(f, now) {
    const curMin = now.getHours() * 60 + now.getMinutes();
    
    // 1. 어제 스케줄이 익일(24:00 초과)까지 이어져 오늘 새벽을 덮고 있는지 확인
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const ySched = this.getScheduleForDate(f, yesterday);
    
    let activeSched = null;
    let activeDayOffset = 0; 
    let closeMin = 0;

    if (ySched && ySched.type === '영업' && ySched.close) {
      const yClose = this.timeToMin(ySched.close);
      // 어제 스케줄이 24:00(1440)을 넘었고, 현재 시간이 그 남은 연장선 안에 있을 때
      if (yClose > 1440 && curMin < (yClose - 1440)) {
        activeSched = ySched;
        activeDayOffset = -1;
        closeMin = yClose - 1440; // 오늘 시점으로 변환
      }
    }

    // 2. 어제의 연장선이 아니라면 오늘 정상 스케줄 확인
    if (!activeSched) {
      const tSched = this.getScheduleForDate(f, now);
      if (tSched && tSched.type === '영업' && tSched.close) {
        const tOpen = this.timeToMin(tSched.open);
        const tClose = this.timeToMin(tSched.close);
        if (curMin >= tOpen && curMin < tClose) {
          activeSched = tSched;
          activeDayOffset = 0;
          closeMin = tClose;
        }
      }
    }

    // 3. 현재 "영업 시간" 범위 내에 있을 경우 로직 처리
    if (activeSched) {
      // (1) 휴게시간(break) 중인지 확인
      if (activeSched.break && Array.isArray(activeSched.break)) {
        for (let b of activeSched.break) {
          const bStart = this.timeToMin(b.start) + (activeDayOffset * 1440);
          const bEnd = this.timeToMin(b.end) + (activeDayOffset * 1440);
          if (curMin >= bStart && curMin < bEnd) {
            return { status: 'gray', rem: bEnd - curMin, timeStr: `${b.start} 휴게종료`, isBreak: true };
          }
        }
      }

      // (2) 영업 중일 때, 가장 빠른 "닫는 이벤트" 찾기 (오늘 휴게시간 시작 or 오늘 영업 종료)
      let nextBreakStart = Infinity;
      if (activeSched.break && Array.isArray(activeSched.break)) {
        for (let b of activeSched.break) {
          const bStart = this.timeToMin(b.start);
          if (bStart > (curMin - activeDayOffset * 1440) && bStart < nextBreakStart) {
            nextBreakStart = bStart;
          }
        }
      }

      // 다음 이벤트가 오늘 휴게시간이라면 휴게시간까지 남은 시간을 반환
      if (nextBreakStart !== Infinity && nextBreakStart < this.timeToMin(activeSched.close)) {
        return { 
          status: 'green', 
          rem: (nextBreakStart + activeDayOffset * 1440) - curMin, 
          timeStr: `${activeSched.open}~${activeSched.close}` 
        };
      }

      // (3) 'nn일간 연속 운영(24:00)'을 탐색하여 최종 폐쇄 시간 계산
      let daysOffset = 0;
      let currentDay = new Date(now);
      currentDay.setDate(now.getDate() + activeDayOffset);
      let finalCloseMin = this.timeToMin(activeSched.close);

      // 오늘 종료시간이 자정(24:00) 이상이라면 다음날 스케줄을 확인하여 이어붙임
      while (finalCloseMin >= 1440) {
        let nextDay = new Date(currentDay);
        nextDay.setDate(nextDay.getDate() + 1);
        let nextSched = this.getScheduleForDate(f, nextDay);
        
        // 내일이 '영업'이고 오픈 시간이 '00:00'이라면 연속 운영으로 간주
        if (nextSched && nextSched.type === '영업' && this.timeToMin(nextSched.open) === 0) {
          // 내일 휴게시간이 있다면 휴게시간 시작까지만 연속 운영
          let nextDayFirstBreak = Infinity;
          if (nextSched.break && Array.isArray(nextSched.break)) {
            for (let b of nextSched.break) {
              const bS = this.timeToMin(b.start);
              if (bS < nextDayFirstBreak) nextDayFirstBreak = bS;
            }
          }
          if (nextDayFirstBreak !== Infinity) {
            daysOffset++;
            finalCloseMin = nextDayFirstBreak;
            break;
          }

          // 연속 연장 확정
          daysOffset++;
          currentDay = nextDay;
          finalCloseMin = this.timeToMin(nextSched.close);
        } else {
          break; // 끊기면 루프 종료
        }
      }

      // 1440을 초과하는 방대한 'rem' 값을 리턴 (UI 단에서 "nn일 후"로 변환됨)
      const totalRem = ((activeDayOffset + daysOffset) * 1440) + finalCloseMin - curMin;
      return { 
        status: 'green', 
        rem: totalRem, 
        timeStr: `${activeSched.open}~${activeSched.close}` 
      };
    }

    // 4. 영업 시간 범위 내가 아니면 다음 개방 시간 찾기
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
    
    // 장기 휴무/방학을 고려해 최대 30일까지 스캔
    for (let d = 0; d <= 30; d++) {
      const target = new Date(now);
      target.setDate(now.getDate() + d);
      
      const sched = this.getScheduleForDate(f, target);
      
      if (sched && sched.type === '영업' && sched.open) {
        const openMin = this.timeToMin(sched.open);
        
        // 오늘(d=0)인 경우
        if (d === 0) {
          // 휴게시간 종료를 기다리는 중인지 확인
          let insideBreak = false;
          let breakEnd = 0;
          if (sched.break && Array.isArray(sched.break)) {
            for (let b of sched.break) {
              const bS = this.timeToMin(b.start);
              const bE = this.timeToMin(b.end);
              if (curMin >= bS && curMin < bE) {
                insideBreak = true;
                breakEnd = bE;
                break;
              }
            }
          }
          if (insideBreak) return { wait: breakEnd - curMin, sched: `${sched.open}~${sched.close}` };
          
          // 아직 오픈 전인지 확인
          if (openMin > curMin) return { wait: openMin - curMin, sched: `${sched.open}~${sched.close}` };
        } 
        // 내일 이후(d>0)라면 무조건 가장 처음 만나는 영업일
        else {
          return { wait: (d * 1440) + openMin - curMin, sched: `${sched.open}~${sched.close}` };
        }
      }
    }
    return null; // 30일 내내 오픈 정보가 없으면 null 반환
  }
};