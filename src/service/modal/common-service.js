import * as commonModal from '../../models/modal/Common.js';
import { BadRequestError } from "../../errors/index.js";

// 학기 조회
export const getSections = async function() {
    return await commonModal.getSections();
}

// 학기 등록
export const postSections = async function({ year, semester, start_date, end_date }) {
    if (!year || !semester || !start_date || !end_date) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    return await commonModal.postSections(year, semester, start_date, end_date);
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
