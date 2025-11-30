import * as timetableModel from "../models/Timetable.js";
import {
  BadRequestError,
  NotFoundError,
  // ForbiddenError,
} from "../errors/index.js";

import { requireFields } from "../utils/validation.js";
import { getWeekRange } from "../utils/timetableDateCalculator.js";

// ========================
// 시간표 조회 (학생, 교수, 관리자)
// ========================

export const getStudentTimetable = async ({ user_id, targetDate }) => {
  requireFields({ user_id, targetDate }, ["user_id", "targetDate"]);

  const { weekStart, weekEnd } = getWeekRange(targetDate);
  return await timetableModel.getStudentTimetable(
    user_id,
    targetDate,
    weekStart,
    weekEnd
  );
};

export const getProfessorTimetable = async ({ user_id, targetDate }) => {
  requireFields({ user_id, targetDate }, ["user_id", "targetDate"]);

  const { weekStart, weekEnd } = getWeekRange(targetDate);
  return await timetableModel.getProfessorTimetable(
    user_id,
    targetDate,
    weekStart,
    weekEnd
  );
};

export const getAdminTimetable = async (targetDate) => {
  requireFields({ targetDate }, ["targetDate"]);

  const { weekStart, weekEnd } = getWeekRange(targetDate);
  return await timetableModel.getAdminTimetable(targetDate, weekStart, weekEnd);
};

// ========================
// 강의 등록 / 수정 / 삭제
// ========================

export const postRegisterCourse = async (payload) => {
  // 필수 값 검증
  requireFields(payload, ["sec_id", "title", "professor_id", "target"]);

  const { sec_id, title, professor_id, target, class_id, class_name } = payload;

  let db_is_special = 0;
  let db_grade_id = null;
  let db_language_id = null;

  if (["1", "2", "3"].includes(target)) {
    db_grade_id = Number(target);
  } else if (target === "korean") {
    db_is_special = 2;
    db_language_id = "KR";
  } else if (target === "special") {
    db_is_special = 1;
    db_language_id = "JP";
  } else {
    throw new BadRequestError("유효하지 않은 target 값입니다.");
  }

  const result = await timetableModel.postRegisterCourse(
    sec_id,
    title,
    professor_id,
    db_is_special,
    db_grade_id,
    db_language_id,
    class_id,
    class_name
  );

  return result;
};

export const putRegisterCourse = async (payload) => {
  requireFields(payload, [
    "course_id",
    "sec_id",
    "title",
    "professor_id",
    "target",
  ]);

  const { course_id, sec_id, title, professor_id, target, class_id } = payload;

  let db_is_special = 0;
  let db_grade_id = null;
  let db_language_id = null;

  if (["1", "2", "3"].includes(target)) {
    db_grade_id = Number(target);
  } else if (target === "korean") {
    db_is_special = 2;
    db_language_id = "KR";
  } else if (target === "special") {
    db_is_special = 1;
    db_language_id = "JP";
  } else {
    throw new BadRequestError("유효하지 않은 target 값입니다.");
  }

  const affected = await timetableModel.putRegisterCourse(
    course_id,
    sec_id,
    title,
    professor_id,
    db_is_special,
    db_grade_id,
    db_language_id,
    class_id
  );

  // 모델에서 "수정된 행 수"를 반환한다고 가정
  if (!affected) {
    throw new NotFoundError("수정할 강의를 찾을 수 없습니다.");
  }

  return { updated: affected };
};

export const deleteRegisterCourse = async ({ course_id }) => {
  requireFields({ course_id }, ["course_id"]);

  const affected = await timetableModel.deleteRegisterCourse(course_id);

  if (!affected) {
    throw new NotFoundError("삭제할 강의를 찾을 수 없습니다.");
  }

  return { deleted: affected };
};

// ========================
// 시간표 등록 / 수정 / 삭제
// ========================

export const postRegisterTimetable = async (payload) => {
  const { classroom_id, course_id, day_of_week, start_period, end_period } =
    payload;

  // id / 문자열 필드
  requireFields(payload, ["classroom_id", "course_id", "day_of_week"]);

  // 숫자는 0도 들어올 수 있으니 null / undefined만 체크
  if (start_period == null || end_period == null) {
    throw new BadRequestError(
      "start_period, end_period 값이 누락 되었습니다."
    );
  }

  if (start_period > end_period) {
    throw new BadRequestError(
      "시작 교시(start_period)는 종료 교시(end_period)보다 클 수 없습니다."
    );
  }

  return await timetableModel.registerTimetable(
    classroom_id,
    course_id,
    day_of_week,
    start_period,
    end_period
  );
};

export const putRegisterTimetable = async (payload) => {
  const { schedule_ids, classroom_id, start_period, end_period, day_of_week } =
    payload;

  requireFields(payload, ["schedule_ids", "classroom_id", "day_of_week"]);

  if (start_period == null || end_period == null) {
    throw new BadRequestError(
      "start_period, end_period 값이 누락 되었습니다."
    );
  }

  if (start_period > end_period) {
    throw new BadRequestError(
      "시작 교시(start_period)는 종료 교시(end_period)보다 클 수 없습니다."
    );
  }

  const affected = await timetableModel.putRegisterTimetable(
    schedule_ids,
    classroom_id,
    start_period,
    end_period,
    day_of_week
  );

  if (!affected) {
    throw new NotFoundError("수정할 시간표를 찾을 수 없습니다.");
  }

  return { updated: affected };
};

export const deleteRegisterTimetable = async ({ schedule_ids }) => {
  requireFields({ schedule_ids }, ["schedule_ids"]);

  const affected = await timetableModel.deleteRegisterTimetable(schedule_ids);

  if (!affected) {
    throw new NotFoundError("삭제할 시간표를 찾을 수 없습니다.");
  }

  return { deleted: affected };
};

// ========================
// 휴보강 등록 / 수정 / 삭제
// ========================

export const postRegisterHoliday = async (payload) => {
  const {
    event_type,
    event_date,
    start_period,
    end_period,
    course_id,
    cancel_event_ids,
    classroom,
  } = payload;

  // 공통 필드
  requireFields(payload, ["event_type", "event_date"]);

  if (!["CANCEL", "MAKEUP"].includes(event_type)) {
    throw new BadRequestError("CANCEL 또는 MAKEUP 값만 허용됩니다.");
  }

  if (event_type === "CANCEL") {
    if (course_id == null || start_period == null || end_period == null) {
      throw new BadRequestError(
        "휴강 등록 시 course_id, start_period, end_period 값이 필요합니다."
      );
    }
  }

  if (event_type === "MAKEUP") {
    if (!Array.isArray(cancel_event_ids) || cancel_event_ids.length === 0) {
      throw new BadRequestError(
        "보강 등록 시 cancel_event_ids 배열이 필요합니다."
      );
    }
    if (!classroom) {
      throw new BadRequestError("보강 등록 시 classroom 값이 필요합니다.");
    }
  }

  return await timetableModel.postRegisterHoliday(
    event_type,
    event_date,
    start_period,
    end_period,
    course_id,
    cancel_event_ids || [],
    classroom || null
  );
};

export const putRegisterHoliday = async (payload) => {
  const {
    event_id,
    event_type,
    event_date,
    start_period,
    end_period,
    course_id,
    cancel_event_ids,
    classroom,
  } = payload;

  requireFields(payload, ["event_id", "event_type", "event_date"]);

  if (!["CANCEL", "MAKEUP"].includes(event_type)) {
    throw new BadRequestError("CANCEL 또는 MAKEUP 값만 허용됩니다.");
  }

  if (event_type === "CANCEL") {
    if (course_id == null || start_period == null || end_period == null) {
      throw new BadRequestError(
        "휴강 수정 시 course_id, start_period, end_period 값이 필요합니다."
      );
    }
  }

  if (event_type === "MAKEUP") {
    if (!Array.isArray(cancel_event_ids) || cancel_event_ids.length === 0) {
      throw new BadRequestError(
        "보강 수정 시 cancel_event_ids 배열이 필요합니다."
      );
    }
    if (!classroom) {
      throw new BadRequestError("보강 수정 시 classroom 값이 필요합니다.");
    }
  }

  const affected = await timetableModel.putRegisterHoliday(
    event_id,
    event_type,
    event_date,
    start_period,
    end_period,
    course_id,
    cancel_event_ids || [],
    classroom || null
  );

  if (!affected) {
    throw new NotFoundError("수정할 휴보강 이벤트를 찾을 수 없습니다.");
  }

  return { updated: affected };
};

export const deleteRegisterHoliday = async (event_id) => {
  requireFields({ event_id }, ["event_id"]);

  const affected = await timetableModel.deleteRegisterHoliday(event_id);

  if (!affected) {
    throw new NotFoundError("삭제할 휴보강 이벤트를 찾을 수 없습니다.");
  }

  return { deleted: affected };
};

// ========================
// 분반 등록 / 수정 / 삭제
// ========================

export const postAssignStudents = async ({ class_id, student_ids }) => {
  requireFields({ class_id, student_ids }, ["class_id", "student_ids"]);

  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    throw new BadRequestError(
      "student_ids는 1개 이상을 포함하는 배열이어야 합니다."
    );
  }

  const affected = await timetableModel.postAssignStudents(
    class_id,
    student_ids
  );

  return { assigned: affected };
};

export const putAssignStudents = async ({ class_id, student_ids }) => {
  requireFields({ class_id, student_ids }, ["class_id", "student_ids"]);

  if (!Array.isArray(student_ids)) {
    throw new BadRequestError("student_ids는 배열이어야 합니다.");
  }

  const affected = await timetableModel.putAssignStudents(
    class_id,
    student_ids
  );

  if (!affected) {
    throw new NotFoundError("수정할 분반 정보를 찾을 수 없습니다.");
  }

  return { updated: affected };
};

export const deleteAssignStudents = async (class_id) => {
  requireFields({ class_id }, ["class_id"]);

  const affected = await timetableModel.deleteAssignStudents(class_id);

  if (!affected) {
    throw new NotFoundError("삭제할 분반 정보를 찾을 수 없습니다.");
  }

  return { deleted: affected };
};

// ========================
// 휴보강 이력
// ========================

export const getEvents = async () => {
  return await timetableModel.getEvents();
};

// ========================
// 학년/날짜별 수업 교시 조회
// ========================

const ALL_PERIODS = Array.from({ length: 11 }, (_, i) => i + 1); 
// [1,2,3,...,11]

export const getGradeDate = async (grade, date) => {
  requireFields({ grade, date }, ["grade", "date"]);

  const gradeNumber = Number(grade);
  if (!Number.isInteger(gradeNumber) || gradeNumber <= 0) {
    throw new BadRequestError("grade 값이 올바르지 않습니다.");
  }

  const gradeName = `${gradeNumber}학년`;
  const dayCode = toDayCode(date);

  // 주말이면 빈 배열
  if (!dayCode) return [];

  // 1) 이 날, 이 학년의 실제 수업 교시들 가져오기
  const classPeriods = await timetableModel.getGradePeriodsByDate(
    gradeName,
    date,
    dayCode
  ); 

  // 2) 수업 있는 교시만 추출
  const usedPeriods = classPeriods.map((row) => Number(row.period));
  // 예: [3, 5]

  // 3) 전체 교시 중에서 수업 *없는* 교시만 남기기
  const freePeriods = ALL_PERIODS.filter(
    (p) => !usedPeriods.includes(p)
  );
  // 예: [1,2,4,6,7,...,11]

  // 4) 문자열로 변환해서 반환 (기존과 동일 형태 유지)
  return freePeriods.map(String);
};


function toDayCode(dateString) {
  const d = new Date(dateString + "T00:00:00");
  const jsDay = d.getDay(); // 0: Sun, 1: Mon, 2: Tue ...

  const map = {
    1: "MON",
    2: "TUE",
    3: "WED",
    4: "THU",
    5: "FRI",
  };

  return map[jsDay] ?? null;
}

// ========================
// 후까 교수님 상담 관련
// ========================

export const getHukaStudentTimetable = async (sec_id) => {
  requireFields({ sec_id }, ["sec_id"]);

  return await timetableModel.getHukaStudentTimetable(sec_id);
};

export const postHukaStudentTimetable = async (payload) => {
  const {
    student_ids,
    professor_id,
    sec_id,
    day_of_week,
    start_slot,
    end_slot,
    location,
  } = payload;

  requireFields(payload, [
    "student_ids",
    "professor_id",
    "sec_id",
    "day_of_week",
    "start_slot",
    "end_slot",
    "location",
  ]);

  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    throw new BadRequestError(
      "student_ids는 1개 이상을 포함하는 배열이어야 합니다."
    );
  }

  if (start_slot > end_slot) {
    throw new BadRequestError(
      "시작 교시(start_slot)는 종료 교시(end_slot)보다 클 수 없습니다."
    );
  }

  return await timetableModel.postHukaStudentTimetable(
    student_ids,
    professor_id,
    sec_id,
    day_of_week,
    start_slot,
    end_slot,
    location
  );
};

export const postHukaCustomSchedule = async (payload) => {
  const { student_ids, professor_id, date, start_slot, end_slot, location } =
    payload;

  requireFields(payload, [
    "student_ids",
    "professor_id",
    "date",
    "start_slot",
    "end_slot",
    "location",
  ]);

  if (!Array.isArray(student_ids) || student_ids.length === 0) {
    throw new BadRequestError(
      "student_ids는 1개 이상을 포함하는 배열이어야 합니다."
    );
  }

  if (start_slot > end_slot) {
    throw new BadRequestError(
      "시작 교시(start_slot)는 종료 교시(end_slot)보다 클 수 없습니다."
    );
  }

  // sec_id 조회
  const sec_id = await timetableModel.findSecIdByDate(date);
  if (!sec_id) {
    throw new BadRequestError("해당 날짜에 유효한 학기가 존재하지 않습니다.");
  }

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const day_of_week = days[new Date(date).getDay()];

  return await timetableModel.postHukaCustomSchedule(
    student_ids,
    professor_id,
    sec_id,
    date,
    start_slot,
    end_slot,
    location,
    day_of_week
  );
};
