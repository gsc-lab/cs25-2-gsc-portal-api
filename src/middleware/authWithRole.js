import { verify } from "../utils/auth.utils.js";
import { UnauthenticatedError, ForbiddenError } from "../errors/index.js";
import {findById} from "../models/Auth.js";

const ROLE_ORDER = { admin: 3, professor: 2, student: 1 };

export const authWithRole = (requiredRole = "student") => {
  return async (req, res, next) => {
    try {
    const token = req.cookies?.accessToken;
    if (!token) {
      throw new UnauthenticatedError("토큰이 제공되지 않았습니다.");
    }

    const result = verify(token);
    if (!result.success) {
      throw new UnauthenticatedError("토큰이 제공되지 않았습니다.");
    }

    const user = await findById(result.user_id);

    if (user.status !== 'active') {
      throw new ForbiddenError(`계정이 활성화 상태가 아닙니다. (현재 상태 ${user.status}`);
    }

    req.user = {
      user_id: user.user_id,
      role: user.role,
      status: user.status,
    };

    const userRoleValue = ROLE_ORDER[req.user.role] ?? 0;
    const requiredRoleValue = ROLE_ORDER[requiredRole];

    if (userRoleValue >= requiredRoleValue) {
      return next();
    }

    throw new ForbiddenError("요청에 대한 접근 권한이 없습니다.");
  } catch (error) {
      next(error);
    }
  };
};
