import schedule from 'node-schedule';
import pool from '../db/connection.js';

// 날짜 더하는 함수
export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    const year = result.getFullYear();
    const month = String(result.getMonth() + 1).padStart(2, '0');
    const day = String(result.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const initPollScheduler = () => {
    // [테스트용] 10초마다 실행 ('*/10 * * * * *')
    // [실제용] 월요일 자정 ('0 0 0 * * 1')
    schedule.scheduleJob('0 0 0 * * 1', async function() { 
        
        console.log('⏰ [스케줄러] 이번 주 주말 투표방 생성을 시작합니다...');
        
        const conn = await pool.getConnection();
        try {
            const today = new Date(); 

            // [테스트용] 오늘이 화요일(18일)이라 치고, 강제로 어제(월요일)로 시간 돌리기
            today.setDate(today.getDate() - 1);
            
            // 이번 주 토요일(+5), 일요일(+6) 날짜 계산
            const satDate = addDays(today, 5);
            const sunDate = addDays(today, 6);

            console.log(`📅 생성 대상 날짜: 토(${satDate}), 일(${sunDate})`);

            // -------------------------------------------------
            // [Step 1] 토요일 투표방 생성 (조건 없이 모든 규칙 적용)
            // -------------------------------------------------
            const [resSat] = await conn.query(`
                INSERT INTO weekend_attendance_poll 
                (poll_id, grade_id, poll_date, required_count, status)
                
                SELECT 
                    CONCAT('w', DATE_FORMAT(?, '%y%m%d'), grade_id), 
                    grade_id, 
                    ?,              -- 토요일 날짜
                    required_count, 
                    0 
                FROM poll_rules      -- [수정] WHERE 절 삭제 (모든 규칙 가져옴)
            `, [satDate, satDate]);

            // -------------------------------------------------
            // [Step 2] 일요일 투표방 생성 (조건 없이 모든 규칙 적용)
            // -------------------------------------------------
            const [resSun] = await conn.query(`
                INSERT INTO weekend_attendance_poll 
                (poll_id, grade_id, poll_date, required_count, status)
                
                SELECT 
                    CONCAT('w', DATE_FORMAT(?, '%y%m%d'), grade_id), 
                    grade_id, 
                    ?,              -- 일요일 날짜
                    required_count, 
                    0 
                FROM poll_rules      -- [수정] WHERE 절 삭제 (모든 규칙 가져옴)
            `, [sunDate, sunDate]);

            console.log(`✅ 결과: 토요일(${resSat.affectedRows}개), 일요일(${resSun.affectedRows}개) 생성 완료`);

        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                console.log(`ℹ️ [스케줄러] 이미 생성된 주말 투표방이 있습니다.`);
            } else {
                console.error('❌ [스케줄러] 생성 실패:', err);
            }
        } finally {
            conn.release();
        }
    });
};