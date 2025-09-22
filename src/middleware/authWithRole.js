const ROLE_ORDER = { admin: 3, professor: 2, student: 1 };
import { verify } from "../utils/auth.utils.js";
export const authWithRole = (requiredRole = "student") => {
  return (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({ success: false, message: "토큰 없음" });
    }

    const result = verify(token);
    if (!result.success) {
      return res
        .status(401)
        .json({ success: false, message: result.message || "인증 실패" });
    }

    req.user = {
      user_id: result.user_id,
      role: result.role,
    };

    const userRoleValue = ROLE_ORDER[req.user.role] ?? 0;
    const requiredRoleValue = ROLE_ORDER[requiredRole];

    if (userRoleValue >= requiredRoleValue) {
      return next();
    }

    return res.status(403).json({ success: false, message: "권한 없음" });
  };
};
