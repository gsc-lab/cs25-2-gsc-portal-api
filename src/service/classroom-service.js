import * as timetableModel from '../models/Timetable.js';

// 시간표 조회 (학생, 교수, 관리자)
export const getStudentTimetable = async function(user_id, targetDate) {
    return await timetableModel.getStudentTimetable(user_id, targetDate);
}

export const getProfessorTimetable = async function(user_id, targetDate) {
    return await timetableModel.getProfessorTimetable(user_id, targetDate);
}








// 후까 교수님
export const getHukaStudentTimetable = async function() {
    return await timetableModel.getHukaStudentTimetable();
}