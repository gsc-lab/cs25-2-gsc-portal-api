import * as timetableService from '../service/timetable-service.js';

// 시간표 조회 (학생, 교수, 관리자)
// 학생
export const getStudentTimetable = async function (req, res, next) {
    try {
        const user_id = req.params.user_id;
        const targetDate = req.query.date;
        const params = [user_id, targetDate];
        const result = await timetableService.getStudentTimetable(params);
        res.status(200).json(result);
    } catch (err) {
        next(err)
    }
};

// 교수
export const getProfessorTimetable = async function (req, res, next) {
    try {
        const user_id = req.params.user_id;
        const targetDate = req.query.date;
        const params = [user_id, targetDate];
        const result = await timetableService.getProfessorTimetable(params);
        res.status(200).json(result);
    } catch(err) {
        next(err)
    }
}

// 관리자
export const getAdminTimetable = async function (req, res, next) {
    try {
        const targetDate = req.query.date;
        const result = await timetableService.getAdminTimetable(targetDate);
        res.status(200).json(result);
    } catch(err) {
        next(err)
    }
}

// 강의 등록
export const postRegisterCourse = async (req, res, next) => {
    try {
        const { sec_id, title, professor_id, target, level_id } = req.body;
        const params = {sec_id, title, professor_id, target, level_id};
        const result = await timetableService.postRegisterCourse(params);
        res.status(201).json({ message: "등록 완료", course: result });
    } catch (err) {
        next(err)
    }
};

// 시간표 등록
export const postRegisterTimetable = async function (req, res, next) {
    try {
        const { classroom_id, start_period, end_period, course_id, day_of_week, class_name } = req.body;
        const params = {classroom_id, start_period, end_period, course_id, day_of_week, class_name}
        const result = await timetableService.postRegisterTimetable(params);
        res.status(201).json({ message: "등록 완료", course: result });
    } catch (err) {
        next(err)
    }
}


// 휴보강 등록
export const postRegisterHoliday = async function (req, res, next) {
    try {
        const {event_type, event_date, start_period, end_period, course_id, cancel_event_ids, classroom,} = req.body;
        const params = { event_type, event_date, start_period, end_period, course_id, cancel_event_ids, classroom}
        const result = await timetableService.postRegisterHoliday(params);
        return res.status(201).json({ message: "휴보강 등록 완료", result });
    } catch (err) {
        next(err)
    }
};

// 분반 등록
export const postAssignStudents = async function (req, res, next) {
    try {
        const params = { classId, student_ids };
        const result = await timetableService.postAssignStudents(params)

        return res.status(201).json({ message: "등록 완료", result});
    } catch (err) {
        next(err)
    }
}

// 휴보강 이력
export const getEvents = async function (req, res, next) {
    try {
        const result = await timetableService.getEvents()
        res.status(200).json({result})
    } catch (err) {
        next(err)
    }
}

// 후까 교수님
export const getHukaStudentTimetable = async function (req, res, next) {
    try {
        const result = await timetableService.getHukaStudentTimetable();
        res.status(200).json(result);
    } catch(err) {
        next(err)
    }
}

// 정규 상담 등록
export const postHukaStudentTimetable = async function (req, res, next) {
    try {
        const professor_id = req.user.user_id;
        const { student_ids, sec_id, day_of_week, start_slot, end_slot, location} = req.body;
        const params = {professor_id, student_ids, sec_id, day_of_week, start_slot, end_slot, location};
        const result = await timetableService.postHukaStudentTimetable(params);

        return res.status(201).json({ message: "등록 완료", result });
    } catch (err) {
        next(err)
    }
};

// 수정 상담 등록
export const postHukaCustomSchedule = async function (req, res, next) {
    try {
        const professor_id = req.user.user_id;
        const { student_ids, sec_id, date, start_slot, end_slot, location } = req.body;
        const params = { student_ids, sec_id, date, start_slot, end_slot, location};
        const result = await timetableService.postHukaCustomSchedule(params);

        return res.status(201).json({ message: "등록 완료", result });
    } catch (err) {
        next(err)
    }
};



