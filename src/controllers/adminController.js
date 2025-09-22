import * as adminService from '../service/admin-service.js'

// 승인
export const getPendingUsers = async function (req, res) {
    try {
        var result = await adminService.getPendingUsers();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err })
    }
};

export const postPendingUsers = async function (req, res) {
    try {
        const { user_id, action } = req.body;
        if (!user_id || !action) {
            return res.status(400).json({ error: "user_id and action are required" });
        }

        const result = await adminService.postPendingUsers(user_id, action);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found"});
        }

        res.status(200).json({
            message: action === "active" ? "승인 완료" : "승인 거부",
            user_id
        })
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const deletePendingUsers = async function (req, res) {
    try {
        const { user_id } = req.body;
        if (!user_id) {
            return res.status(400).json({ error: "user_id is required"});
        }

        const result = await adminService.deletePendingUsers(user_id);
        
        if (result.affectedRows ===0 ) {
            return res.status(404).json({ error: "User not found"});
        }

        res.status(200).json({ message: "삭제 완료", user_id});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// 예외 이메일
export const getAllowedEmail = async function (req, res) {
    try {
        const result = await adminService.getAllowedEmail();
        res.status(200).json(result); 
    } catch (err) {
        res.status(500).json({ error: err });
    };
}

export const postAllowedEmail = async function (req, res) {
    try {
        const { email, reason } = req.body;
        if (!email || !reason) {
            return res.status(400).json({ error: "email and reason are required" });
        }

        const result = await adminService.postAllowedEmail(email, reason);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "INSERT Error" });
        }

        res.status(200).json({ message: "추가 완료", email });
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

export const deleteAllowedEmail = async function (req, res) {
    try {
        const {id} = req.body;
        if (!id) {
            return res.status(400).json({ error: "id are required" });
        }

        const result = await adminService.deleteAllowedEmail(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "delete user not found"})
        }

        res.status(200).json({ messgae: "삭제완료", id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// 학생 정보
export const getStudentInfo = async function (req, res) {
    try {
        const {grade_name, status} = req.body;

        if (!status) {
            req.status(400).json({ error: "grade_name and status are required" });
        }

        const result = await adminService.getStudentInfo(grade_name, status);

        if (result.affectedRows === 0) {
            return res.status(400).json({ error: "Student Info not founded" });
        }
        res.status(200).json(result)
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const patchStudentInfo = async function (req, res) {
    try {
        const { user_id } = req.params;
        const updates = req.body;

        if (!user_id) {
            return res.status(400).json({ error: "user_id is required" });
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No Data" });
        }

        const result = await adminService.patchStudentInfo(user_id, updates);
        res.status(200).json({ message: "수정 완료", user_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const deleteStudentInfo = async function (req, res) {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: "user_id is required"});
        }

        const result = await adminService.deleteStudentInfo(user_id);
        res.status(200).json({ message: "삭제 완료" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}