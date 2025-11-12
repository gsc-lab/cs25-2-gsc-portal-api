/**
 * @file 청소 당번 관련 컨트롤러
 * @description 청소 당번표 생성, 조회, 삭제 등 청소 당번과 관련된 요청을 처리합니다.
 */
import * as cleaningService from "../service/cleaning-service.js";

/**
 * 새로운 청소 당번표를 생성합니다.
 * 요청 본문(body)에서 당번표 생성에 필요한 정보를 받아 서비스를 통해 처리합니다.
 *
 * @param {object} req - Express 요청 객체 (req.body에 당번표 정보 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
export const generateCleaningRosters = async (req, res, next) => {
  try {
    const rosterInfo = req.body;

    const result = await cleaningService.generateRosters(rosterInfo);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error in generateCleaningRosters controller:", error);
    next(error);
  }
};

/**
 * 특정 날짜가 포함된 주의 청소 당번표를 조회합니다.
 * 쿼리 파라미터로 날짜와 학년 ID를 받아 해당 주의 당번표를 반환합니다.
 *
 * @param {object} req - Express 요청 객체 (req.query에 date, grade_id 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
export const getCleaningRosters = async (req, res, next) => {
  try {
    const date = req.query.date || new Date();
    let grade_id = req.query.grade_id;

    const rosterData = await cleaningService.findRosterWeek(date, grade_id);
    res.status(200).json(rosterData);
  } catch (error) {
    next(error);
  }
};

/**
 * 월간 청소 당번표를 조회합니다.
 * 현재 달의 청소 당번표 데이터를 반환합니다.
 *
 * @param {object} req - Express 요청 객체
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
export const getMonthlyRoster = async (req, res, next) => {
  try {
    const data = await cleaningService.findRosterMonth();
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
/**
 * 학년별 청소 당번표를 삭제합니다.
 * 쿼리 파라미터로 학기와 학년 ID를 받아 해당 당번표를 삭제합니다.
 *
 * @param {object} req - Express 요청 객체 (req.query에 section, grade_id 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
export const deleteRosterByGrade = async (req, res, next) => {
  try {
    const { section, grade_id } = req.query;

    if (!section) {
      return res.status(400).json({ message: "학기는 필수 파라미터입니다." });
    }

    const result = await cleaningService.removeRosters(section, grade_id);

    res.status(200).json({ result, message: "성곡적으로 삭제되었습니다." });
  } catch (error) {
    next(error);
  }
};
