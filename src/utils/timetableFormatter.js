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

    // 1. 기본 구조 초기화 (기존과 동일)
    for (const g of grades) {
        timetable[g] = {};
        for (const d of days) {
            timetable[g][d] = {};
            for (let p = 1; p <= 12; p++) timetable[g][d][p] = [];
        }
    }

    if (!rows || rows.length === 0) return timetable;

    for (const row of rows) {
        // 2. SQL에서 'period'를 직접 가져옴
        const period = row.period;
        const original_day = row.day_of_week; // 'THU' (원래 요일)
        
        if (!original_day || !period) continue; // 유효하지 않으면 스킵

        const status = row.event_status;
        const date = row.event_date || null;

        // 3. 학년 그룹 결정 (기존과 동일)
        let group = "special";
        if (row.language_id === "KR") group = "korean";
        else if (row.is_special === 0) {
            if (row.grade_name === "1학년") group = "1";
            else if (row.grade_name === "2학년") group = "2";
            else if (row.grade_name === "3학년") group = "3";
        }
        if (!timetable[group]) group = "special"; // 방어 코드

        // 4. [버그 수정] 표시할 요일(display_day) 계산
        let display_day = original_day; // 기본값: 원래 요일

        if (status === "MAKEUP") {
            // "보강"일 때만 event_date의 요일로 덮어쓴다
            const eventDay = new Date(date).getDay();
            const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            display_day = map[eventDay];
        }
        // "휴강(CANCEL)"이나 "정상 수업(null)"은 original_day를 그대로 사용

        if (!days.includes(display_day)) continue; // 주말(보강) 스킵

        // 5. [수정] 기본 항목 객체 생성 (상담 변수 포함)
        const entry = {
            title: row.course_title || "상담",
            course_id: row.course_id,
            professor: row.professor_name || null,
            room: row.location || "-",
            source: row.source_type || "CLASS",
            event: null,
            
            // ▼▼▼▼▼ 여기 상담 변수가 있습니다! ▼▼▼▼▼
            students: row.student_list,      // 예: "A, B" (수업일땐 null)
            student_count: row.student_count // 예: 2 (수업일땐 null)
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
        };

        // 6. [버그 수정] 이벤트 상태에 따라 덮어쓰기 (continue 제거)
        if (status === "CANCEL") {
            entry.title = "휴강";
            entry.source = "EVENT";
            entry.event = { status: "CANCEL", date };
        } else if (status === "MAKEUP") {
            entry.title = `${row.course_title || "보강"} (보강)`;
            // source는 "CLASS" 또는 "COUNSELING" 유지
            entry.event = { status: "MAKEUP", date };
        }

        // 7. [버그 수정] 최종 슬롯에 삽입 (continue가 없으므로 모든 로우가 여기를 통과)
        timetable[group][display_day][period].push(entry);
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
