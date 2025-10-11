import * as fileService from "../service/file-service.js";
import fs from "fs";

// 업로드 헤더 설정 (Content-Disposition)
export async function downloadFile(req, res, next) {
  try {
    const { file_id } = req.params;
    const { filePath, fileName, fileType } =
      await fileService.getFileDownload(file_id);

    // Content-Type 헤더 설정하여 파일 종류 파악
    res.setHeader("Content-Type", fileType);

    // 엔코딩 헤더 설정
    const encodedFilename = encodeURIComponent(fileName);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodedFilename}'`,
    );

    const fileStream = fs.createReadStream(filePath);
    // 파일 경로 전송
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
}
