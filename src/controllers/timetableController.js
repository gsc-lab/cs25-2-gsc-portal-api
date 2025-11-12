import * as timetableService from '../service/timetable-service.js';

// 시간표 조회 (학생, 교수, 관리자)
// 학생
export const getStudentTimetable = async function (req, res, next) {
    try {
        const user_id = req.params.user_id;
        const targetDate = req.query.date;
        const params = {user_id, targetDate};
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
        const params = {user_id, targetDate};
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
        const { sec_id, title, professor_id, target } = req.body;
        const params = {sec_id, title, professor_id, target} ;
        const result = await timetableService.postRegisterCourse(params);
        res.status(201).json({ message: "등록 완료", course: result });
    } catch (err) {
        next(err)
    }
};

// 강의 수정
export const putRegisterCourse = async (req, res, next) => {
    try {
        const { course_id } = req.params;
        const { sec_id, title, professor_id, target } = req.body;
        const params = { course_id, sec_id, title, professor_id, target };
        const result = await timetableService.putRegisterCourse(params);
        res.status(200).json({ message: "수정 완료", course: result });
    } catch (err) {
        next(err)
    }
}

// 강의 삭제
export const deleteRegisterCourse = async (req, res, next) => {
    try {
        const { course_id } = req.params;
        const params = { course_id }
        const result = await timetableService.deleteRegisterCourse(params);
        res.status(200).json({ message: "삭제 완료", course: result });
    } catch (err) {
        next(err)
    }
}

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

// 시간표 수정
export const putRegisterTimetable = async (req, res, next) => {
    try {
        const { schedule_id } = req.params;
        const { classroom_id, start_period, end_period, course_id, day_of_week, class_name } = req.body;
        const params = { schedule_id, classroom_id, start_period, end_period, course_id, day_of_week, class_name }
        const result = await timetableService.putRegisterTimetable(params);
        res.status(200).json({ message: "수정 완료", course: result})
    } catch (err) {
        next(err)
    }
}

// 시간표 삭제
export const deleteRegisterTimetable = async (req, res, next) => {
    try {
        const { schedule_id } = req.params;
        const params = { schedule_id }
        const result = await timetableService.deleteRegisterTimetable(params);
        res.status(200).json({ message: "삭제 완료", result });
    } catch (err) {
        next(err);
    }
};


// 휴보강 등록
export const postRegisterHoliday = async function (req, res, next) {
    try {
        const { event_type, event_date, start_period, end_period, course_id, cancel_event_ids, classroom } = req.body;

        const params = {event_type, event_date, start_period, end_period, course_id, cancel_event_ids, classroom };

        const result = await timetableService.postRegisterHoliday(params);

        res.status(201).json({ message: "휴보강 등록이 완료되었습니다.", result });
    } catch (err) {
        next(err);
    }
};


// 휴보강 수정
export const putRegisterHoliday = async function (req, res, next) {
    try {
        const { event_id } = req.params;
        const { event_type, event_date, start_period, end_period, course_id, cancel_event_ids, classroom } = req.body;

        const params = { event_id, event_type, event_date, start_period, end_period, course_id, cancel_event_ids, classroom }

        const result = await timetableService.putRegisterHoliday(params);
        
        res.status(200).json({ message: "휴보강 수정이 완료되었습니다.", result });
    } catch (err) {
        next(err)
    }
}

// 휴보강 삭제
export const deleteRegisterHoliday = async function (req, res, next) {
    try {
        const { event_id } = req.params;
        const result = await timetableService.deleteRegisterHoliday(event_id);

        res.status(200).json({ message: "휴보강 삭제가 완료되었습니다.", result });
    } catch (err) {
        next(err)
    }
}

// 분반 등록
export const postAssignStudents = async function (req, res, next) {
    try {
        const { class_id, course_id } = req.params
        const { student_ids } = req.body 
        const params = { class_id, course_id, student_ids };
        const result = await timetableService.postAssignStudents(params)

        return res.status(201).json({ message: "등록 완료", result});
    } catch (err) {
        next(err)
    }
}

// 분반 수정
export const putAssignStudents = async function (req, res, next) {
    try {
        const { class_id, course_id } = req.params
        const { student_ids } = req.body

        const params = { class_id, course_id, student_ids }
        const result = await timetableService.putAssignStudents(params)

        return res.status(200).json({ message: "분반 수정 완료", result })
    } catch (err) {
        next(err)
    }
}

// 분반 삭제
export const deleteAssignStudents = async function (req, res, next) {
    try {
        const { class_id, course_id } = req.params
        const result = await timetableService.deleteAssignStudents(class_id, course_id)

        return res.status(200).json({ message: "분반 삭제 완료", result})
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
        const { student_ids, date, start_slot, end_slot, location } = req.body;
        const params = { professor_id, student_ids, date, start_slot, end_slot, location};
        const result = await timetableService.postHukaCustomSchedule(params);

        return res.status(201).json({ message: "등록 완료", result });
    } catch (err) {
        next(err)
    }
};



