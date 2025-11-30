import * as subjectModal from "../../models/modal/Subject.js";
import { requireFields } from "../../utils/validation.js";

// 정규 과목 조회
export const getCoursesRegular = async (grade) => {
    requireFields({ grade }, ["grade"]);
    return await subjectModal.getCoursesRegular(grade);
};

// 특강 과목 조회
export const getCoursesSpecial = async () => {
    return await subjectModal.getCoursesSpecial();
};

// 한국어 과목 조회
export const getCoursesKorean = async () => {
    return await subjectModal.getCoursesKorean();
};

// 전체 과목 조회
export const getCoursesAll = async (section_id) => {
    requireFields({ section_id }, ["section_id"]);
    return await subjectModal.getAllCourses(section_id);
};

// 특강 분반 조회 (level_id 없이)
export const getSpecialClasses = async () => {
    return await subjectModal.getSpecialClasses();
};

// 한국어 분반 조회
export const getKoreanClasses = async () => {
    return await subjectModal.getKoreanClasses();
};

// 특강 스케줄 조회
export const getSpecialSchedule = async () => {
    return await subjectModal.getSpecialSchedule();
};

// 특강 학생 조회
export const getCourseStudents = async (class_id) => {
    requireFields({ class_id }, ["class_id"]);
    return await subjectModal.getCourseStudents(class_id);
};

// 휴강 조회
export const getHolidays = async (grade_id) => {
    requireFields({ grade_id }, ["grade_id"]);
    return await subjectModal.getHolidays(grade_id);
};
