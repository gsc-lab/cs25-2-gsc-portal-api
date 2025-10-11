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
export const postRegisterCourse = async ({sec_id, title, professor_id, target, level_id}) => {
    if (!sec_id || !title || !professor_id || !target) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    let targetInfo = {};
    if (["1", "2", "3"].includes(target)) {
        targetInfo = { category: "regular", grade_id: parseInt(target) };
    } 
    else if (target === "special") {
        if (!level_id) throw new BadRequestError("특강은 level_id가 필요합니다.");
        targetInfo = { category: "special", level_id };
    } 
    else if (target === "korean") {
        if (!level_id) throw new BadRequestError("한국어 수업은 level_id가 필요합니다.");
        targetInfo = { category: "korean", level_id };
    } 
    else {
        throw new BadRequestError("유효하지 않은 target 값입니다.");
    }
    const result =  await timetableModel.postRegisterCourse(sec_id, title, professor_id, targetInfo);

    return result
};

// 시간표 등록
export const postRegisterTimetable = async function ({classroom_id, course_id, day_of_week, start_period, end_period, class_name}) {
    if (!classroom_id || !start_period || !end_period || !course_id || !day_of_week) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }

    let class_id = null;

    // 1️특강인 경우 class_id 생성 및 등록
    if (class_name) {
        class_id = course_id + class_name;
        const exists = await timetableModel.findClassById(class_id);
        if (!exists) await timetableModel.insertCourseClass(class_id, course_id, class_name);
    }

    // 시간표 등록
    return await timetableModel.registerTimetable(classroom_id, course_id, day_of_week, start_period, end_period, class_id);
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

// 분반 등록
export const postAssignStudents = async function ({classId, student_ids}) {
    if (!classId || !student_ids ) {
        throw new BadRequestError("classId or student_ids 값이 누락 되었습니다.");
    }
    return await timetableModel.postAssignStudents(classId, student_ids);
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