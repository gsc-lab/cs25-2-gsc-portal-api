import * as timetableModel from '../models/Timetable.js';

// 시간표 조회 (학생, 교수, 관리자)
export const getStudentTimetable = async function(user_id, targetDate) {
    return await timetableModel.getStudentTimetable(user_id, targetDate);
}

export const getProfessorTimetable = async function(user_id, targetDate) {
    return await timetableModel.getProfessorTimetable(user_id, targetDate);
}

export const getAdminTimetable = async function(targetDate) {
    return await timetableModel.getAdminTimetable(targetDate);
}

// 강의 등록
export const postRegisterCourse = async function (sec_id, title, professor_id, target) {
    return await timetableModel.registerCourse(sec_id, title, professor_id, target);
};

// 시간표 등록
export const postRegisterTimetable = async function (classroom_id, course_id, day_of_week, start_period, end_period) {
    return await timetableModel.registerTimetable(classroom_id, course_id, day_of_week, start_period, end_period);
}





// 후까 교수님
export const getHukaStudentTimetable = async function() {
    return await timetableModel.getHukaStudentTimetable();
}