import * as UserModel from "../models/Admin.js";
import { BadRequestError, NotFoundError } from "../errors/index.js";
import { requireFields } from "../utils/validation.js";

// ========================
// 승인 대기 사용자
// ========================

export const getPendingUsers = async () => {
    return await UserModel.getPendingUsers();
};

export const postPendingUsers = async ({ user_id, action }) => {
    // 필수값 검증
    requireFields({ user_id, action }, ["user_id", "action"]);

    const result = await UserModel.postPendingUsers(user_id, action);

    // 승인할 대상이 없는 경우
    if (!result || result.affectedRows === 0) {
        throw new NotFoundError("유저 정보가 없습니다.");
    }

    return result;
};

export const deletePendingUsers = async (user_id) => {
    requireFields({ user_id }, ["user_id"]);

    const result = await UserModel.deletePendingUsers(user_id);

    if (!result || result.affectedRows === 0) {
        throw new NotFoundError("유저 정보가 없습니다.");
    }

    return result;
};

// ========================
// 예외 이메일 관리
// ========================

export const getAllowedEmail = async () => {
    return await UserModel.getAllowedEmail();
};

export const postAllowedEmail = async ({ email, reason }) => {
    requireFields({ email, reason }, ["email", "reason"]);

    return await UserModel.postAllowedEmail(email, reason);
};

export const deleteAllowedEmail = async (user_id) => {
    requireFields({ user_id }, ["user_id"]);

    const result = await UserModel.deleteAllowedEmail(user_id);

    if (!result || result.affectedRows === 0) {
        throw new NotFoundError("삭제할 예외 이메일 정보를 찾을 수 없습니다.");
    }

    return result;
};

// ========================
// 학생 정보 관리
// ========================

export const getStudentInfo = async ({ grade_id, status }) => {
    return await UserModel.getStudentInfo(grade_id, status);
};

export const patchStudentInfo = async ({ user_id, updates }) => {
    requireFields({ user_id }, ["user_id"]);

    if (!updates || Object.keys(updates).length === 0) {
        throw new BadRequestError("updates 값이 누락 되었습니다.");
    }

    const userFields = ["name", "phone"];
    const studentFields = [
        "grade_id",
        "class_id",
        "language_id",
        "status",
        "is_international",
    ];

    const userUpdates = {};
    const studentUpdates = {};

    for (const key of Object.keys(updates)) {
        if (userFields.includes(key)) userUpdates[key] = updates[key];
        if (studentFields.includes(key)) studentUpdates[key] = updates[key];
    }

    // 둘 다 필터링됐는데 실제로 적용할 필드가 하나도 없는 경우
    if (
        Object.keys(userUpdates).length === 0 &&
        Object.keys(studentUpdates).length === 0
    ) {
        throw new BadRequestError("수정 가능한 필드가 없습니다.");
    }

    const results = {};

    if (Object.keys(userUpdates).length > 0) {
        results.user_account = await UserModel.updateUserAccount(
        user_id,
        userUpdates
        );
    }

    if (Object.keys(studentUpdates).length > 0) {
        results.student_entity = await UserModel.updateStudentEntity(
        user_id,
        studentUpdates
        );
    }

    return results;
    };

    export const deleteStudentInfo = async (user_id) => {
    requireFields({ user_id }, ["user_id"]);

    const result = await UserModel.deleteStudentInfo(user_id);

    if (!result || result.affectedRows === 0) {
        throw new NotFoundError("삭제할 학생 정보를 찾을 수 없습니다.");
    }

    return result;
};

// ========================
// 교수 / 관리자 정보
// ========================

export const getProAdminInfo = async () => {
    return await UserModel.getProAdminInfo();
};

// 권한 및 기본 정보 수정
export const putProAdminInfo = async (user_id, name, phone, role_type) => {
    requireFields({ user_id, name, phone, role_type }, [
        "user_id",
        "name",
        "phone",
        "role_type",
    ]);

    const result = await UserModel.putProAdminInfo(
        user_id,
        name,
        phone,
        role_type
    );

    if (!result || result.affectedRows === 0) {
        throw new NotFoundError("수정할 사용자 정보를 찾을 수 없습니다.");
    }

    return result;
};
