/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* 강의실 이번 주 예약 현황 조회
*
* classroomUnderscoreid String 
* startUnderscoredate date 
* endUnderscoredate date 
* returns List
* */
const classroomsClassroomIdReservationsGET = ({ classroomUnderscoreid, startUnderscoredate, endUnderscoredate }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        classroomUnderscoreid,
        startUnderscoredate,
        endUnderscoredate,
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
* 강의실
*
* classroomUnderscoreid String 
* classroomsClassroomIdReservationsPostRequest ClassroomsClassroomIdReservationsPostRequest 
* no response value expected for this operation
* */
const classroomsClassroomIdReservationsPOST = ({ classroomUnderscoreid, classroomsClassroomIdReservationsPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        classroomUnderscoreid,
        classroomsClassroomIdReservationsPostRequest,
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
* 예약 취소
*
* reservationUnderscoreid String 
* no response value expected for this operation
* */
const classroomsReservationsReservationIdDELETE = ({ reservationUnderscoreid }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        reservationUnderscoreid,
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
  classroomsClassroomIdReservationsGET,
  classroomsClassroomIdReservationsPOST,
  classroomsReservationsReservationIdDELETE,
};
