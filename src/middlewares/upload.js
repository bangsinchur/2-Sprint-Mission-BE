import multer from "multer";
import path from "path";

// 저장할 경로 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // 업로드할 폴더
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // 파일 이름 설정
  },
});

// Multer 미들웨어 설정
const upload = multer({ storage });

export default upload;