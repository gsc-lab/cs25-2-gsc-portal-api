export function getWeekRange(dateStr) {
  // Asia/Seoul 기준으로 월요일~일요일
    const d = new Date(`${dateStr}T00:00:00+09:00`);

    const jsDay = d.getDay();
    if (jsDay === 0) {
      // 일요일 -> 다음주 월요일
      d.setDate(d.getDate() + 1)
    } else if (jsDay === 6) {
      // 토요일 -> 다음주 월요일
      d.setDate(d.getDate() + 2)
    }
    const day = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
    const ws = new Date(d); ws.setDate(d.getDate() - day);
    const we = new Date(ws); we.setDate(ws.getDate() + 6);

    const toYMD = (x) =>
        `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;

    return { weekStart: toYMD(ws), weekEnd: toYMD(we) };
}

export const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`; // "2024-05-20" 형식 반환
}

export function toDayCode(dateStr) {
  const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return map[new Date(dateStr).getDay()];
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  const y = result.getFullYear();
  const m = String(result.getMonth() + 1).padStart(2, '0');
  const d = String(result.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
