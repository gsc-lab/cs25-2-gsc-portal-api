import * as commonModal from '../../models/modal/Common.js';

// 학기 조회
export const getSections = async function() {
    return await commonModal.getSections();
}

// 교수 목록
export const getProfessors = async function() {
    return await commonModal.getProfessors();
}

// 강의실 목록
export const getClassrooms = async function() {
    return await commonModal.getClassrooms();
}

// 교시 목록
export const getTimeslots = async function() {
    return await commonModal.getTimeslots();
}

// 요일 목록
export const getDays = async function() {
    return await commonModal.getDays();
}
