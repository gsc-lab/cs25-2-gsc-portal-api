import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// 공통 스토리지
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

// 허용되는 파일 타입과 사이즈
const createUploadMiddleware = (fileSizeLimitMB) => {
  return multer({
    storage,
    limits: {
      fileSize: fileSizeLimitMB * 1024 * 1024,
    },
  });
};

// 공지사항
export const uploadForNotices = createUploadMiddleware(50);

// 학생 JLTP
export const uploadForJLPT = createUploadMiddleware(10);
