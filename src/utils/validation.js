import { BadRequestError } from "../errors/index.js";

/**
 * 필수 필드 검증 도구
 * @param {object} payload - 검사할 객체
 * @param {array} fields - 필수 필드 목록
 */
export function requireFields(payload, fields = []) {
    const missing = [];

    for (const f of fields) {
        const v = payload[f];

        // 0 은 허용하지만 undefined / null / "" 는 누락으로 판단
        if (v === undefined || v === null || v === "") {
        missing.push(f);
        }
    }

    if (missing.length > 0) {
        throw new BadRequestError(`필수 값이 누락되었습니다: ${missing.join(", ")}`);
    }
}
