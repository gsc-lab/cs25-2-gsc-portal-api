const periodMap = {
    "09:00:00": 1,
    "10:00:00": 2,
    "11:00:00": 3,
    "12:00:00": 4,
    "13:00:00": 5,
    "14:00:00": 6,
    "15:00:00": 7,
    "16:00:00": 8,
    "17:00:00": 9,
    "18:00:00": 10,
    "19:00:00": 11,
    "20:00:00": 12
};

export function formatTimetable(rows) {
    const days = ["MON", "TUE", "WED", "THU", "FRI"];
    const timetable = {};

    // 기본 구조 세팅
    for (const d of days) {
        timetable[d] = {};
        for (let p = 1; p <= 12; p++) timetable[d][p] = [];
    }

    if (!rows || rows.length === 0) {
        // 데이터가 없으면 기본 구조 그대로 반환
        return timetable;
    }

    for (const row of rows) {
        const period = periodMap[row.start_time];
        const day = row.day_of_week;
        
        if (!period || !day || !timetable[day]) continue;

        // 공통 데이터
        const base = {
        title: row.course_title || "상담",
        professor: row.professor_name || null,
        room: row.location || `${row.building}-${row.room_number}` || "-",
        source: row.source_type || "CLASS",
        event: row.event_status
            ? { status: row.event_status, date: row.event_date }
            : null
        };

        timetable[day][period].push(base);
    }

    return timetable;
}
