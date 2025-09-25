import * as subjectService from '../../service/modal/subject-service.js';

// 정규 과목 조회
export const getcoursesRegular = async function (req, res) {
    try {
        const grade = req.query.grade;
        if (!grade) {
            return res.status(400).json({ error: "grade is required" });
        }

        const result = await subjectService.getcoursesRegular(grade);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// 특강 과목 조회
export const getcoursesSpecial = async function (req, res) {
    try {
        const result = await subjectService.getcoursesSpecial();
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


// 한국어 과목 조회
export const getcoursesKorean = async function (req, res) {
    try {
        const result = await subjectService.getcoursesKorean();
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// 전체 과목 조회
export const getcoursesAll = async function (req, res) {
    try {
        const result = await subjectService.getcoursesAll();
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// 레벨 목록 조회
export const getLevels = async function (req, res) {
    try {
        const result = await subjectService.getLevels();
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// 선택한 레벨의 반 목록 조회
export const getClassesByLevel = async function (req, res) {
    try {
        const level_id = req.query.level_id;
        if (!level_id) {
            return res.status(400).json({ error: "level_id is required" });
        }
        const result = await subjectService.getClassesByLevel(level_id);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// 한국어 레벨 목록 조회
export const getKoreanLevels = async function (req, res) {
    try {
        const result = await subjectService.getKoreanLevels();
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
