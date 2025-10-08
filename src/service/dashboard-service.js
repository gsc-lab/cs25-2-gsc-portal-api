import * as noticeService from "../service/notice-service.js";
import * as cleaningService from "../service/cleaning_service.js";

export const getDashboardData = async (user) => {
  const spec = { user };
  const noticeQuery = { size: 5, sortBy: "createdAt:desc" };

  const [noticeData, cleaningData, scheduleData, reservationData] =
    await Promise.all([
      // 실제 구현된 서비스 호출
      noticeService.getNotices(spec, noticeQuery),
      cleaningService.findRosterWeek(new Date()),
      Promise.resolve([
        {
          course_title: "시간표 기능 개발",
          classroom_name: "미정",
          start_time: "00:00",
          end_time: "00:00",
        },
      ]),
      Promise.resolve([
        { classroom_name: "강의실 기능 개발 중", is_available: false },
      ]),
    ]);

  return {
    schedules: scheduleData,
    notices: noticeData,
    cleaning_duty: cleaningData.rosters,
    weekend_poll: reservationData,
  };
};
