import * as adminService from "../service/admin-service.js";
import { BadRequestError } from "../errors/index.js";

// 승인 대기 유저 목록 조회
export const getPendingUsers = async function (req, res, next) {
    try {
        const result = await adminService.getPendingUsers();
        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 승인 / 거절 처리
export const postPendingUsers = async function (req, res, next) {
    try {
        const { user_id, action } = req.body;
        const params = { user_id, action };

        const result = await adminService.postPendingUsers(params);

        return res.status(200).json({
        success: true,
        message: action === "active" ? "승인 완료" : "승인 거부",
        data: {
            user_id,
            action,
            result,
        },
        });
    } catch (err) {
        next(err);
    }
};

// 승인 대기 유저 삭제
export const deletePendingUsers = async function (req, res, next) {
    try {
        const { user_id } = req.params;
        const result = await adminService.deletePendingUsers(user_id);

        return res.status(200).json({
        success: true,
        message: "삭제 완료",
        data: {
            user_id,
            result,
        },
        });
    } catch (err) {
        next(err);
    }
};

// 예외 이메일 목록 조회
export const getAllowedEmail = async function (req, res, next) {
    try {
        const result = await adminService.getAllowedEmail();
        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 예외 이메일 추가
export const postAllowedEmail = async function (req, res, next) {
    try {
        const { email, reason } = req.body;
        const params = { email, reason };

        const result = await adminService.postAllowedEmail(params);

        return res.status(201).json({
        success: true,
        message: "예외 이메일 추가 완료",
        data: {
            email,
            reason,
            result,
        },
        });
    } catch (err) {
        next(err);
    }
};

// 예외 이메일 삭제
export const deleteAllowedEmail = async function (req, res, next) {
    try {
        const { user_id } = req.params;
        const result = await adminService.deleteAllowedEmail(user_id);

        return res.status(200).json({
        success: true,
        message: "예외 이메일 삭제 완료",
        data: {
            user_id,
            result,
        },
        });
    } catch (err) {
        next(err);
    }
};

// 학생 정보 조회
export const getStudentInfo = async function (req, res, next) {
    try {
        const { grade_id, status } = req.query;
        const params = { grade_id, status };

        const result = await adminService.getStudentInfo(params);

        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 학생 정보 일부 수정 (PATCH)
export const patchStudentInfo = async function (req, res, next) {
    try {
        const { user_id } = req.params;
        const updates = req.body;

        if (!user_id) {
        throw new BadRequestError("user_id는 필수 값입니다.");
        }
        if (!updates || Object.keys(updates).length === 0) {
        throw new BadRequestError("수정할 데이터가 없습니다.");
        }

        const params = { user_id, updates };
        const result = await adminService.patchStudentInfo(params);

        return res.status(200).json({
        success: true,
        message: "학생 정보 수정 완료",
        data: {
            user_id,
            updates,
            result,
        },
        });
    } catch (err) {
        next(err);
    }
};

// 학생 삭제
export const deleteStudentInfo = async function (req, res, next) {
    try {
        const { user_id } = req.params;
        const result = await adminService.deleteStudentInfo(user_id);

        return res.status(200).json({
        success: true,
        message: "학생 정보 삭제 완료",
        data: {
            user_id,
            result,
        },
        });
    } catch (err) {
        next(err);
    }
};

// 교수 / 관리자 정보 조회
export const getProAdminInfo = async function (req, res, next) {
    try {
        const result = await adminService.getProAdminInfo();

        return res.status(200).json({
        success: true,
        data: result,
        });
    } catch (err) {
        next(err);
    }
};

// 교수 / 관리자 정보 수정
export const putProAdminInfo = async function (req, res, next) {
    try {
        const { user_id } = req.params;
        const { name, phone, role_type } = req.body;

        const result = await adminService.putProAdminInfo(
        user_id,
        name,
        phone,
        role_type,
        );

        return res.status(200).json({
        success: true,
        message: "교수/관리자 정보 수정 완료",
        data: {
            user_id,
            name,
            phone,
            role_type,
            result,
        },
        });
    } catch (err) {
        next(err);
    }
};
