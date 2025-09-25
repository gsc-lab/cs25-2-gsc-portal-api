import * as subjectModal from '../../models/modal/Subject.js';

// 정규 과목 조회
export const getcoursesRegular = async function(grade) {
    return await subjectModal.getcoursesRegular(grade);
}

// 특강 과목 조회
export const getcoursesSpecial = async function() {
    return await subjectModal.getcoursesSpecial();
}

// 한국어 과목 조회
export const getcoursesKorean = async function() {
    return await subjectModal.getcoursesKorean();
}

// 전체 과목 조회
export const getcoursesAll = async function() {
    return await subjectModal.getAllCourses();
}

// 레벨 목록 조회
export const getLevels = async function() {
    return await subjectModal.getLevels();
}

// 선택한 레벨의 반 목록 조회
export const getClassesByLevel = async function(level_id) {
    return await subjectModal.getClassesByLevel(level_id);
}

// 한국어 레벨 목록 조회
export const getKoreanLevels = async function() {
    return await subjectModal.getKoreanLevels();
}

