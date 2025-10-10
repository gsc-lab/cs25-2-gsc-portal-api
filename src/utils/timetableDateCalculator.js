export function getWeekRange(dateStr) {
  // Asia/Seoul 기준으로 월요일~일요일
    const d = new Date(`${dateStr}T00:00:00+09:00`);
    const day = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
    const ws = new Date(d); ws.setDate(d.getDate() - day);
    const we = new Date(ws); we.setDate(ws.getDate() + 6);

    const toYMD = (x) =>
        `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;

    return { weekStart: toYMD(ws), weekEnd: toYMD(we) };
}