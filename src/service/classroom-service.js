import * as classroomModels from "../models/Classroom.js";
import { BadRequestError } from "../errors/index.js";
import { requireFields } from "../utils/validation.js";

// 강의실 목록
export const getClassrooms = async () => {
    return await classroomModels.getClassrooms();
};

// 강의실 생성
export const postClassrooms = async ({ building, room_number, room_type }) => {
    requireFields(
        { building, room_number, room_type },
        ["building", "room_number", "room_type"]
    );

    const classroom_id = await classroomModels.createClassroomId();
    return await classroomModels.postClassrooms(
        classroom_id,
        building,
        room_number,
        room_type
    );
};

// 강의실 수정
export const putClassrooms = async ({ id, building, room_number, room_type }) => {
    requireFields(
        { id, building, room_number, room_type },
        ["id", "building", "room_number", "room_type"]
    );

    return await classroomModels.putClassrooms(id, building, room_number, room_type);
};

// 강의실 삭제
export const deleteClassrooms = async (id) => {
    requireFields({ id }, ["id"]);

    return await classroomModels.deleteClassrooms(id);
    };

    // 특정 강의실 예약 목록
    export const getClassroomsReservations = async ({ id, date }) => {
    requireFields({ id, date }, ["id", "date"]);

    return await classroomModels.getClassroomsReservations(id, date);
};

// 강의실 예약 생성
export const postClassroomReservations = async ({
    id,
    user_id,
    reserve_date,
    start_time,
    end_time,
    }) => {
    requireFields(
        { id, user_id, reserve_date, start_time, end_time },
        ["id", "user_id", "reserve_date", "start_time", "end_time"]
    );

    return await classroomModels.postClassroomReservations(
        id,
        user_id,
        reserve_date,
        start_time,
        end_time
    );
};

// 예약 삭제
export const deleteClassroomReservation = async ({ id, reservation_id }) => {
    requireFields({ id, reservation_id }, ["id", "reservation_id"]);

    return await classroomModels.deleteClassroomReservation(id, reservation_id);
};

// 강의실 개방 투표 현황
export const getClassroomPolls = async ({ date, user_id }) => {
    requireFields({ date, user_id }, ["date", "user_id"]);

    return await classroomModels.getClassroomPolls(date, user_id);
};

// 투표 규칙 생성
export const postClassroomPolls = async ({ grade_id, required_count }) => {
    requireFields({ grade_id, required_count }, ["grade_id", "required_count"]);

    // 도메인 검증: 최소 인원은 1 이상
    if (required_count <= 0) {
        throw new BadRequestError("required_count는 1 이상이어야 합니다.");
    }

    const start_date = getTodayDate();
    const rule_id = await classroomModels.createPollRuleId();

    const newRuleData = {
        rule_id,
        grade_id,
        start_date,
        required_count,
    };

    return await classroomModels.postPollRule(newRuleData);
};

// 투표 규칙 목록 조회
export const getPollRules = async () => {
    return await classroomModels.getPollRules();
};

// 투표 규칙 수정
export const putPollRules = async ({ rule_id, required_count }) => {
    requireFields({ rule_id, required_count }, ["rule_id", "required_count"]);

    if (required_count <= 0) {
        throw new BadRequestError("required_count는 1 이상이어야 합니다.");
    }

    const start_date = getTodayDate();
    return await classroomModels.putPollRules(rule_id, required_count, start_date);
};

// 투표 규칙 삭제
export const deletePollRules = async (rule_id) => {
    requireFields({ rule_id }, ["rule_id"]);

    return await classroomModels.deletePollRules(rule_id);
};

// 투표하기
export const postReservationPolls = async ({ user_id, poll_id, action }) => {
    requireFields({ user_id, poll_id, action }, ["user_id", "poll_id", "action"]);

    let result;
    if (action === "apply") {
        result = await classroomModels.addVote(user_id, poll_id);
    } else if (action === "cancel") {
        result = await classroomModels.removeVote(user_id, poll_id);
    } else {
        throw new BadRequestError("action 값은 apply 또는 cancel만 가능합니다.");
    }

    return result;
};

// 오늘 날짜 (YYYY-MM-DD)
function getTodayDate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = ("0" + (d.getMonth() + 1)).slice(-2);
    const day = ("0" + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}
