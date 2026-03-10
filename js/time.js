const TimeManager = {
  SEMESTER_PERIODS: [
    { start: "2026-03-03", end: "2026-06-15", type: "학기중" },
    { start: "2025-09-01", end: "2025-12-19", type: "학기중" }
  ],
  HOLIDAYS: [
    "2026-01-01", "2026-02-16", "2026-02-17", "2026-02-18",
    "2026-03-01", "2026-03-02", "2026-05-05", "2026-05-24",
    "2026-05-25", "2026-06-06", "2026-08-15", "2026-08-17",
    "2026-09-24", "2026-09-25", "2026-09-26", "2026-10-03",
    "2026-10-05", "2026-10-09", "2026-12-25"
  ],
  timeToMin(t) {
    if (!t) return -1;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  },
  getPeriodType(date) {
    const s = date.toISOString().split('T')[0];
    for (const p of this.SEMESTER_PERIODS) {
      if (s >= p.start && s <= p.end) return p.type;
    }
    return '방학중';
  },
  getApplicableDayTypes(date) {
    const s = date.toISOString().split('T')[0];
    if (this.HOLIDAYS.includes(s)) return ['공휴일'];
    const day = date.getDay(); 
    if (day === 0) return ['주말', '일'];
    if (day === 6) return ['주말', '토'];
    return ['평일'];
  },

  getStatus(f, now) {
    const curMin = now.getHours() * 60 + now.getMinutes();
    const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    
    // 1. 오늘 임시 휴무/변경(exceptions) 체크
    const ex = (f.exceptions || []).find(e => e.date === todayStr);
    if (ex) {
      if (ex.closed) return this.formatGrayStatus(f, now);
      const openMin = this.timeToMin(ex.open), closeMin = this.timeToMin(ex.close);
      if (curMin >= openMin && curMin < closeMin) {
        return { status: 'green', rem: closeMin - curMin, timeStr: `${ex.open}~${ex.close}` };
      }
      return this.formatGrayStatus(f, now);
    }

    // 2. 일반 스케줄 체크
    const period = this.getPeriodType(now);
    const dayTypes = this.getApplicableDayTypes(now);
    const active = (f.schedules || []).find(s => {
      return (s.period === '연중' || s.period === period) && dayTypes.includes(s.dayType) && !s.closed &&
             curMin >= this.timeToMin(s.open) && curMin < this.timeToMin(s.close);
    });

    if (active) return { status: 'green', rem: this.timeToMin(active.close) - curMin, timeStr: `${active.open}~${active.close}` };
    
    return this.formatGrayStatus(f, now);
  },

  // 닫혀있을 때 다음 개방 정보를 포함한 상태 리턴
  formatGrayStatus(f, now) {
    const next = this.getNextOpenInfo(f, now);
    return { 
      status: 'gray', 
      rem: next ? next.wait : null, 
      timeStr: next ? next.sched : null,
      isTomorrow: next ? next.isTomorrow : false // ✅ 내일 여는 경우에만 true
    };
  },

  getNextOpenInfo(f, now) {
    const curMin = now.getHours() * 60 + now.getMinutes();
    
    for (let d = 0; d <= 7; d++) {
      const target = new Date(now);
      target.setDate(now.getDate() + d);
      const targetStr = target.getFullYear() + '-' + String(target.getMonth() + 1).padStart(2, '0') + '-' + String(target.getDate()).padStart(2, '0');
      
      // 해당 날짜의 임시 휴무 체크
      const ex = (f.exceptions || []).find(e => e.date === targetStr);
      if (ex) {
        if (ex.closed) continue;
        const exOpenMin = this.timeToMin(ex.open);
        if (d > 0 || exOpenMin > curMin) {
          return { 
            wait: (d * 1440) + exOpenMin - curMin, 
            sched: `${ex.open}~${ex.close}`,
            isTomorrow: (d === 1) // ✅ 정확히 내일일 때만 true
          };
        }
        continue;
      }

      // 일반 스케줄 체크
      const period = this.getPeriodType(target);
      const dayTypes = this.getApplicableDayTypes(target);
      const valid = (f.schedules || []).filter(s => {
        return (s.period === '연중' || s.period === period) && dayTypes.includes(s.dayType) && !s.closed &&
               (d > 0 || this.timeToMin(s.open) > curMin);
      });

      if (valid.length > 0) {
        valid.sort((a, b) => this.timeToMin(a.open) - this.timeToMin(b.open));
        return { 
          wait: (d * 1440) + this.timeToMin(valid[0].open) - curMin, 
          sched: `${valid[0].open}~${valid[0].close}`,
          isTomorrow: (d === 1) // ✅ 정확히 내일일 때만 true
        };
      }
    }
    return null;
  }
};