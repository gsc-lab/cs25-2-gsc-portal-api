import pool from "../db/connection.js";

export const getLatestSectionId = async () => {
  const [rows] = await pool.query(
    'SELECT sec_id FROM section ORDER BY year DESC, semester DESC LIMIT 1'
  );
  return rows.length > 0 ? rows[0].sec_id : null;
};
