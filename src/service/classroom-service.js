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

export const postClassroomPolls = async function ({grade_id, classroom_id, poll_date, target_weekend, required_count}) {
    if (!grade_id || !classroom_id || !poll_date || !target_weekend || !required_count) {
        throw new BadRequestError("필수 값이 누락 되었습니다.")
    }
    // ID 생성
    const poll_id = await classroomModels.createClassroomPollsId();
    
    return await classroomModels.postClassroomPolls(poll_id, grade_id, classroom_id, poll_date, target_weekend, required_count);
}

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
