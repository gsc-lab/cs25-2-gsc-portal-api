import * as classroomModels from '../models/Classroom.js'
import { BadRequestError, InternalServerError } from "../errors/index.js"

export const getClassrooms = async function () {
    return await classroomModels.getClassrooms();
}

export const postClassrooms = async function ({building, room_number, room_type}) {
    if (!building || !room_number || !room_type) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    // ID 생성
    const classroom_id = await classroomModels.createClassroomId();
    
    return await classroomModels.postClassrooms(classroom_id, building, room_number, room_type);
}

export const putClassrooms = async function ({id, building, room_number, room_type}) {
    if (!id || !building || !room_number || !room_type) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    
    return await classroomModels.putClassrooms(id, building, room_number, room_type);
}

export const deleteClassrooms = async function (id) {
    if(!id) { 
        throw new BadRequestError("필수 값이 누락 되었습니다.")
    }
    
    return await classroomModels.deleteClassrooms(id);
}

export const getClassroomsReservations = async function({id, date}) {
    if (!id || !date) {
        throw new BadRequestError("필수 값이 누락 되었습니다.")
    }
    
    return await classroomModels.getClassroomsReservations(id, date);
}

export const postClassroomReservations = async function({id, user_id, reserve_date, start_time, end_time}) {
    if (!id || !user_id || !reserve_date || !start_time || !end_time) {
        throw new BadRequestError("필수 값이 누락 되었습니다.")
    }
    
    return await classroomModels.postClassroomReservations(id, user_id, reserve_date, start_time, end_time);
}

export const deleteClassroomReservation = async function ({id, reservation_id}) {
    if (!id || !reservation_id) {
        throw new BadRequestError("필수 값이 누락 되었습니다.")
    }
    
    return await classroomModels.deleteClassroomReservation(id, reservation_id);
}

export const getClassroomPolls = async function ({date, user_id}) {
    if (!date || !user_id) {
        throw new BadRequestError("필수 값이 누락 되었습니다.")
    }
    
    return await classroomModels.getClassroomPolls(date, user_id);
}

// (수정) Service: '반복 규칙'을 생성하는 함수
export const postClassroomPolls = async function ({ grade_id, required_count }) {
    
    // 1. 유효성 검사
    if (!grade_id || !required_count) {
        throw new BadRequestError("학년과 최소 인원은 필수입니다.");
    }
    
    // 2. (신규) Service에서 '오늘 날짜'를 생성
    const start_date = getTodayDate(); 

    // 3. (수정) '규칙 ID' ('r001') 생성
    const rule_id = await classroomModels.createPollRuleId(); 

    // 4. '규칙' 테이블에 저장할 데이터 객체
    const newRuleData = {
        rule_id,
        grade_id,
        start_date, // <- 여기서 생성한 오늘 날짜
        required_count
    };

    // 5. '규칙'을 DB에 저장 (Model의 postPollRule 함수 호출)
    return await classroomModels.postPollRule(newRuleData); 
}

// 규칙 목록 조회
export const getPollRules = async function() {
    return await classroomModels.getPollRules();
}

// 규칙 목록 삭제
export const deletePollRules = async function(rule_id) {
    if (!rule_id) {
        throw new BadRequestError("rule_id가 누락 되었습니다.");
    }

    return await classroomModels.deletePollRules(rule_id);
}

// 투표 저장 Post
export const postReservationPolls = async function ({user_id, poll_id, action}) {
    if (!user_id || !poll_id || !action) {
        throw new BadRequestError("필수 값이 누락 되었습니다.")
    }
    let result;
    if (action === "apply") result = await classroomModels.addVote(user_id, poll_id);
    else if (action === "cancel") result = await classroomModels.removeVote(user_id, poll_id);
    else throw new BadRequestError("action 안에는 apply 또는 cancel값만 올 수 있습니다.");
    
    return result
}


// 오늘 날짜 생성 함수
function getTodayDate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`; // 예: "2025-11-18"
}
