/**
 * @file 파일 업로드 미들웨어
 * @description Multer를 사용하여 로컬 파일 시스템 또는 AWS S3에 파일을 업로드하는 미들웨어를 설정합니다.
 */
import multer from "multer";
import AWS from "aws-sdk";
import multerS3 from "multer-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";

/**
 * Multer의 diskStorage 설정 객체입니다.
 * 업로드된 파일을 'uploads/' 디렉토리에 저장하고, 고유한 파일명을 생성합니다.
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const unique = uuidv4();
    // 한글 인코딩
    // file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const extension = path.extname(file.originalname); // 원본 파일 확장자
    cb(null, unique + extension);
  },
});

// // AWS region 및 자격증명 설정
// AWS.config.update({
//   accessKeyId: process.env.S3_ACCESS_KEY_ID,
//   secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
//   region: 'ap-northeast-2'
// })
//
// // AWS S3 multer 설정
// const upload = multer({
//   storage: multerS3({
//     s3: new AWS.S3(),
//     bucket: 'gsc-portal-files',
//     acl: "uploads",
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     key(req, file, cb) {
//       cb(null, `${Date.now()}_${path.basename(file.originalname)}`);
//     },
//   }),
//   limits: { fileSize: 5 * 1024 * 1024 },
// })

// // 허용되는 파일 타입과 사이즈

/**
 * 파일 업로드 미들웨어를 생성하는 헬퍼 함수입니다.
 * 지정된 파일 크기 제한을 가진 Multer 인스턴스를 반환합니다.
 *
 * @param {number} fileSizeLimitMB - 파일 크기 제한 (메가바이트 단위)
 * @returns {multer.Multer} 설정된 Multer 미들웨어 인스턴스
 */
const createUploadMiddleware = (fileSizeLimitMB) => {
  return multer({
    storage,
    limits: {
      fileSize: fileSizeLimitMB * 1024 * 1024,
    },
  });
};

// 로컬 multer 설정
const upload2 = multer();

/**
 * 공지사항 파일 업로드를 위한 Multer 미들웨어입니다.
 * 최대 50MB까지의 파일 업로드를 허용합니다.
 */
export const uploadForNotices = createUploadMiddleware(50);

/**
 * 학생 JLPT 시험 관련 파일 업로드를 위한 Multer 미들웨어입니다.
 * 최대 10MB까지의 파일 업로드를 허용합니다.
 */
export const uploadForJLPT = createUploadMiddleware(10);
