import * as adminService from '../service/admin-service.js'

// 승인
export const getPendingUsers = async function (req, res, next) {
    try {
        var result = await adminService.getPendingUsers();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err })
    }
};

export const postPendingUsers = async function (req, res, next) {
    try {
        const { user_id, action } = req.body;
        const params = { user_id, action };
        await adminService.postPendingUsers(params);
        res.status(200).json({
            message: action === "active" ? "승인 완료" : "승인 거부",
            user_id
        })
    } catch (err) {
        next(err)
    }
}

export const deletePendingUsers = async function (req, res, next) {
    try {
        const { user_id } = req.params;
        await adminService.deletePendingUsers(user_id);
        res.status(200).json({ message: "삭제 완료", user_id});
    } catch (err) {
        next(err)
    }
}

// 예외 이메일
export const getAllowedEmail = async function (req, res, next) {
    try {
        const result = await adminService.getAllowedEmail();
        res.status(200).json(result); 
    } catch (err) {
        next(err)
    };
}

export const postAllowedEmail = async function (req, res, next) {
    try {
        const { email, reason } = req.body;
        const params = { email, reason };
        await adminService.postAllowedEmail(params);
        res.status(200).json({ message: "추가 완료", email });
    } catch (err) {
        next(err)
    }
}

export const deleteAllowedEmail = async function (req, res, next) {
    try {
        const { user_id } = req.params;
        await adminService.deleteAllowedEmail(user_id);
        res.status(200).json({ message: "삭제완료", user_id });
    } catch (err) {
        next(err)
    }
}

// 학생 정보
export const getStudentInfo = async function (req, res, next) {
    try {
        const {grade_id, status} = req.query;
        const params = { grade_id, status};
        const result = await adminService.getStudentInfo(params);
        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
}

export const patchStudentInfo = async function (req, res, next) {
    try {
        const { user_id } = req.params;
        const updates = req.body;
        const params = { user_id, updates};

        if (!user_id) {
            return res.status(400).json({ error: "user_id is required" });
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No Data" });
        }
        await adminService.patchStudentInfo(params);
        res.status(200).json({ message: "수정 완료", user_id });
    } catch (err) {
        next(err)
    }
}

export const deleteStudentInfo = async function (req, res, next) {
    try {
        const { user_id } = req.params;
        await adminService.deleteStudentInfo(user_id);        
        res.status(200).json({ message: "삭제 완료" });
    } catch (err) {
        next(err)
    }
}

// 교수 관리자 정보
export const getProAdminInfo = async function (req, res, next) {
    try {
        const result = await adminService.getProAdminInfo();
        res.status(200).json(result)
    } catch (err) {
        next(err)
    }
}
