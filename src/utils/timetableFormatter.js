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
            const eventDay = new Date(row.event_date).getDay();
            const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            day = map[eventDay];
        }

        // 주말은 시간표에 존재하지 않으므로 제외
        if (!days.includes(day)) continue;

        // 휴강
        if (row.event_status === "CANCEL") {
            timetable[day][period].push({
                title: "휴강",
                course_id: row.course_id,
                professor: row.professor_name || "-",
                room: row.location 
                    ? row.location 
                    : (row.building && row.room_number 
                        ? `${row.building}-${row.room_number}` 
                        : "-"),
                source: "EVENT",
                event: { status: "CANCEL", date: row.event_date }
            });
            continue;
        }

        // 보강 (단, 주말 제외)
        if (row.event_status === "MAKEUP") {
            const eventDay = new Date(row.event_date).getDay();
            if (eventDay === 0 || eventDay === 6) continue;

            timetable[day][period].push({
                title: `${row.course_title || "보강"} (보강)`,
                course_id: row.course_id,
                professor: row.professor_name || "-",
                room: row.location 
                    ? row.location 
                    : (row.building && row.room_number 
                        ? `${row.building}-${row.room_number}` 
                        : "-"),
                source: row.source_type || "CLASS",
                event: { status: "MAKEUP", date: row.event_date }
            });
            continue;
        }

        // 기본 수업 / 상담 (event 없음)
        timetable[day][period].push({
            title: row.course_title || "상담",
            course_id: row.course_id,
            professor: row.professor_name || null,
            room: row.location 
                ? row.location 
                : (row.building && row.room_number 
                    ? `${row.building}-${row.room_number}` 
                    : "-"),
            source: row.source_type || "CLASS",
            event: null
        });
    }

    return timetable;
}



export function formatTimetableForAdmin(rows) {
    const grades = ["1", "2", "3", "special", "korean"];
    const days = ["MON", "TUE", "WED", "THU", "FRI"];
    const timetable = {};

    // 기본 구조 초기화 (기존과 동일)
    for (const g of grades) {
        timetable[g] = {};
        for (const d of days) {
            timetable[g][d] = {};
            for (let p = 1; p <= 12; p++) timetable[g][d][p] = [];
        }
    }

    if (!rows || rows.length === 0) return timetable;

    for (const row of rows) {
        if (!row || !row.day_of_week) continue; // start_time 대신 day_of_week 확인

        // ▼▼▼▼▼ 1. (수정) periodMap 대신 SQL의 period 사용 ▼▼▼▼▼
        // const period = periodMap[row.start_time]; // (기존 코드)
        const period = row.period; // (수정된 코드) - 1단계 SQL이 이 값을 제공합니다.
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

        if (!period) continue;

        // 요일 계산 (기존과 동일)
        let day = row.day_of_week;
        if (row.event_status && row.event_date) {
            const eventDay = new Date(row.event_date).getDay();
            const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            day = map[eventDay];
        }
        if (!days.includes(day)) continue; // 주말 스킵

        // 학년 그룹 결정 (기존과 동일)
        let group = "special";
        if (row.language_id === "KR") group = "korean";
        else if (row.is_special === 0) {
            if (row.grade_name === "1학년") group = "1";
            else if (row.grade_name === "2학년") group = "2";
            else if (row.grade_name === "3학년") group = "3";
        }
        
        // (기존 코드에 group이 null이 되는 케이스가 있다면 방어 코드)
        if (!timetable[group]) {
            // 'special' 그룹으로 강제 할당 (혹은 로그)
            console.warn("Invalid group for row:", row);
            group = "special";
        }

        const status = row.event_status;
        const date = row.event_date || null;

        // 휴강 (기존과 동일)
        if (status === "CANCEL") {
            timetable[group][day][period].push({
                title: "휴강",
                course_id: row.course_id,
                professor: row.professor_name || "-",
                room: row.location || "-",
                source: "EVENT",
                event: { status: "CANCEL", date }
            });
            continue;
        }

        // 보강 (기존과 동일)
        if (status === "MAKEUP") {
            // (기존 보강 로직...)
            const eventDay = new Date(row.event_date).getDay();
            if (eventDay === 0 || eventDay === 6) continue;

            timetable[group][day][period].push({
                title: `${row.course_title || "보강"} (보강)`,
                course_id: row.course_id,
                professor: row.professor_name || "-",
                room: row.location || "-",
                source: "CLASS",
                event: { status: "MAKEUP", date }
            });
            continue;
        }

        // ▼▼▼▼▼ 2. (수정) 기본 수업 및 상담 블록에 변수 추가 ▼▼▼▼▼
        timetable[group][day][period].push({
            title: row.course_title || "상담", // (1단계 SQL이 '상담'으로 줌)
            course_id: row.course_id,
            professor: row.professor_name || null,
            room: row.location || "-",
            source: row.source_type || "CLASS",
            event: null,
            
            // (추가된 필드)
            students: row.student_list,      // 예: "A, B" (수업일땐 null)
            student_count: row.student_count // 예: 2 (수업일땐 null)
        });
        // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
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
