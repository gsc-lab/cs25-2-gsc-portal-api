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
export const postRegisterCourse = async ({sec_id, title, professor_id, target}) => {
    
    // 값 검증
    if (!sec_id || !title || !professor_id || !target || !target.category) {
        throw new BadRequestError("필수 값이 누락 되었습니다. (sec_id, title, professor_id, target.category)");
    }
    
    // targetInfo 객체 생성
    let targetInfo = { category: target.category };

    // 'regular'일 때만 grade_id를 검증
    if (target.category === "regular") {
        if (!target.grade_id) {
            throw new BadRequestError("정규 과목은 grade_id가 필요합니다.");
        }
        targetInfo.grade_id = target.grade_id;
    } 

    else if (target.category === "korean" || target.category === "special") {
        // (level_id 검증 로직 완전 삭제)
    } 
    else {
        throw new BadRequestError("유효하지 않은 target category입니다.");
    }

    // 5. 수정된 targetInfo를 모델로 전달
    const result =  await timetableModel.postRegisterCourse(sec_id, title, professor_id, targetInfo);
    return result
};

// 강의 수정
export const putRegisterCourse = async ({course_id, sec_id, title, professor_id, target}) => {
    
    // 강의 값 있는지 확인
    if (!course_id) {
        throw new BadRequestError("강의 값이 누락 되었습니다.")
    }
    
    // 값 검증
    if (!sec_id || !title || !professor_id || !target || !target.category) {
        throw new BadRequestError("필수 값이 누락 되었습니다. (target.category 포함)");
    }

    let targetInfo = { category: target.category };

    // 'regular'일 때만 grade_id를 검증
    if (target.category === "regular") {
        if (!target.grade_id) {
            throw new BadRequestError("정규 과목은 grade_id가 필요합니다.");
        }
        targetInfo.grade_id = target.grade_id;
    } 
    // 'korean' 또는 'special'은 grade_id가 필요 없음
    else if (target.category !== "korean" && target.category !== "special") {
        throw new BadRequestError("유효하지 않은 target category입니다.");
    }
    
    const result =  await timetableModel.putRegisterCourse(course_id, sec_id, title, professor_id, targetInfo);
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
export const postRegisterTimetable = async function ({classroom_id, course_id, day_of_week, start_period, end_period, class_name}) {
    if (!classroom_id || !start_period || !end_period || !course_id || !day_of_week) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }

    let class_id = null;

    // 특강인 경우 class_id 생성 및 등록
    if (class_name) {
        class_id = course_id + class_name;
        const exists = await timetableModel.findClassById(class_id);
        if (!exists) await timetableModel.insertCourseClass(class_id, course_id, class_name);
    }

    // 시간표 등록
    return await timetableModel.registerTimetable(classroom_id, course_id, day_of_week, start_period, end_period, class_id);
}

// 시간표 수정 (기존 시간표 삭제 후 다시 만들기)
export const putRegisterTimetable = async function({schedule_id, classroom_id, start_period, end_period, course_id, day_of_week, class_name}) {
    if (!schedule_id || !classroom_id || !start_period || !end_period || !course_id || !day_of_week) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }

    let class_id = null;

    // 특강일 경우
        if (class_name) {
        class_id = course_id + class_name;
        const exists = await timetableModel.findClassById(class_id);
        if (!exists) await timetableModel.insertCourseClass(class_id, course_id, class_name);
    }

    return await timetableModel.putRegisterTimetable(schedule_id, classroom_id, start_period, end_period, course_id, day_of_week, class_id);
}

// 시간표 삭제
export const deleteRegisterTimetable = async function({course_id, day_of_week}) {
    if (!course_id || !day_of_week) {
        throw new BadRequestError("course_id 또는 day_of_week가 누락되었습니다.");
    }

    return await timetableModel.deleteRegisterTimetable(course_id, day_of_week); 
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
export const postAssignStudents = async function ({class_id, course_id, student_ids}) {
    if (!class_id || !course_id || !student_ids ) {
        throw new BadRequestError("classId or student_ids 값이 누락 되었습니다.");
    }
    return await timetableModel.postAssignStudents(class_id, course_id, student_ids);
}

// 분반 수정
export const putAssignStudents = async function ({ class_id, course_id, student_ids }) {
    if (!class_id || !course_id || !student_ids) {
        throw new BadRequestError("class_id or student_ids 값이 누락 되었습니다.")
    }

    return await timetableModel.putAssignStudents(class_id, course_id, student_ids)
}

// 분반 삭제
export const deleteAssignStudents = async function (class_id, course_id) {
    if (!class_id || !course_id) {
        throw new BadRequestError("class_id 값이 누락 되었습니다.")
    }

    return await timetableModel.deleteAssignStudents(class_id, course_id)
}


// 휴보강 이력
export const getEvents = async function () {
    return await timetableModel.getEvents()
}

// 후까 교수님
export const getHukaStudentTimetable = async function() {
    return await timetableModel.getHukaStudentTimetable();
}

// 정규 상담 등록
export const postHukaStudentTimetable = async function ({student_ids, professor_id, sec_id, day_of_week, start_slot, end_slot, location}) {
    if (!student_ids || !professor_id || !sec_id || !day_of_week || !start_slot || !end_slot || !location) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }

    return await timetableModel.postHukaStudentTimetable(student_ids, professor_id, sec_id, day_of_week, start_slot, end_slot, location);
}

// 수정 상담 등록
export const postHukaCustomSchedule = async function ({student_ids, professor_id, sec_id, date, start_slot, end_slot, location}) {
    if (!student_ids || !professor_id || !date || !start_slot || !end_slot || !location) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    return await timetableModel.postHukaCustomSchedule(student_ids, professor_id, sec_id, date, start_slot, end_slot, location);
}