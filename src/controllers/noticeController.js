import * as noticeService from '../service/notice-service.js'
import { InternalServerError } from '../errors/index.js';
export async function fetchNotices(req, res) {
    try {
        const spec = {user: req.user} // 로그인 사용자 정보
        const query = req.query;

        const notices = await noticeService.getNotices(spec, query);

        res.status(200).json(notices);
    } catch (error) {
        console.error('error is fetchNotices controller', error);
        // throw new InternalServerError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요');
    }
}

// 입력 파싱/검증 => 서비스 -> http

// 리스트

// 싱세

// 등록

// 수정

// 삭제

// 파일

