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
