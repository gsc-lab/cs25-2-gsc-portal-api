import * as commonService from '../../service/modal/common-service.js';

// 학기 조회
export const getSections = async function (req, res) {
    try {
        const result = await commonService.getSections();
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

// 교수 목록
export const getProfessors = async function (req, res) {
    try {
        const result = await commonService.getProfessors();
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


// 강의실 목록
export const getClassrooms = async function (req, res) {
    try {
        const result = await commonService.getClassrooms();
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


// 교시 목록 
export const getTimeslots = async function (req, res) {
    try {
        const result = await commonService.getTimeslots();
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}


// 요일 목록
export const getDays = async function (req, res) {
    try {
        const result = await commonService.getDays();
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
