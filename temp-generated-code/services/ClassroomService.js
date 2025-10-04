/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* 강의실 목록 조회
*
* returns List
* */
const classroomsGET = () => new Promise(
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
* 강의실 삭제
*
* id Integer 
* no response value expected for this operation
* */
const classroomsIdDELETE = ({ id }) => new Promise(
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
* 강의실 수정
*
* id Integer 
* classroomsIdPutRequest ClassroomsIdPutRequest 
* no response value expected for this operation
* */
const classroomsIdPUT = ({ id, classroomsIdPutRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
        classroomsIdPutRequest,
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
* 강의실 등록
*
* classroomsPostRequest ClassroomsPostRequest 
* no response value expected for this operation
* */
const classroomsPOST = ({ classroomsPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        classroomsPostRequest,
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
* 강의실 사용 목적 목록 조회
*
* returns List
* */
const classroomsPurposesGET = () => new Promise(
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
  classroomsGET,
  classroomsIdDELETE,
  classroomsIdPUT,
  classroomsPOST,
  classroomsPurposesGET,
};
