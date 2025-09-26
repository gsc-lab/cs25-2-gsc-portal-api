import * as fileService from "../service/file-service.js";
import * as noticeService from "../service/notice-service.js";
import fs from "fs";

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

export async function uploadNotice(req, res, next) {
  try {
    const { notice_id } = req.params;
    const { user, body: noticeData, files: newFiles } = req;

    const result = await noticeService.updateNotice(
      notice_id,
      noticeData,
      newFiles,
      user,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
