import pool from "../db/connection.js";
import mime from "mime-types";
import path from "path";
import { NotFoundError } from "../errors/index.js";

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
}

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
