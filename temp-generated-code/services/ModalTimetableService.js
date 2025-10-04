/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* 특정 과목의 시간표 조회
*
* courseUnderscoreid String 
* returns List
* */
const modalScheduleCourseIdGET = ({ courseUnderscoreid }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        courseUnderscoreid,
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
  modalScheduleCourseIdGET,
};
