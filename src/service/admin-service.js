import * as UserModel from "../models/Admin.js"
import { BadRequestError, NotFoundError } from "../errors/index.js"

// 승인
export const getPendingUsers = async function() {
    return await UserModel.getPendingUsers();
}

export const postPendingUsers = async function({user_id, action}) {
    if (!user_id || !action) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    const result = await UserModel.postPendingUsers(user_id, action);
    if (result.affectedRows === 0) {
        throw new NotFoundError("유저 정보가 없습니다.")
    }
    return result
}

export const deletePendingUsers = async function(user_id) {
    if (!user_id) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    const result = await UserModel.deletePendingUsers(user_id);
    if (result.affectedRows === 0) {
        throw new NotFoundError("유저 정보가 없습니다.")
    }
    return result
}

// 예외 이메일
export const getAllowedEmail = async function() {
    return await UserModel.getAllowedEmail();
}

export const postAllowedEmail = async function({email, reason}) {
    if (!email || !reason) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    return await UserModel.postAllowedEmail(email, reason);
}

export const deleteAllowedEmail = async function(user_id) {
    if (!user_id) {
        throw new BadRequestError("필수 값이 누락 되었습니다.");
    }
    return await UserModel.deleteAllowedEmail(user_id);
}

// 학생 정보
export const getStudentInfo = async function({grade_id, status}) {
    return await UserModel.getStudentInfo(grade_id, status);
}

export const patchStudentInfo = async ({user_id, updates}) => {
    if (!user_id) {
        throw new BadRequestError("user_id 값이 누락 되었습니다.");
    }
    if (Object.keys(updates).length === 0) {
        throw new BadRequestError("updates 값이 누락 되었습니다.");
    }
    const userFields = ["name", "phone"];
    const studentFields = ["grade_id", "class_id", "language_id", "status", "is_international"];

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
    if (!user_id) {
        throw new BadRequestError("user_id 값이 누락 되었습니다.");
    }
    return await UserModel.deleteStudentInfo(user_id);
}

// 교수, 관리자 정보
export const getProAdminInfo = async function() {
    return await UserModel.getProAdminInfo();
}

// 권한 수정
export const putProAdminInfo = async function(user_id, role_type) {
    if (!user_id) {
        throw new BadRequestError("user_id 값이 누락 되었습니다.")
    }

    if (!role_type) {
        throw  new BadRequestError("role_type 값이 누락 되었습니다.")
    }

    return await UserModel.putProAdminInfo(user_id, role_type);
}
