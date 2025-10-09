import pool from "../db/connection.js";

// 강의실 목록 조회
export async function getClassrooms() {
    const [results] = await pool.query("SELECT * FROM classroom");
    return results
}

// 강의실 추가
export async function postClassrooms(building, room_number, room_type) {

    const [lastRows] = await pool.query(`
        SELECT classroom_id 
        FROM classroom 
        ORDER BY classroom_id DESC 
        LIMIT 1
    `);

    // 새 ID 생성
    const lastId = lastRows[0]?.classroom_id ?? null;
    const newId = lastId
        ? `CR${String(parseInt(lastId.replace("CR", ""), 10) + 1).padStart(3, "0")}`
        : "CR001";

    const [result] = await pool.query(
        `INSERT INTO classroom (classroom_id, building, room_number, room_type)
        VALUES (?, ?, ?, ?)`,
        [newId, building, room_number, room_type]
    );

    return result;
}

// 강의실 수정
export async function putClassrooms(id, building, room_number, room_type) {
    const [result] = await pool.query(
        `UPDATE classroom SET building = ?, room_number = ?, room_type = ? WHERE classroom_id = ?`, [building, room_number, room_type, id]
    );
    return result
}

// 강의실 삭제
export async function deleteClassrooms(id) {
    const [result] = await pool.query(
        `DELETE FROM classroom WHERE classroom_id = ?`, [id]
    );
    return result
}
