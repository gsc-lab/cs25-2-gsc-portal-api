/**
 * @file 파일 관련 컨트롤러
 * @description 파일 다운로드 요청을 처리합니다.
 */
import * as fileService from "../service/file-service.js";
import fs from "fs";

/**
 * 파일 다운로드를 처리합니다.
 * 파일 ID를 받아 파일 경로, 파일명, 파일 타입을 조회한 후,
 * 적절한 헤더를 설정하여 파일을 스트림으로 응답합니다.
 *
 * @param {object} req - Express 요청 객체 (req.params.file_id 포함)
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 * @returns {void}
 */
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
