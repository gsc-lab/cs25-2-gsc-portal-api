import multer from "multer";
import AWS from "aws-sdk";
import multerS3 from "multer-s3";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// 공통 스토리지 -> upload
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
//
// // 허용되는 파일 타입과 사이즈
// const createUploadMiddleware = (fileSizeLimitMB) => {
//   return multer({
//     storage,
//     limits: {
//       fileSize: fileSizeLimitMB * 1024 * 1024,
//     },
//   });
// };

// 로컬 multer 설정
const upload2 = multer();

// 공지사항
export const uploadForNotices = createUploadMiddleware(50);

// 학생 JLTP
export const uploadForJLPT = createUploadMiddleware(10);
