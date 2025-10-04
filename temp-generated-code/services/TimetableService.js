/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* 전체 시간표 조회 (주간)
* 관리자가 전체 시간표를 주간 단위로 조회합니다.   - 모든 학년, 특강, 한국어 포함   - 주간 범위는 `week_start`, `week_end` 쿼리 파라미터로 지정 
*
* weekUnderscorestart date 
* weekUnderscoreend date 
* returns List
* */
const timetablesAdminGET = ({ weekUnderscorestart, weekUnderscoreend }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        weekUnderscorestart,
        weekUnderscoreend,
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
* 휴‧보강 취소
*
* id String 
* no response value expected for this operation
* */
const timetablesEventsIdDELETE = ({ id }) => new Promise(
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
* 휴‧보강 등록
*
* timetablesEventsPostRequest TimetablesEventsPostRequest 
* no response value expected for this operation
* */
const timetablesEventsPOST = ({ timetablesEventsPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        timetablesEventsPostRequest,
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
* 교수 시간표 조회 (주간)
* 특정 교수의 주간 시간표를 조회합니다.   - 본인이 담당하는 과목만 표시   - 주간 범위는 `week_start`, `week_end` 쿼리 파라미터로 지정 
*
* userUnderscoreid Integer 교수 사용자 ID
* weekUnderscorestart date 
* weekUnderscoreend date 
* returns List
* */
const timetablesProfessorUserIdGET = ({ userUnderscoreid, weekUnderscorestart, weekUnderscoreend }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        userUnderscoreid,
        weekUnderscorestart,
        weekUnderscoreend,
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
* 학생 시간표 조회 (주간)
* 특정 학생의 주간 시간표를 조회합니다.   - 정규 수업 → 학생 학년 기준   - 특강 → 학생 레벨 + 언어 기준   - 한국어 → 유학생만 허용   - 주간 범위는 `week_start`, `week_end` 쿼리 파라미터로 지정 
*
* userUnderscoreid Integer 학생 사용자 ID
* weekUnderscorestart date 주 시작일 (예: 2025-09-15)
* weekUnderscoreend date 주 종료일 (예: 2025-09-21)
* returns List
* */
const timetablesStudentUserIdGET = ({ userUnderscoreid, weekUnderscorestart, weekUnderscoreend }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        userUnderscoreid,
        weekUnderscorestart,
        weekUnderscoreend,
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
* 시간표 삭제
*
* type String 
* id String 
* no response value expected for this operation
* */
const timetablesTypeDELETE = ({ type, id }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        type,
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
* 시간표 등록 (정규 / 특강 / 한국어)
*
* type String 시간표 유형 (정규/특강/한국어)
* timetablesTypePostRequest TimetablesTypePostRequest 
* no response value expected for this operation
* */
const timetablesTypePOST = ({ type, timetablesTypePostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        type,
        timetablesTypePostRequest,
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
* 시간표 수정
*
* type String 
* id String 
* timetablesTypePutRequest TimetablesTypePutRequest 
* no response value expected for this operation
* */
const timetablesTypePUT = ({ type, id, timetablesTypePutRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        type,
        id,
        timetablesTypePutRequest,
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
  timetablesAdminGET,
  timetablesEventsIdDELETE,
  timetablesEventsPOST,
  timetablesProfessorUserIdGET,
  timetablesStudentUserIdGET,
  timetablesTypeDELETE,
  timetablesTypePOST,
  timetablesTypePUT,
};
