import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    dateStrings: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_0900_ai_ci'
});

export default pool;
