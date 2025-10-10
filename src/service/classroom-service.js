import * as classroomModels from '../models/Classroom.js'

export const getClassrooms = async function () {
    return await classroomModels.getClassrooms();
}

export const postClassrooms = async function (building, room_number, room_type) {
    return await classroomModels.postClassrooms(building, room_number, room_type);
}

export const putClassrooms = async function (id, building, room_number, room_type) {
    return await classroomModels.putClassrooms(id, building, room_number, room_type);
}

export const deleteClassrooms = async function (id) {
    return await classroomModels.deleteClassrooms(id);
}

export const getClassroomsReservations = async function(id, date) {
    return await classroomModels.getClassroomsReservations(id, date);
}

export const postClassroomReservations = async function(id, user_id, reserve_date, start_time, end_time) {
    return await classroomModels.postClassroomReservations(id, user_id, reserve_date, start_time, end_time);
}

export const deleteClassroomReservation = async function (id, reservation_id) {
    return await classroomModels.deleteClassroomReservation(id, reservation_id);
}

export const getClassroomPolls = async function (date, user_id) {
    return await classroomModels.getClassroomPolls(date, user_id);
}

export const postClassroomPolls = async function (grade_id, classroom_id, poll_date, target_weekend, required_count) {
    return await classroomModels.postClassroomPolls(grade_id, classroom_id, poll_date, target_weekend, required_count);
}

export const addVote = async function (user_id, poll_id) {
    return await classroomModels.addVote(user_id, poll_id);
}

export const removeVote = async function (user_id, poll_id) {
    return await classroomModels.removeVote(user_id, poll_id);
}