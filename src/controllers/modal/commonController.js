import * as commonService from "../../service/modal/common-service.js";

// 학기 조회
export const getSections = async function (req, res, next) {
    try {
        const result = await commonService.getSections();

        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 학기 수정
export const putSections = async function (req, res, next) {
    try {
        const { sec_id } = req.params;
        const { start_date, end_date } = req.body;

        const params = { sec_id, start_date, end_date };
        const result = await commonService.putSections(params);

        return res.status(200).json({
        success: true,
        message: "학기 수정 완료",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 학기 삭제
export const deleteSections = async function (req, res, next) {
    try {
        const { sec_id } = req.params;
        const result = await commonService.deleteSections(sec_id);

        return res.status(200).json({
        success: true,
        message: "학기 삭제 완료",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 학기 등록
export const postSections = async function (req, res, next) {
    try {
        const { year, semester, start_date, end_date } = req.body;
        const params = { year, semester, start_date, end_date };
        const result = await commonService.postSections(params);

        return res.status(201).json({
        success: true,
        message: "학기 등록 완료",
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 교수 목록
export const getProfessors = async function (req, res, next) {
    try {
        const result = await commonService.getProfessors();

        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 강의실 목록
export const getClassrooms = async function (req, res, next) {
    try {
        const result = await commonService.getClassrooms();

        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 교시 목록
export const getTimeslots = async function (req, res, next) {
    try {
        const result = await commonService.getTimeslots();

        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 요일 목록
export const getDays = async function (req, res, next) {
    try {
        const result = await commonService.getDays();

        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};
