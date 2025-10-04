import * as classroomService from '../service/classroom-service.js';

// 시간표 조회 (학생, 교수, 관리자)
// 학생
export const getStudentTimetable = async function (req, res) {
    try {
        const user_id = req.params.user_id;
        const targetDate = req.query.date;

        if (!user_id || !targetDate) {
        return res.status(400).json({ error: "user_id and date are required" });
        }

        const result = await classroomService.getStudentTimetable(user_id, targetDate);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 교수
export const getProfessorTimetable = async function (req, res) {
    try {
        const user_id = req.params.user_id;
        const targetDate = req.query.date;

        if (!user_id || !targetDate) {
            return res.status(400).json({ error: "user_id and date are required" });
        }

        const result = await classroomService.getProfessorTimetable(user_id, targetDate);
        res.status(200).json(result);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// 관리자
export const getAdminTimetable = async function (req, res) {
    try {
        const targetDate = req.query.date;
        if (!targetDate) {
            return res.status(400).json({ error: "date is required" });
        }
        const result = await classroomService.getAdminTimetable(targetDate);
        res.status(200).json(result);

    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// 강의 등록
export const postRegisterCourse = async (req, res) => {
    try {
        const { sec_id, title, professor_id, target, level_id } = req.body;

        if (!sec_id || !title || !professor_id || !target) {
        return res.status(400).json({
            error: "sec_id, title, professor_id, target are required",
        });
        }

        let targetInfo = {};
        if (["1", "2", "3"].includes(target)) {
        targetInfo = { grade_id: parseInt(target), category: "regular" };
        } else if (target === "special") {
        if (!level_id) {
            return res.status(400).json({ error: "special requires level_id" });
        }
        targetInfo = { category: "special", level_id };
        } else if (target === "korean") {
        if (!level_id) {
            return res.status(400).json({ error: "korean requires level_id" });
        }
        targetInfo = { category: "korean", level_id };
        } else {
        return res.status(400).json({ error: "Invalid target value" });
        }

        const result = await classroomService.postRegisterCourse(
        sec_id,
        title,
        professor_id,
        targetInfo
        );

        res.status(200).json({ message: "등록 완료", course: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 시간표 등록
export const postRegisterTimetable = async function (req, res) {
    try {
        const { classroom_id, start_period, end_period, course_id, day_of_week, class_id } = req.body;

        if (!classroom_id || !start_period || !end_period || !course_id || !day_of_week) {
            return res.status(400).json({ error: "classroom_id, start_period, end_period, course_id, day_of_week are required" })
        }

        const result = await classroomService.postRegisterTimetable(
            classroom_id, course_id, day_of_week, start_period, end_period, class_id || null
        );

        res.status(200).json({ message: "등록 완료", course: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


// 휴보강 등록
export const postRegisterHoliday = async function (req, res) {
    try {
        const {
        event_type,
        event_date,
        start_period,
        end_period,
        course_id,
        cancel_event_ids,  // ✅ 항상 배열
        classroom,
        } = req.body;

        // 공통 필드 검증
        if (!event_type || !event_date) {
        return res.status(400).json({ error: "event_type, event_date are required" });
        }
        if (!["CANCEL", "MAKEUP"].includes(event_type)) {
        return res.status(400).json({ error: "event_type must be CANCEL or MAKEUP" });
        }

        // 휴강일 경우
        if (event_type === "CANCEL") {
        if (!course_id || start_period == null || end_period == null) {
            return res.status(400).json({
            error: "CANCEL : course_id, start_period, end_period are required",
            });
        }
        }

        // 보강일 경우
        if (event_type === "MAKEUP") {
        if (!Array.isArray(cancel_event_ids) || cancel_event_ids.length === 0) {
            return res.status(400).json({
            error: "MAKEUP : cancel_event_ids (array) is required",
            });
        }
        if (!classroom) {
            return res.status(400).json({ error: "MAKEUP : classroom is required" });
        }
        }

        const result = await classroomService.postRegisterHoliday(
        event_type,
        event_date,
        start_period,
        end_period,
        course_id,
        cancel_event_ids || [],  // ✅ CANCEL이면 빈 배열, MAKEUP이면 반드시 배열
        classroom || null
        );

        return res.status(200).json({ message: "등록 완료", result });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// 분반 등록

// 휴보강 이력
export const getEvents = async function (req, res) {
    try {

        const result = await classroomService.getEvents()
        res.status(200).json({result})

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}








// 후까 교수님
export const getHukaStudentTimetable = async function (req, res) {
    try {
        const result = await classroomService.getHukaStudentTimetable();
        res.status(200).json(result);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
