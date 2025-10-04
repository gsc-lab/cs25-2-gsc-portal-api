/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* 선택한 레벨의 반 목록 조회
*
* levelUnderscoreid String 
* returns List
* */
const modalClassesLevelIdGET = ({ levelUnderscoreid }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        levelUnderscoreid,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* 전체 과목 목록 조회 (정규 + 특강 + 한국어)
*
* returns List
* */
const modalCoursesAllGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* 한국어 과목 목록 조회
*
* returns List
* */
const modalCoursesKoreanGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* 정규 과목 목록 조회
*
* returns List
* */
const modalCoursesRegularGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* 특강 과목 목록 조회
*
* returns List
* */
const modalCoursesSpecialGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* 레벨 목록 조회
*
* returns List
* */
const modalLevelsGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* 한국어 레벨 목록 조회 (TOPIK 계열)
*
* returns List
* */
const modalLevelsKoreanGET = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

module.exports = {
  modalClassesLevelIdGET,
  modalCoursesAllGET,
  modalCoursesKoreanGET,
  modalCoursesRegularGET,
  modalCoursesSpecialGET,
  modalLevelsGET,
  modalLevelsKoreanGET,
};
