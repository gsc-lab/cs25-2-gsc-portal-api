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

    if (!rows || rows.length === 0) return timetable;

    for (const row of rows) {
        const period = periodMap[row.start_time];
        if (!period) continue;

        // 휴보강이면 event_date로 요일 재계산
        let day = row.day_of_week;
        if (row.event_status && row.event_date) {
            const eventDay = new Date(row.event_date).getDay(); // 0=Sun, 1=Mon...
            const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            day = map[eventDay];
        }

        if (!day || !timetable[day]) continue;

        // 휴강
        if (row.event_status === "CANCEL") {
            timetable[day][period].push({
                title: "휴강",
                course_id: row.course_id,
                professor: row.professor_name || "-",
                room: row.location || `${row.building}-${row.room_number}` || "-",
                source: "EVENT",
                event: { status: "CANCEL", date: row.event_date }
            });
            continue;
        }

        // 보강
        if (row.event_status === "MAKEUP") {
            timetable[day][period].push({
                title: `${row.course_title || "보강"} (보강)`,
                course_id: row.course_id,
                professor: row.professor_name || "-",
                room: row.location || `${row.building}-${row.room_number}` || "-",
                source: row.source_type || "CLASS",
                event: { status: "MAKEUP", date: row.event_date }
            });
            continue;
        }

        // 일반 수업 / 상담
        timetable[day][period].push({
            title: row.course_title || "상담",
            course_id: row.course_id,
            professor: row.professor_name || null,
            room: row.location || `${row.building}-${row.room_number}` || "-",
            source: row.source_type || "CLASS",
            event: row.event_status
                ? { status: row.event_status, date: row.event_date }
                : null
        });
    }

    return timetable;
}


export function formatTimetableForAdmin(rows) {
    const grades = ["1", "2", "3", "special", "korean"];
    const days = ["MON", "TUE", "WED", "THU", "FRI"];

    // 기본 구조
    const timetable = {};
    for (const g of grades) {
        timetable[g] = {};
        for (const d of days) {
            timetable[g][d] = {};
            for (let p = 1; p <= 12; p++) timetable[g][d][p] = [];
        }
    }

    if (!rows || rows.length === 0) return timetable;

    for (const row of rows) {
        const period = periodMap[row.start_time];
        if (!period) continue;

        // event_date 기준 요일 재계산 (휴보강용)
        let day = row.day_of_week;
        if (row.event_status && row.event_date) {
            const eventDay = new Date(row.event_date).getDay(); // 0=Sun
            const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            day = map[eventDay];
        }

        // 학년 구분
        let group = "special";
        if (row.language_id === "KR") group = "korean";
        else if (row.is_special === 0) {
            if (row.grade_name === "1학년") group = "1";
            else if (row.grade_name === "2학년") group = "2";
            else if (row.grade_name === "3학년") group = "3";
        }

        // 휴강
        if (row.event_status === "CANCEL") {
            timetable[group][day][period].push({
                title: "휴강",
                course_id: row.course_id,
                professor: row.professor_name || "-",
                room: row.location || "-",
                source: "EVENT",
                event: { status: "CANCEL", date: row.event_date }
            });
            continue;
        }

        // 보강
        if (row.event_status === "MAKEUP") {
            timetable[group][day][period].push({
                title: `${row.course_title || "보강"} (보강)`,
                course_id: row.course_id,
                professor: row.professor_name || "-",
                room: row.location || "-",
                source: "CLASS",
                event: { status: "MAKEUP", date: row.event_date }
            });
            continue;
        }

        // 일반 수업 / 상담
        timetable[group][day][period].push({
            title: row.course_title || "상담",
            course_id: row.course_id,
            professor: row.professor_name || null,
            room: row.location || "-",
            source: row.source_type || "CLASS",
            event: row.event_status
                ? { status: row.event_status, date: row.event_date }
                : null
        });
    }

    return timetable;
}

<<<<<<< HEAD
// 강의실 예약
export function formatReservation(rows) {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const timetable = {};

    for (const d of days) {
        timetable[d] = [];
    }

    for (const row of rows) {
        const dateObj = new Date(row.reserve_date);
        const day = days[dateObj.getDay()];
        if (!day) continue;

        const formattedDate = dateObj.toISOString().split("T")[0];

        timetable[day].push({
            id: row.reservation_id,
            user: row.user_name,
            start: row.start_time,
            end: row.end_time,
            date: formattedDate,
            classroom: row.classroom_id,
        });
    }

    return timetable;
}
=======


>>>>>>> origin/dev
