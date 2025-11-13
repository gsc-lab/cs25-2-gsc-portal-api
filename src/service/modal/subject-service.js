import * as subjectModal from '../../models/modal/Subject.js';
import { BadRequestError } from "../../errors/index.js";

// 정규 과목 조회
export const getCoursesRegular = async function(grade) {
    if (!grade) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    return await subjectModal.getCoursesRegular(grade);
};

// 특강 과목 조회
export const getCoursesSpecial = async function() {
    return await subjectModal.getCoursesSpecial();
};

// 한국어 과목 조회
export const getCoursesKorean = async function() {
    return await subjectModal.getCoursesKorean();
};

// 전체 과목 조회
export const getCoursesAll = async function() {
    return await subjectModal.getAllCourses();
};

// 특강 분반 조회 (level_id 없이)
export const getSpecialClasses = async function() {
    return await subjectModal.getSpecialClasses();
};

// 한국어 분반 조회
export const getKoreanClasses = async function() {
    return await subjectModal.getKoreanClasses();
};

// 특강 스케줄 조회
export const getSpecialSchedule = async function() {
    return await subjectModal.getSpecialSchedule();
};

// 특강 학생 조회
export const getCourseStudents = async function(class_id) {
    if (!class_id) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    return await subjectModal.getCourseStudents(class_id);
};

// 휴강 조회
export const getHolidays = async function(grade_id) {
    if (!grade_id) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    return await subjectModal.getHolidays(grade_id);
};
