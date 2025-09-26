import pool from "../db/connection.js";
import mime from "mime-types";
import path from "path";
import { NotFoundError } from "../errors/index.js";

export const addFiles = async (files, connection) => {
  if (!files || files.length === 0) {
    return [];
  }

  const sql = `INSERT INTO file_assets (file_id, file_name, file_url, size_type, file_type) VALUES ?`;

  const values = files.map((file) => {
    const originalFilename = file.originalname;
    let finalMimeType = file.mimetype;

    // 기본 타입이 불분명하면, 확장자로 다시 조회
    if (finalMimeType === "application/octet-stream") {
      const extension = path.extname(originalFilename).toLowerCase();

      if (extension === ".hwpx") {
        finalMimeType = "application/haansofthwp+xml";
      } else if (extension === ".hwp") {
        finalMimeType = "application/haansofthwp";
      } else {
        const extensionType = mime.lookup(originalFilename);
        if (extensionType) {
          finalMimeType = extensionType;
        }
      }
    }

    const uuid = file.filename.split(".")[0];
    const fileId = "FI" + uuid.substring(0, 8);
    return [
      fileId,
      originalFilename, // 원본 파일
      file.path, // 저장 경로
      file.size, // 파일 크기
      finalMimeType, // 조회된 타입으로 교체
    ];
  });

  await (connection || pool).query(sql, [values]);

  // 배열 반환
  return values.map((v) => v[0]);
};

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
