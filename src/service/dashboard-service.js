/**
 * @file 대시보드 관련 서비스 로직
 * @description 대시보드에 표시될 다양한 정보를 통합하여 조회하는 비즈니스 로직을 처리합니다.
 */
import * as noticeService from "../service/notice-service.js";
import * as cleaningService from "./cleaning-service.js";
import * as timetableService from "../service/timetable-service.js";
import * as classroomService from "../service/classroom-service.js";
import { BadRequestError } from "../errors/index.js";
import {getEvents} from "../service/timetable-service.js";

/**
 * 대시보드에 필요한 모든 데이터를 통합하여 조회합니다.
 * 사용자의 역할과 대상 날짜를 기반으로 시간표, 공지사항, 청소 당번, 주말 개방 여부 등의 정보를 병렬로 가져옵니다.
 *
 * @param {object} user - 현재 로그인된 사용자 정보
 * @param {string} targetDate - 조회할 대상 날짜 (YYYY-MM-DD 형식)
 * @returns {Promise<object>} 대시보드에 표시될 통합 데이터 객체
 * @throws {BadRequestError} 필수 값이 누락된 경우
 */
export const getDashboardData = async (user, targetDate) => {
  if (!targetDate || !user) {
    throw new BadRequestError("필수 값이 누락");
  }
  const userId = user.user_id;

  // 1. 사용자 역할에 따라 적절한 시간표 조회
  let timetablePromise;

  if (user.role === "student") {
    timetablePromise = timetableService.getStudentTimetable({
      user_id: userId,
      targetDate,
    });
  } else if (user.role === "professor") {
    timetablePromise = timetableService.getProfessorTimetable({
      user_id: userId,
      targetDate,
    });
  } else {
    timetablePromise = timetableService.getAdminTimetable(targetDate);
  }

  let eventPromise = timetableService.getEvents();

  let hukaPromise;
  if (user.role === "professor" || user.role === "admin") {
    hukaPromise = timetableService.getHukaStudentTimetable(); // 상담 시간표
  }

  const spec = { user };
  const noticeQuery = { size: 10, sortBy: "createdAt:desc" };

  // 2. 모든 비동기 작업을 Promise.all로 병렬 처리
  const [scheduleData, hukaData, noticeData, cleaningData, reservationData] =
    await Promise.all([
      timetablePromise, // 정규 시간표
      hukaPromise,
      noticeService.getNotices(spec, noticeQuery), // 공지사항
      cleaningService.findRosterWeek(targetDate), // 청소 당번
      classroomService.getClassroomPolls({ date: targetDate, user_id: userId }), // 주말 개방 여부
    ]);
  console.log(cleaningData);

  // 3. 각 데이터를 올바른 키에 매핑하여 반환
  return {
    schedules: scheduleData,
    huka_schedules: hukaData,
    notices: noticeData,
    cleaning_duty: cleaningData.rosters,
    weekend_poll: reservationData,
  };
};
