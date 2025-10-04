/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* 예외 이메일 관리
*
* returns List
* */
const adminEmailGET = () => new Promise(
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
* 예외 이메일 삭제
*
* id Integer 
* no response value expected for this operation
* */
const adminEmailIdDELETE = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
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
* 예외 이메일 등록
*
* adminEmailPostRequest AdminEmailPostRequest 
* no response value expected for this operation
* */
const adminEmailPOST = ({ adminEmailPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        adminEmailPostRequest,
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
* 학생 정보 관리
*
* gradeUnderscoreid Integer 학년 (1=1학년, 2=2학년, 3=3학년) (optional)
* status String 학생 상태 (optional)
* returns List
* */
const adminStudentsGET = ({ gradeUnderscoreid, status }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        gradeUnderscoreid,
        status,
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
* 학생 삭제
*
* id String 
* no response value expected for this operation
* */
const adminStudentsIdDELETE = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
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
* 학생 정보 수정
*
* userUnderscoreid Integer 
* adminStudentsUserIdPatchRequest AdminStudentsUserIdPatchRequest 
* no response value expected for this operation
* */
const adminStudentsUserIdPATCH = ({ userUnderscoreid, adminStudentsUserIdPatchRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        userUnderscoreid,
        adminStudentsUserIdPatchRequest,
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
* 관리자 사용자 승인
*
* returns List
* */
const adminUsersGET = () => new Promise(
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
* 사용자 삭제
*
* id String 
* no response value expected for this operation
* */
const adminUsersIdDELETE = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
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
* 사용자 승인/거절 처리
*
* adminUsersPostRequest AdminUsersPostRequest 
* no response value expected for this operation
* */
const adminUsersPOST = ({ adminUsersPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        adminUsersPostRequest,
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
  adminEmailGET,
  adminEmailIdDELETE,
  adminEmailPOST,
  adminStudentsGET,
  adminStudentsIdDELETE,
  adminStudentsUserIdPATCH,
  adminUsersGET,
  adminUsersIdDELETE,
  adminUsersPOST,
};
