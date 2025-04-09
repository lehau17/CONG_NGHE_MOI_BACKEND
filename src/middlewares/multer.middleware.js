// middlewares/upload.js
import multer from "multer";

const storage = multer.memoryStorage(); // Đọc file vào RAM
const upload = multer({ storage });

export default upload;
