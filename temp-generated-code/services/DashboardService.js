/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* 메인 대시보드 데이터 조회
* - 로그인한 사용자의 메인 화면에 필요한 모든 데이터를 조회합니다. - 사용자의 역할(학생, 교수, 관리자)에 따라 반환되는 데이터가 달라집니다. 
*
* returns DashboardResponse
* */
const dashboardGET = () => new Promise(
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
  dashboardGET,
};
