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

    // 틀 만들기
    for (const d of days) {
        timetable[d] = {};
        for (let p = 1; p <= 12; p++) {
        timetable[d][p] = [];
        }
    }

    // rows 채우기
    for (const row of rows) {
        const period = periodMap[row.start_time];
        if (!period) continue;

        timetable[row.day][period] = {
        course_id: row.course_id,
        title: row.course_title,
        room: `${row.building}-${row.room_number}`,
        professor: row.professor_name,
        level: row.level_name,
        class_group: row.class_name,
        event: row.event_status
            ? { status: row.event_status, date: row.event_date }
            : null
        };
    }

    return timetable;
    }