/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* 공지사항 목록 조회
* - 학생: 자신에게 타겟된 공지 및 전체 공지 - 교수/관리자: 모든 공지 
*
* page Integer 조회할 페이지 번호 (기본값: 1)
* size Integer 한 페이지에 보여줄 공지 수 (기본값: 10)
* courseUnderscoretype String 과목 타입을 필터링합니다. (값: 정규, 특강, 한국어) (optional)
* gradeUnderscoreid String (학생 전용) 특정 학년 타겟 공지를 추가로 필터링합니다. (optional)
* levelUnderscoreid String (학생 전용) 특정 레벨 타겟 공지를 추가로 필터링합니다. (optional)
* languageUnderscoreid String (학생 전용) 특정 언어 타겟 공지를 추가로 필터링합니다. (optional)
* returns List
* */
const noticesGET = ({ page, size, courseUnderscoretype, gradeUnderscoreid, levelUnderscoreid, languageUnderscoreid }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        page,
        size,
        courseUnderscoretype,
        gradeUnderscoreid,
        levelUnderscoreid,
        languageUnderscoreid,
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
* 공지사항 삭제 (관리자/교수용)
* 특정 공지사항을 삭제합니다.
*
* noticeId Integer 
* no response value expected for this operation
* */
const noticesNoticeIdDELETE = ({ noticeId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        noticeId,
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
* 공지의 대상자에게 메시지 발송
* - noticeId에 해당하는 공지 내용을 기반으로, 해당 공지에 설정된 타겟(학년/레벨 등)에게 알림을 발송합니다. - 대상자는 서버에서 자동으로 조회합니다. - 대량 발송은 비동기로 처리하고 job_id를 반환합니다. 
*
* noticeId Integer 
* noticesNoticeIdDispatchPostRequest NoticesNoticeIdDispatchPostRequest (선택 사항) 특정 채널을 지정할 때 사용합니다. 비워두면 서버 기본값(카카오)으로 동작합니다. (optional)
* returns KakaoEnqueueResponse
* */
const noticesNoticeIdDispatchPOST = ({ noticeId, noticesNoticeIdDispatchPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        noticeId,
        noticesNoticeIdDispatchPostRequest,
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
* 공지사항 상세 조회
* 특정 공지사항의 상세 내용을 조회합니다. 학생이 이 API를 호출하면 자동으로 '읽음' 처리됩니다.
*
* noticeId Integer 
* returns NoticeDetail
* */
const noticesNoticeIdGET = ({ noticeId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        noticeId,
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
* 공지사항 수정 (관리자/교수용)
* 특정 공지사항의 내용을 수정합니다.
*
* noticeId Integer 
* noticeUpdateRequest NoticeUpdateRequest 
* no response value expected for this operation
* */
const noticesNoticeIdPATCH = ({ noticeId, noticeUpdateRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        noticeId,
        noticeUpdateRequest,
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
* 공지 읽음 처리 (학생 본인)
* 현재 로그인한 사용자의 읽음 상태를 갱신합니다. 멱등적으로 동작합니다.
*
* noticeId Integer 
* no response value expected for this operation
* */
const noticesNoticeIdReadPATCH = ({ noticeId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        noticeId,
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
* 공지사항 수신자 및 읽음 현황 조회 (관리자/교수용)
* 특정 공지사항을 수신한 모든 사용자와 각 사용자의 읽음 상태를 조회합니다.
*
* noticeId Integer 
* returns List
* */
const noticesNoticeIdStatusGET = ({ noticeId }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        noticeId,
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
* 공지사항 생성 (관리자/교수용)
* 새로운 공지사항을 생성합니다.
*
* title String 공지사항 제목 (optional)
* content String 공지사항 본문 내용 (optional)
* courseUnderscoreid String 과목 공지일 경우 해당하는 과목 ID. 전체 공지일 경우 생략 가능. (optional)
* targets List 공지 대상을 지정하는 객체 배열. multipart/form-data 전송 시에는 이 배열을 JSON 문자열로 변환하여 보내야 합니다. (optional)
* files List 첨부할 파일들 (optional)
* returns _notices_post_200_response
* */
const noticesPOST = ({ title, content, courseUnderscoreid, targets, files }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        title,
        content,
        courseUnderscoreid,
        targets,
        files,
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
  noticesGET,
  noticesNoticeIdDELETE,
  noticesNoticeIdDispatchPOST,
  noticesNoticeIdGET,
  noticesNoticeIdPATCH,
  noticesNoticeIdReadPATCH,
  noticesNoticeIdStatusGET,
  noticesPOST,
};
