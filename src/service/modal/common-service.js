import * as commonModal from "../../models/modal/Common.js";
import { requireFields } from "../../utils/validation.js";

// ========================
// 학기(Section) 조회 / 수정 / 삭제 / 등록
// ========================

// 학기 조회
export const getSections = async () => {
    return await commonModal.getSections();
};

// 학기 수정
export const putSections = async ({ sec_id, start_date, end_date }) => {
    requireFields({ sec_id, start_date, end_date }, [
        "sec_id",
        "start_date",
        "end_date",
    ]);

    return await commonModal.putSections(sec_id, start_date, end_date);
};

// 학기 삭제
export const deleteSections = async (sec_id) => {
    requireFields({ sec_id }, ["sec_id"]);

    return await commonModal.deleteSections(sec_id);
};

// 학기 등록
export const postSections = async ({ year, semester, start_date, end_date }) => {
    requireFields(
        { year, semester, start_date, end_date },
        ["year", "semester", "start_date", "end_date"]
    );

    return await commonModal.postSections(
        year,
        semester,
        start_date,
        end_date
    );
};

// ========================
// 공통 데이터 조회 (교수, 강의실, 교시, 요일)
// ========================

// 교수 목록
export const getProfessors = async () => {
    return await commonModal.getProfessors();
};

// 강의실 목록
export const getClassrooms = async () => {
    return await commonModal.getClassrooms();
};

// 교시 목록
export const getTimeslots = async () => {
    return await commonModal.getTimeslots();
};

// 요일 목록
export const getDays = async () => {
    return await commonModal.getDays();
};
