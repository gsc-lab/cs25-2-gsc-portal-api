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
    if (!rows || rows.length === 0) return {};

    const timetable = {};

    for (const row of rows) {
        const period = periodMap[row.start_time];
        if (!period) continue;

        // 요일 계산 (휴보강 포함)
        let day = row.day_of_week;
        if (row.event_status && row.event_date) {
        const eventDay = new Date(row.event_date).getDay(); // 0=Sun
        const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        day = map[eventDay];
        }

        // course_id or huka_schedule_id 기반 키 생성
        const courseKey = row.course_id || row.huka_schedule_id;
        if (!courseKey) continue;

        // 그룹 초기화
        if (!timetable[courseKey]) {
        timetable[courseKey] = {
            title:
            row.course_title ||
            (row.source_type === "COUNSELING"
                ? `상담(${row.professor_name})`
                : "미지정 과목"),
            professor: row.professor_name || "-",
            schedule: []
        };
        }

        // 스케줄 정보 구성
        const scheduleItem = {
        day,
        room:
            row.location ||
            (row.building && row.room_number
            ? `${row.building}-${row.room_number}`
            : "-"),
        period
        };

        // 휴강/보강 상태 추가
        if (row.event_status === "CANCEL") {
        scheduleItem.status = "CANCEL";
        scheduleItem.note = "휴강";
        } else if (row.event_status === "MAKEUP") {
        scheduleItem.status = "MAKEUP";
        scheduleItem.note = "보강";
        }

        timetable[courseKey].schedule.push(scheduleItem);
    }

    return timetable;
}



export function formatTimetableForAdmin(rows) {
    if (!rows || rows.length === 0) return {};

    const timetable = {};

    for (const row of rows) {
        const period = periodMap[row.start_time];
        if (!period) continue;

        // 요일 계산 (휴보강 포함)
        let day = row.day_of_week;
        if (row.event_status && row.event_date) {
        const eventDay = new Date(row.event_date).getDay(); // 0=Sun
        const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        day = map[eventDay];
        }

        // 과목 / 상담 식별 키 설정
        const courseKey = row.course_id || row.huka_schedule_id;
        if (!courseKey) continue;

        // 그룹 초기화
        if (!timetable[courseKey]) {
        timetable[courseKey] = {
            title:
            row.course_title ||
            (row.source_type === "COUNSELING"
                ? `상담(${row.professor_name})`
                : "미지정 과목"),
            professor: row.professor_name || "-",
            target:
            row.grade_name && row.grade_name.includes("학년")
                ? row.grade_name.replace("학년", "")
                : null,
            schedule: []
        };
        }

        // 스케줄 항목 구성
        const scheduleItem = {
        day,
        room: row.location || "-",
        period
        };

        // 상태(휴강/보강)
        if (row.event_status === "CANCEL") {
        scheduleItem.status = "CANCEL";
        scheduleItem.note = "휴강";
        } else if (row.event_status === "MAKEUP") {
        scheduleItem.status = "MAKEUP";
        scheduleItem.note = "보강";
        }

        timetable[courseKey].schedule.push(scheduleItem);
    }

    return timetable;
}


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
