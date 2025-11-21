import * as subjectService from '../../service/modal/subject-service.js';
import {getCoursesAll, getCoursesRegular} from "../../service/modal/subject-service.js";

// 정규 과목 조회
export const getcoursesRegular = async function (req, res, next) {
    try {
        const grade = req.query.grade;
        const result = await subjectService.getCoursesRegular(grade);
        res.status(200).json(result);
    } catch (err) {
        next(err)
    }
}


// 특강 과목 조회
export const getcoursesSpecial = async function (req, res, next) {
    try {
        const result = await subjectService.getCoursesSpecial();
        res.status(200).json(result);
    } catch (err) {
        next(err)
    }
}

// 한국어 과목 조회
export const getcoursesKorean = async function (req, res, next) {
    try {
        const result = await subjectService.getCoursesKorean();
        res.status(200).json(result);
    } catch (err) {
        next(err)
    }
}

// 전체 과목 조회
export const getcoursesAll = async function (req, res, next) {
    try {
        const {section_id} = req.params
        const result = await subjectService.getCoursesAll(section_id);
        res.status(200).json(result);
    } catch (err) {
        next(err)
    }
}

// 특강 분반 조회 (level_id 없이)
export const getSpecialClasses = async function (req, res, next) {
    try {
        const result = await subjectService.getSpecialClasses();
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

// 한국어 분반 조회
export const getKoreanClasses = async function (req, res, next) {
    try {
        const result = await subjectService.getKoreanClasses();
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

// 특강 스케줄 조회
export const getSpecialSchedule = async function (req, res, next) {
    try {
        const result = await subjectService.getSpecialSchedule();
        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
}

// 특강 학생 조회
export const getCourseStudents = async function (req, res, next) {
    try {
        const { class_id } = req.params;
        const result = await subjectService.getCourseStudents(class_id);
        res.status(200).json(result);
    } catch (err) {
        next(err)
    }
}

// 휴강 조회
export const getHolidays = async function (req, res, next) {
    try {
        const {grade_id} = req.query;
        const result = await subjectService.getHolidays(grade_id);
        res.status(200).json(result);
    } catch (err) {
        next(err)
    }
}


