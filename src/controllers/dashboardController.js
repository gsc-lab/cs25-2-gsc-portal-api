/**
 * @file 대시보드 관련 컨트롤러
 * @description 대시보드에 표시될 다양한 정보를 조회하는 요청을 처리합니다.
 */
import * as dashboardService from "../service/dashboard-service.js";

/**
 * 대시보드에 필요한 데이터를 조회합니다.
 * 로그인한 사용자 정보와 대상 날짜를 기반으로 시간표, 공지사항, 청소 당번 등의 정보를 반환합니다.
 *
 * @param {object} req - Express 요청 객체 (req.user, req.query.date 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
export async function getDashboardData(req, res, next) {
  try {
    const user = req.user;
    const targetDate = req.query.date;

    const dashboardData = await dashboardService.getDashboardData(
      user,
      targetDate,
    );
    res.status(200).json(dashboardData);
  } catch (error) {
    next(error);
  }
}
