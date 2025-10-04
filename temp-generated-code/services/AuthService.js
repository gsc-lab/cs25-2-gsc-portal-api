/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Google OAuth 인증 완료 후 콜백 처리
* Google 인증 성공 후 전달받은 code를 기반으로 토큰 요청 및 사용자 정보를 처리합니다.
*
* code String Google에서 전달하는 인증 코드
* returns AuthResponse
* */
const authGoogleCallbackGET = ({ code }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        code,
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
* Google OAuth 인증 URL 요청
* 사용자가 로그인 버튼 클릭 시, Google OAuth 인증을 위한 URL을 반환합니다.
*
* returns _auth_google_get_200_response
* */
const authGoogleGET = () => new Promise(
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
* 현재 로그인된 사용자 정보
* JWT를 통해 로그인된 사용자의 정보를 반환합니다.
*
* returns User
* */
const authMeGET = () => new Promise(
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
* Access Token 재발급
* 저장된 refresh token을 이용해 access token(jwt)를 재발급합니다.
*
* authRefreshPostRequest AuthRefreshPostRequest 
* returns AuthResponse
* */
const authRefreshPOST = ({ authRefreshPostRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        authRefreshPostRequest,
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
* 최초 로그인 사용자 정보 등록 (회원가입)
* - 구글 OAuth로 최초 로그인한 사용자가 학번, 연락처, 반 등 추가 정보를 제출하여 가입을 완료합니다. - 요청 성공 시 해당 사용자의 status는 'pending'(승인 대기)으로 변경됩니다. 
*
* userRegistrationRequest UserRegistrationRequest 
* returns User
* */
const authRegisterPOST = ({ userRegistrationRequest }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        userRegistrationRequest,
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
  authGoogleCallbackGET,
  authGoogleGET,
  authMeGET,
  authRefreshPOST,
  authRegisterPOST,
};
