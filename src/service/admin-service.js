import * as UserModel from "../models/Admin.js"

// 승인
export const getPendingUsers = async function() {
    return await UserModel.getPendingUsers();
}

export const postPendingUsers = async function(user_id, action) {
    return await UserModel.postPendingUsers(user_id, action);
}

export const deletePendingUsers = async function(user_id) {
    return await UserModel.deletePendingUsers(user_id);
}

// 예외 이메일
export const getAllowedEmail = async function() {
    return await UserModel.getAllowedEmail();
}

export const postAllowedEmail = async function(email, reason) {
    return await UserModel.postAllowedEmail(email, reason);
}

export const deleteAllowedEmail = async function(id) {
    return await UserModel.deleteAllowedEmail(id);
}

// 학생 정보
export const getStudentInfo = async function(grade_name, status) {
    return await UserModel.getStudentInfo(grade_name, status);
}

export const patchStudentInfo = async (user_id, updates) => {
    const userFields = ["name", "email", "phone"];
    const studentFields = ["grade_id", "class_id", "language_id", "status", "level_id", "is_international"];

    const userUpdates = {};
    const studentUpdates = {};

    for (const key of Object.keys(updates)) {
        if (userFields.includes(key)) userUpdates[key] = updates[key];
        if (studentFields.includes(key)) studentUpdates[key] = updates[key];
    }

    const results = {};

    if (Object.keys(userUpdates).length > 0) {
        results.user_account = await UserModel.updateUserAccount(user_id, userUpdates);
    }

    if (Object.keys(studentUpdates).length > 0) {
        results.student_entity = await UserModel.updateStudentEntity(user_id, studentUpdates);
    }

    return results;
};

export const deleteStudentInfo = async function(user_id) {
    return await UserModel.deleteStudentInfo(user_id);
}
