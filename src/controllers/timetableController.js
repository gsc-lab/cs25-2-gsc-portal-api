import * as timetableService from "../service/timetable-service.js";

// 시간표 조회 (학생)
export const getStudentTimetable = async (req, res, next) => {
    try {
        const user_id = '2423001';
        const targetDate = req.query.date;

        const result = await timetableService.getStudentTimetable({
        user_id,
        targetDate,
        });

        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 시간표 조회 (교수)
export const getProfessorTimetable = async (req, res, next) => {
    try {
        const user_id = '8888001'
        const targetDate = req.query.date;

        const result = await timetableService.getProfessorTimetable({
        user_id,
        targetDate,
        });

        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 시간표 조회 (관리자)
export const getAdminTimetable = async (req, res, next) => {
    try {
        const targetDate = req.query.date;
        const result = await timetableService.getAdminTimetable(targetDate);

        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// =====================
// 강의 등록 / 수정 / 삭제
// =====================

// 강의 등록
export const postRegisterCourse = async (req, res, next) => {
    try {
        const { sec_id, title, professor_id, target, class_id, class_name } =
        req.body;

        const result = await timetableService.postRegisterCourse({
        sec_id,
        title,
        professor_id,
        target,
        class_id,
        class_name,
        });

        return res.status(201).json({
        success: true,
        message: "강의가 등록되었습니다.",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 강의 수정
export const putRegisterCourse = async (req, res, next) => {
    try {
        const { course_id } = req.params;
        const { sec_id, title, professor_id, target, class_id } = req.body;

        const result = await timetableService.putRegisterCourse({
        course_id,
        sec_id,
        title,
        professor_id,
        target,
        class_id,
        });

        return res.status(200).json({
        success: true,
        message: "강의가 수정되었습니다.",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 강의 삭제
export const deleteRegisterCourse = async (req, res, next) => {
    try {
        const { course_id } = req.params;

        const result = await timetableService.deleteRegisterCourse({ course_id });

        return res.status(200).json({
        success: true,
        message: "강의가 삭제되었습니다.",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// =====================
// 시간표 등록 / 수정 / 삭제
// =====================

// 시간표 등록
export const postRegisterTimetable = async (req, res, next) => {
    try {
        const { classroom_id, start_period, end_period, course_id, day_of_week } =
        req.body;

        const result = await timetableService.postRegisterTimetable({
        classroom_id,
        start_period,
        end_period,
        course_id,
        day_of_week,
        });

        return res.status(201).json({
        success: true,
        message: "시간표가 등록되었습니다.",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 시간표 수정
export const putRegisterTimetable = async (req, res, next) => {
    try {
        const schedule_ids = req.params.schedule_ids.split(",");
        const { classroom_id, start_period, end_period, day_of_week } = req.body;

        const result = await timetableService.putRegisterTimetable({
        schedule_ids,
        classroom_id,
        start_period,
        end_period,
        day_of_week,
        });

        return res.status(200).json({
        success: true,
        message: "시간표가 수정되었습니다.",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 시간표 삭제
export const deleteRegisterTimetable = async (req, res, next) => {
    try {
        const schedule_ids = req.params.schedule_ids.split(",");

        const result = await timetableService.deleteRegisterTimetable({
        schedule_ids,
        });

        return res.status(200).json({
        success: true,
        message: "시간표가 삭제되었습니다.",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// =====================
// 휴보강 등록 / 수정 / 삭제
// =====================

// 휴보강 등록
export const postRegisterHoliday = async (req, res, next) => {
    try {
        const {
        event_type,
        event_date,
        start_period,
        end_period,
        course_id,
        cancel_event_ids,
        classroom,
        } = req.body;

        const result = await timetableService.postRegisterHoliday({
        event_type,
        event_date,
        start_period,
        end_period,
        course_id,
        cancel_event_ids,
        classroom,
        });

        return res.status(201).json({
        success: true,
        message: "휴보강 등록이 완료되었습니다.",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 휴보강 수정
export const putRegisterHoliday = async (req, res, next) => {
    try {
        const { event_id } = req.params;
        const {
        event_type,
        event_date,
        start_period,
        end_period,
        course_id,
        cancel_event_ids,
        classroom,
        } = req.body;

        const result = await timetableService.putRegisterHoliday({
        event_id,
        event_type,
        event_date,
        start_period,
        end_period,
        course_id,
        cancel_event_ids,
        classroom,
        });

        return res.status(200).json({
        success: true,
        message: "휴보강 수정이 완료되었습니다.",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 휴보강 삭제
export const deleteRegisterHoliday = async (req, res, next) => {
    try {
        const { event_id } = req.params;

        const result = await timetableService.deleteRegisterHoliday(event_id);

        return res.status(200).json({
        success: true,
        message: "휴보강 삭제가 완료되었습니다.",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// =====================
// 분반 등록 / 수정 / 삭제
// =====================

// 분반 등록
export const postAssignStudents = async (req, res, next) => {
    try {
        const { class_id } = req.params;
        const { student_ids } = req.body;

        const result = await timetableService.postAssignStudents({
        class_id,
        student_ids,
        });

        return res.status(201).json({
        success: true,
        message: "분반 등록이 완료되었습니다.",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 분반 수정
export const putAssignStudents = async (req, res, next) => {
    try {
        const { class_id } = req.params;
        const { student_ids } = req.body;

        const result = await timetableService.putAssignStudents({
        class_id,
        student_ids,
        });

        return res.status(200).json({
        success: true,
        message: "분반 수정이 완료되었습니다.",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 분반 삭제
export const deleteAssignStudents = async (req, res, next) => {
    try {
        const { class_id } = req.params;

        const result = await timetableService.deleteAssignStudents(class_id);

        return res.status(200).json({
        success: true,
        message: "분반 삭제가 완료되었습니다.",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// =====================
// 휴보강 이력 / 학년-날짜 조회
// =====================

// 휴보강 이력
export const getEvents = async (req, res, next) => {
    try {
        const result = await timetableService.getEvents();

        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 학년, 날짜 조회
export const getGradeDate = async (req, res, next) => {
    try {
        const { grade, date } = req.query;

        const result = await timetableService.getGradeDate(grade, date);

        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// =====================
// 후까 교수님 상담 관련
// =====================

// 후까 교수님 – 학생 시간표 조회
export const getHukaStudentTimetable = async (req, res, next) => {
    try {
        const { sec_id } = req.query; // GET이니까 query로 받는 게 자연스러움

        const result = await timetableService.getHukaStudentTimetable(sec_id);

        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 정규 상담 등록
export const postHukaStudentTimetable = async (req, res, next) => {
    try {
        const professor_id = req.user.user_id; // authWithRole("professor")에서 세팅
        const { student_ids, sec_id, day_of_week, start_slot, end_slot, location } =
        req.body;

        const result = await timetableService.postHukaStudentTimetable({
        professor_id,
        student_ids,
        sec_id,
        day_of_week,
        start_slot,
        end_slot,
        location,
        });

        return res.status(201).json({
        success: true,
        message: "상담 시간이 등록되었습니다.",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 수정 상담 등록 (커스텀)
export const postHukaCustomSchedule = async (req, res, next) => {
    try {
        const professor_id = req.user.user_id;
        const { student_ids, date, start_slot, end_slot, location } = req.body;

        const result = await timetableService.postHukaCustomSchedule({
        professor_id,
        student_ids,
        date,
        start_slot,
        end_slot,
        location,
        });

        return res.status(201).json({
        success: true,
        message: "맞춤 상담 시간이 등록되었습니다.",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};
