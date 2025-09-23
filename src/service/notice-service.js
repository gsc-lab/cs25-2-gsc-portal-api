
import * as noticeModel from '../models/Notice.js';

// 권한/ 가시성 규칙
export const getNotices = async (spec, query) => {
    const notices = await noticeModel.findBySpec(spec, query);

    return notices;
}

// 목록 where 스펙 - repository가 받아 sql where 구성

// 유스케이스

// 공지 작성

// 공지 수정

// 공지 삭제

// 파일 다울놀드

// 파일 등록