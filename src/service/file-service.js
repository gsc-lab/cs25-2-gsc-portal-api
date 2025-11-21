/**
 * @file 파일 관련 서비스 로직
 * @description 파일 정보를 데이터베이스에 추가, 조회, 삭제하고 MIME 타입을 결정하는 비즈니스 로직을 처리합니다.
 */
import pool from "../db/connection.js";
import mime from "mime-types";
import path from "path";
import { NotFoundError } from "../errors/index.js";

/**
 * 업로드된 파일 정보를 데이터베이스에 추가합니다.
 * 각 파일에 대해 파일명, 저장 경로, 크기, MIME 타입을 저장합니다.
 *
 * @param {Array<object>} files - 업로드된 파일 객체 배열 (originalname, path, size, mimeType 속성 포함)
 * @param {object} connection - 데이터베이스 연결 객체 (트랜잭션용)
 * @returns {Promise<Array<number>>} 삽입된 파일 ID 배열
 */
export const addFiles = async (files, connection) => {
  if (!files || files.length === 0) {
    return [];
  }

  const insertedFileIds = [];

  const db = connection || pool;

  for (const file of files) {
    const sql = `INSERT INTO file_assets (file_name, file_url, size_type, file_type) VALUES (?, ?, ?, ?)`;

    const finalMimeType = determineMimeType(file);
    const params = [file.originalname, file.path, file.size, finalMimeType];

    const [result] = await db.query(sql, params);

    if (result.insertId) {
      insertedFileIds.push(result.insertId);
    }
  }

  return insertedFileIds;
};

/**
 * 파일의 MIME 타입을 결정합니다.
 * Multer에서 제공하는 mimeType이 없거나 일반적인 경우, 파일 확장자를 기반으로 MIME 타입을 유추합니다.
 *
 * @param {object} file - 파일 객체 (originalname, mimeType 속성 포함)
 * @returns {string} 결정된 MIME 타입
 */
const determineMimeType = (file) => {
  const originalFilename = file.originalname;
  let finalMimeType = file.mimeType;

  if (!finalMimeType || finalMimeType === "application/octet-stream") {
    const extension = path.extname(originalFilename).toLowerCase();
    if (extension === ".hwpx") return "application/haansofthwp+xml";
    if (extension === ".hwp") return "application/haansofthwp";

    const extensionType = mime.lookup(originalFilename);
    if (extensionType) finalMimeType = extensionType;
  }
  return finalMimeType;
};

/**
 * 파일 다운로드에 필요한 정보를 데이터베이스에서 조회합니다.
 * 파일 ID를 통해 파일의 저장 경로, 원본 파일명, MIME 타입을 가져옵니다.
 *
 * @param {string} fileId - 다운로드할 파일의 ID
 * @returns {Promise<{filePath: string, fileName: string, fileType: string}>} 파일 경로, 파일명, 파일 타입
 * @throws {NotFoundError} 파일을 찾을 수 없는 경우
 */
export const getFileDownload = async (fileId) => {
  const [rows] = await pool.query(
    `SELECT file_url, file_name, file_type FROM file_assets WHERE file_id = ?`,
    [fileId],
  );

  if (rows.length === 0) {
    throw new NotFoundError("파일을 찾을 수 없습니다.");
  }
  return {
    filePath: rows[0].file_url,
    fileName: rows[0].file_name,
    fileType: rows[0].file_type,
  };
};

/**
 * 데이터베이스에서 파일 정보를 삭제합니다.
 * 주어진 파일 ID 배열에 해당하는 파일 레코드를 `file_assets` 테이블에서 삭제합니다.
 *
 * @param {Array<string>} fileIds - 삭제할 파일 ID 배열
 * @param {object} connection - 데이터베이스 연결 객체 (트랜잭션용)
 * @returns {Promise<number>} 삭제된 행의 수
 */
export const deleteFiles = async (fileIds, connection) => {
  if (!fileIds || fileIds.length === 0) {
    return 0;
  }

  const db = connection || pool;

  const placeholders = fileIds.map(() => "?").join(",");
  const sql = `DELETE FROM file_assets WHERE file_id IN (${placeholders})`;

  const [result] = await db.query(sql, fileIds);
  return result.affectedRows;
};
