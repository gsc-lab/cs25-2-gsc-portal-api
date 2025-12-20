/**
 * @file 파일 업로드 S3 미들웨어
 * @description Multer를 사용하여 AWS S3에 파일을 업로드하는 미들웨어를 설정합니다. (AWS SDK v3 사용)
 */
import multer from "multer";
import { S3Client } from "@aws-sdk/client-s3"; // AWS SDK v3 S3 클라이언트
import multerS3 from "multer-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// AWS SDK v3 S3 클라이언트 인스턴스 생성
// .env 파일에 S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY 와 같이 키를 설정해주세요.
const s3 = new S3Client({
  region: 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  }
});

/**
 * AWS S3를 위한 Multer storage 설정 객체입니다.
 * 업로드된 파일을 'gsc-portal-files' 버킷에 저장하고, 고유한 파일명을 생성합니다.
 */
const s3Storage = multerS3({
  s3: s3, // AWS SDK v3 S3 클라이언트 전달
  bucket: 'gsc-portal-files',
  contentType: multerS3.AUTO_CONTENT_TYPE, // 파일의 Content-Type을 자동으로 감지
  key(req, file, cb) {
    // UTF-8로 전송된 파일명을 latin1으로 잘못 해석하는 문제 해결
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');

    const unique = uuidv4();
    // macOS 등에서 사용하는 NFD 인코딩을 NFC로 정규화
    const normalized = file.originalname.normalize("NFC");
    const extension = path.extname(normalized); // 원본 파일 확장자

    // S3에 저장될 파일 경로 및 이름: 'uploads/랜덤UUID.확장자'
    cb(null, `uploads/${unique}${extension}`);
  },
});

/**
 * 파일 업로드 미들웨어를 생성하는 헬퍼 함수입니다.
 * 지정된 파일 크기 제한을 가진 Multer 인스턴스를 반환합니다.
 *
 * @param {number} fileSizeLimitMB - 파일 크기 제한 (메가바이트 단위)
 * @returns {multer.Multer} 설정된 Multer 미들웨어 인스턴스
 */
const createUploadMiddleware = (fileSizeLimitMB) => {
  return multer({
    storage: s3Storage, // 스토리지를 S3로 설정
    limits: {
      fileSize: fileSizeLimitMB * 1024 * 1024,
    },
  });
};

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