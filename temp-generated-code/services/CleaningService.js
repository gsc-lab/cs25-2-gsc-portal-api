/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* 주간 청소 당번 조회
* 특정 학년 또는 특정 날짜를 기준으로 배정된 청소 당번 목록을 조회합니다.
*
* gradeUnderscoreid String 
* date date 조회하고 싶은 주(week)의 아무 날짜나 입력 (예: 2025-09-15)
* section String 조회할 학기 (예: 2025년 2학기) (optional)
* returns CleaningRosterResponse
* */
const cleaning_rostersGET = ({ gradeUnderscoreid, date, section }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        gradeUnderscoreid,
        date,
        section,
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
  cleaning_rostersGET,
};
