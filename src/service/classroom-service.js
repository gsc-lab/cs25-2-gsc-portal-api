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