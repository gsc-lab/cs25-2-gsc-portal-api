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
export const postRegisterCourse = async (sec_id, title, professor_id, targetInfo) => {
    return await timetableModel.postRegisterCourse(sec_id, title, professor_id, targetInfo);
};

// 시간표 등록
export const postRegisterTimetable = async function (classroom_id, course_id, day_of_week, start_period, end_period, class_id) {
    return await timetableModel.registerTimetable(classroom_id, course_id, day_of_week, start_period, end_period, class_id);
}

// 휴보강 등록 Service
export const postRegisterHoliday = async function (
    event_type,
    event_date,
    start_period,
    end_period,
    course_id,
    cancel_event_ids,   // 배열
    classroom
    ) {
    
    return await timetableModel.postRegisterHoliday(
        event_type,
        event_date,
        start_period,
        end_period,
        course_id,
        cancel_event_ids,
        classroom
    );
};

// 분반 등록
export const postAssignStudents = async function (classId, student_ids) {
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