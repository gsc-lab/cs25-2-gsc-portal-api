import * as timetableModel from '../models/Timetable.js';
import { BadRequestError, InternalServerError } from "../errors/index.js"
import { getWeekRange } from "../utils/timetableDateCalculator.js";

// 시간표 조회 (학생, 교수, 관리자)
export const getStudentTimetable = async function({user_id, targetDate}) {
    if (!user_id || !targetDate) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    const { weekStart, weekEnd } = getWeekRange(targetDate);

    return await timetableModel.getStudentTimetable(user_id, targetDate, weekStart, weekEnd);
}

export const getProfessorTimetable = async function({user_id, targetDate}) {
    if (!user_id || !targetDate) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    const { weekStart, weekEnd } = getWeekRange(targetDate);

    return await timetableModel.getProfessorTimetable(user_id, targetDate, weekStart, weekEnd);
}

export const getAdminTimetable = async function(targetDate) {
    if (!targetDate) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    const { weekStart, weekEnd } = getWeekRange(targetDate);

    return await timetableModel.getAdminTimetable(targetDate, weekStart, weekEnd);
}

// 강의 등록
export const postRegisterCourse = async ({sec_id, title, professor_id, target, class_id, class_name}) => {
    
    if (!sec_id || !title || !professor_id || !target) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }

    let db_is_special = 0;
    let db_grade_id = null;
    let db_language_id = null;

    if (["1", "2", "3"].includes(target)) {
        // 'regular' 번역
        db_grade_id = parseInt(target);
    } 
    else if (target === "korean") {
        // 'korean' 번역
        db_is_special = 2;
        db_language_id = "KR";
    } 
    else if (target === "special") {
        // 'special' 번역
        db_is_special = 1;
        db_language_id = "JP";
    } 
    else {
        throw new BadRequestError("유효하지 않은 target 값입니다.");
    }

    // Model에 "번역된" 값들을 각각 전달
    const result =  await timetableModel.postRegisterCourse(
        sec_id, title, professor_id, 
        db_is_special, db_grade_id, db_language_id, class_id, class_name
    );
    return result
};

// 강의 수정
export const putRegisterCourse = async ({course_id, sec_id, title, professor_id, target, class_id}) => {
    
    if (!course_id) throw new BadRequestError("강의 값이 누락 되었습니다.");
    if (!sec_id || !title || !professor_id || !target) throw new BadRequestError("필수 값이 누락 되었습니다.");

    let db_is_special = 0;
    let db_grade_id = null;
    let db_language_id = null;

    if (["1", "2", "3"].includes(target)) {
        db_grade_id = parseInt(target);
    } 
    else if (target === "korean") {
        db_is_special = 2;
        db_language_id = "KR";
    } 
    else if (target === "special") {
        db_is_special = 1;
        db_language_id = "JP";
    } 
    else {
        throw new BadRequestError("유효하지 않은 target 값입니다.");
    }
    
    // Model에 "번역된" 값들을 각각 전달
    const result =  await timetableModel.putRegisterCourse(
        course_id, sec_id, title, professor_id, 
        db_is_special, db_grade_id, db_language_id, class_id
    );
    return result
};

// 강의 삭제
export const deleteRegisterCourse = async ({course_id}) => {
    
    if (!course_id) {
        throw new BadRequestError("강의 값이 누락 되었습니다.")
    }

    const result =  await timetableModel.deleteRegisterCourse(course_id);

    return result
};



// 시간표 등록
export const postRegisterTimetable = async function ({classroom_id, course_id, day_of_week, start_period, end_period}) {
    if (!classroom_id || !start_period || !end_period || !course_id || !day_of_week) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }

    // 시간표 등록
    return await timetableModel.registerTimetable(classroom_id, course_id, day_of_week, start_period, end_period);
}

// 시간표 수정 (기존 시간표 삭제 후 다시 만들기)
export const putRegisterTimetable = async function({schedule_ids, classroom_id, start_period, end_period, day_of_week}) {
    if (!schedule_ids || !classroom_id || start_period == null || end_period == null|| !day_of_week) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    return await timetableModel.putRegisterTimetable(schedule_ids, classroom_id, start_period, end_period, day_of_week);
}
// 시간표 삭제
export const deleteRegisterTimetable = async function ({ schedule_ids }) {
    console.log(typeof schedule_ids);
    if (!schedule_ids) {
        throw new BadRequestError("schedule_id가 누락되었습니다.");
    }

    return await timetableModel.deleteRegisterTimetable(schedule_ids); 
}

// 휴보강 등록 Service
export const postRegisterHoliday = async function ({event_type, event_date, start_period, end_period, course_id, cancel_event_ids, classroom}) {

    // 공통 필드 검증
    if (!event_type || !event_date) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    if (!["CANCEL", "MAKEUP"].includes(event_type)) {
        throw new BadRequestError("CANCEL OR MAKEUP 값이 누락 되었습니다.");
    }

    // 휴강일 경우
    if (event_type === "CANCEL") {
        if (!course_id || start_period == null || end_period == null) {
            throw new BadRequestError("course_id, start_period, end_period 값이 누락 되었습니다.");
        }
    }

    // 보강일 경우
    if (event_type === "MAKEUP") {
        if (!Array.isArray(cancel_event_ids) || cancel_event_ids.length === 0) {
            throw new BadRequestError("cancel_event_ids 값이 누락 되었습니다.");
        }
        if (!classroom) {
            throw new BadRequestError("classroom 값이 누락 되었습니다.");
        }
    }

    // cancel_event_ids : CANCEL이면 빈 배열, MAKEUP이면 반드시 배열
    return await timetableModel.postRegisterHoliday(event_type, event_date, start_period, end_period, course_id, cancel_event_ids || [], classroom || null);
};

// 휴보강 수정
export const putRegisterHoliday = async function ({ event_id, event_type, event_date, start_period, end_period, course_id, cancel_event_ids, classroom}) {

    // 아이디 값 확인
    if (!event_id) {
        throw new BadRequestError("event_id 값이 누락 되었습니다.");
    }

    // 공통 필드 검증
    if (!event_type || !event_date) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    if (!["CANCEL", "MAKEUP"].includes(event_type)) {
        throw new BadRequestError("CANCEL OR MAKEUP 값이 누락 되었습니다.");
    }

    // 휴강일 경우
    if (event_type === "CANCEL") {
        if (!course_id || start_period == null || end_period == null) {
            throw new BadRequestError("course_id, start_period, end_period 값이 누락 되었습니다.");
        }
    }

    // 보강일 경우
    if (event_type === "MAKEUP") {
        if (!Array.isArray(cancel_event_ids) || cancel_event_ids.length === 0) {
            throw new BadRequestError("cancel_event_ids 값이 누락 되었습니다.");
        }
        if (!classroom) {
            throw new BadRequestError("classroom 값이 누락 되었습니다.");
        }
    }

    // cancel_event_ids : CANCEL이면 빈 배열, MAKEUP이면 반드시 배열
    return await timetableModel.putRegisterHoliday(event_id, event_type, event_date, start_period, end_period, course_id, cancel_event_ids || [], classroom || null);
};

// 휴보강 삭제
export const deleteRegisterHoliday = async function (event_id) {
    if (!event_id) {
        throw new BadRequestError("event_id 값이 누락 되었습니다.");
    }

    return await timetableModel.deleteRegisterHoliday(event_id);
}

// 분반 등록
export const postAssignStudents = async function ({class_id, student_ids}) {
    if (!class_id || !student_ids ) {
        throw new BadRequestError("classId or student_ids 값이 누락 되었습니다.");
    }
    return await timetableModel.postAssignStudents(class_id, student_ids);
}

// 분반 수정
export const putAssignStudents = async function ({ class_id, student_ids }) {
    if (!class_id || !student_ids) {
        throw new BadRequestError("class_id or student_ids 값이 누락 되었습니다.")
    }

    return await timetableModel.putAssignStudents(class_id, student_ids)
}

// 분반 삭제
export const deleteAssignStudents = async function (class_id) {
    if (!class_id ) {
        throw new BadRequestError("class_id 값이 누락 되었습니다.")
    }

    return await timetableModel.deleteAssignStudents(class_id)
}


// 휴보강 이력
export const getEvents = async function () {
    return await timetableModel.getEvents()
}

// 후까 교수님
export const getHukaStudentTimetable = async function(sec_id) {
    if (!sec_id) {
        throw new BadRequestError("sec_id 값이 없습니다.")
    }
    return await timetableModel.getHukaStudentTimetable(sec_id);
}

// 정규 상담 등록
export const postHukaStudentTimetable = async function ({student_ids, professor_id, sec_id, day_of_week, start_slot, end_slot, location}) {
    if (!student_ids || !professor_id || !sec_id || !day_of_week || !start_slot || !end_slot || !location) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }

    return await timetableModel.postHukaStudentTimetable(student_ids, professor_id, sec_id, day_of_week, start_slot, end_slot, location);
}

// 수정 상담 등록
export const postHukaCustomSchedule = async function ({student_ids, professor_id, date, start_slot, end_slot, location}) {
    if (!student_ids || student_ids.length === 0 || !professor_id || !date || !start_slot || !end_slot || !location) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }

    // sec_id 조회
    const sec_id = await timetableModel.findSecIdByDate(date);

    // sec_id가 없으면 에러
    if (!sec_id) {
        throw new BadRequestError("해당 날짜에 유효한 학기가 존재하지 않습니다.");
    }

    // 요일 계산
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const day_of_week = days[new Date(date).getDay()];

    return await timetableModel.postHukaCustomSchedule(student_ids, professor_id, sec_id, date, start_slot, end_slot, location, day_of_week);
}