import jwt from "jsonwebtoken";

const ROLE_ORDER = { admin: 3, professor: 2, student: 1 };

export const authWithRole = (requiredRole = "student") => {
    return (req, res, next) => {
        const token = req.cookies?.accessToken;
        if (!token) {
        return res.status(401).json({ success: false, message: "토큰 없음" });
        }

        let decoded;
        try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ success: false, message: "서버 설정 오류: JWT_SECRET 없음" });
        }

        decoded = jwt.verify(token, secret);  // ✅ secret 전달
        } catch (err) {
        return res.status(401).json({ success: false, message: "인증 실패", error: err.message });
        }

        if (decoded.status !== "active") {
        return res.status(403).json({ success: false, message: "승인 대기/거절" });
        }

        req.user = {
        user_id: decoded.user_id,
        role: decoded.role,
        };

        const userRoleValue = ROLE_ORDER[req.user.role] ?? 0;
        const requiredRoleValue = ROLE_ORDER[requiredRole];

        if (userRoleValue >= requiredRoleValue) {
        return next();
        }

        return res.status(403).json({ success: false, message: "권한 없음" });
    };
};
