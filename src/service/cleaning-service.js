import * as CleaningModel from "../models/Cleaning.js";
import pool from "../db/connection.js";
import { InternalServerError, BadRequestError } from "../errors/index.js";

export const generateRosters = async (rosterInfo) => {
  // 요청 Body에서 필요한 정보들을 구조 분해 할당으로 추출
  const { section, weekday, team_size, grade_rooms } = rosterInfo;

  // 해당 학기의 시작일과 종료일을 조회
  const sectionInfo = await CleaningModel.findBySection(section);
  if (!sectionInfo || !sectionInfo.start_date || !sectionInfo.end_date) {
    throw new BadRequestError(`유효하지 않은 학기 ID입니다: ${section}`);
  }

  const week_start = sectionInfo.start_date;
  const week_end = sectionInfo.end_date;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // API 최종 응답으로 보낼 객체 초기화
    const results = {
      section,
      generated: {},
      skipped_existing: 0,
      conflicts: [],
    };

    // 학기 기간과 청소 요일을 바탕으로 실제 청소 날짜 목록을 미리 계산하는 헬퍼 함수
    const getDates = (startDate, endDate, dayOfWeek) => {
      const dates = [];
      let currentDate = new Date(startDate);
      const stopDate = new Date(endDate);
      const dayMap = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
      const targetDay = dayMap[dayOfWeek.toUpperCase()];

      let day = currentDate.getDay();
      let diff = (targetDay - day + 7) % 7; // (목표 - 시작일 + 7) % 7
      currentDate.setDate(currentDate.getDate() + diff);
      while (currentDate <= stopDate) {
        dates.push(new Date(currentDate)); // 유효한 청소 요일 저장
        currentDate.setDate(currentDate.getDate() + 7); // 7일 뒤로 이동
      }
      return dates;
    };

    const cleaningDates = getDates(week_start, week_end, weekday);

    // 요청받은 각 학년/반 그룹을 순서대로 처리
    for (const { grade_id, classroom_id } of grade_rooms) {
      // 현재 재학생 목록 전체를 가져오기
      const students = await CleaningModel.findStudentByGrade(grade_id);

      if (!students || students.length === 0) {
        console.warn(`${grade_id}학년이 없어 건너뜀`);
        continue;
      }

      // 공정한 배정을 위해 학생 목록을 무작위로 섞음
      const studentIds = students
          .map((s) => s.user_id)
          .sort(() => 0.5 - Math.random());
      let studentIdx = 0; // 순환 배정을 위한 인덱스

      // 결과 객체에 현재 학년에 대한 생성 정보 초기화
      results.generated[grade_id] = {
        weeks: cleaningDates.length,
        teams: 0,
        members_assigned: 0,
      };

      // 각 청소 날짜 순회하며 팀을 배정
      for (const work_date of cleaningDates) {
        const memberIds = [];
        // 한 팀을 구성 (섞인 학생 목록에서 team_size만큼 순서대로 뽑음)
        for (let i = 0; i < team_size; i++) {
          // % (나머지 연산자)를 이용해 학생 목록의 끝에 도달하면 다시 처음으로 돌아감
          memberIds.push(studentIds[(studentIdx + i) % studentIds.length]);
        }
        // 다음 주 배정을 위해 인덱스 team_size만큼 이동시킴
        studentIdx = (studentIdx + team_size) % studentIds.length;

        // assignment 객체 생성
        const assignment = {
          classroom_id,
          grade_id,
          sec_id: section,
          work_date: work_date.toISOString().slice(0, 10),
          team_size,
          memberIds,
        };

        await CleaningModel.createCleaningRoaster(assignment, connection);

        // 최종 결과 객체에 생성 정보를 누적
        results.generated[grade_id].teams += 1;
        results.generated[grade_id].members_assigned += memberIds.length;
      }
    }
    await connection.commit();

    return results;
  } catch (error) {
    await connection.rollback();

    console.log("당번 생성 중 오류", error);
    throw new InternalServerError('서버 오류가 발생했습니다.');
  }
};

// 특정 날짜가 포함된 주의 청소 당번 목록 조회
export const findRosterWeek = async (date, gradeId = null) => {
  if (!date) {
    throw new BadRequestError("유효하지 않은 값입니다.");
  }

  const targetDate = new Date(date);

  // 입력된 날짜를 기준으로, 해당 주가 시작되는 날짜(일요일)과 끝나는 날짜(토요일) 계산
  const dayOfWeek = targetDate.getDay(); // 0 ~ 6
  const firstDayOfWeek = new Date(targetDate);
  firstDayOfWeek.setDate(targetDate.getDate() - dayOfWeek);
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

  const startDate = firstDayOfWeek.toISOString().split("T")[0];
  const endDate = lastDayOfWeek.toISOString().split("T")[0];

  // 계산된 시작일/종료일과 학년을 이용해 데이터 조회
  const flatRosters = await CleaningModel.getCleaningRosterView(
      startDate,
      endDate,
      gradeId,
  );
  if (!flatRosters.length) {
    return { section: null, rosters: [], work_date: null };
  }

  // 데이터 목록을 Map 함수 이용해 계층적인 구조로 그룹화
  const groupByClassroom = (list) => {
    const map = new Map();
    for (const { grade_id, classroom_name, member_name } of list) {
      const key = `${grade_id}|${classroom_name}`;
      if (!map.has(key)) {
        map.set(key, { grade_id, classroom_name, members: new Set() });
      }
      map.get(key).members.add(member_name);
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      members: [...g.members],
    }));
  };

  // 그룹화된 객체(groupedByClassroom)를 명세에 맞는 형태로 반환
  const rosters = groupByClassroom(flatRosters);

  // 최종 결과 객체를 컨트롤러에 반환
  return {
    section: flatRosters[0].section,
    work_date: flatRosters[0].work_date,
    rosters: rosters,
  };
};

// 월간 당번 조회 API
export const findRosterMonth = async (gradeId = null) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0 ~ 11

  // 이번 달의 1일과 마지막 날짜 계산
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = firstDay.toISOString().split("T")[0];
  const endDate = lastDay.toISOString().split("T")[0];

  // DB 조회
  const flatRosters = await CleaningModel.getCleaningRosterView(startDate, endDate, gradeId);
  if (!flatRosters.length) {
    return { section: null, rosters: [], month: `${year}-${month + 1}` };
  }
  const dates = [...new Set(flatRosters.map(r => r.work_date))];

  const days = dates.map(date => {
    const dailyList = flatRosters.filter(r => r.work_date === date);

    // 교실 기준으로 묶기
    const classMap = {};
    for (const row of dailyList) {
      const key = `${row.grade_id}|${row.classroom_name}`;
      if (!classMap[key]) {
        classMap[key] = {
          grade_id: row.grade_id,
          classroom_name: row.classroom_name,
          members: []
        };
      }
      if (!classMap[key].members.includes(row.member_name)) {
        classMap[key].members.push(row.member_name);
      }
    }

    return {work_date: date, rosters: Object.values(classMap)};
  });

  return {
    section: flatRosters[0].section,
    month: `${year}-${String(month + 1).padStart(2, '0')}`,
    days
  }
};

export const removeRosters = async (section, gradeId) => {

  if (!gradeId && !section) {
    throw new BadRequestError(`삭제할 학년(grade_id) 반드시 지정해야 합니다.`);
  }
  const deletedCount = await CleaningModel.deleteRosters(section, gradeId);
  if (deletedCount === 0) {
    console.warn(
        `삭제할 청소 당번이 없습니다. 학기${section}, 학년:${gradeId}`,
    );
  }
  return { deletedCount };
};
