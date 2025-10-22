import * as noticeService from "../service/notice-service.js";
import * as cleaningService from "../service/cleaning_service.js";
import * as timetableService from "../service/timetable-service.js";
import * as classroomService from "../service/classroom-service.js";
import { BadRequestError } from "../errors/index.js";

export const getDashboardData = async (user, targetDate) => {
  if (!targetDate || !user) {
    throw new BadRequestError("필수 값이 누락");
  }

  // 1. 사용자 역할에 따라 적절한 시간표 조회
  let timetablePromise;
  if (user.role === "student") {
    timetablePromise = timetableService.getStudentTimetable({
      user,
      targetDate,
    });
  } else if (user.role === "professor") {
    timetablePromise = timetableService.getProfessorTimetable({
      user,
      targetDate,
    });
  } else {
    timetablePromise = timetableService.getAdminTimetable(targetDate);
  }

  const spec = { user };
  const noticeQuery = { size: 5, sortBy: "createdAt:desc" };

  // 2. 모든 비동기 작업을 Promise.all로 병렬 처리
  const [scheduleData, hukaData, noticeData, cleaningData, reservationData] =
    await Promise.all([
      timetablePromise, // 정규 시간표
      timetableService.getHukaStudentTimetable(user, targetDate), // 상담 시간표
      noticeService.getNotices(spec, noticeQuery), // 공지사항
      cleaningService.findRosterWeek(targetDate), // 청소 당번
      classroomService.getClassroomPolls({ date: targetDate, user_id: user }), // 주말 개방 여부
    ]);

  // 3. 각 데이터를 올바른 키에 매핑하여 반환
  return {
    schedules: scheduleData,
    huka_schedules: hukaData,
    notices: noticeData,
    cleaning_duty: cleaningData.rosters,
    weekend_poll: reservationData,
  };
};
