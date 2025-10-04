/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* 특정 사용자들에게 직접 메시지 발송
* - Request Body에 명시된 사용자 ID 목록을 대상으로 즉시 메시지를 발송합니다. - 공지사항과 연동되지 않습니다. 
*
* directMessageRequest DirectMessageRequest 
* returns KakaoEnqueueResponse
* */
const dispatchDirectPOST = ({ directMessageRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        directMessageRequest,
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
* 발송 작업 상태 조회
*
* jobId String 
* returns _dispatch_jobs__jobId__get_200_response
* */
const dispatchJobsJobIdGET = ({ jobId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        jobId,
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
  dispatchDirectPOST,
  dispatchJobsJobIdGET,
};
