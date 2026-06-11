const multer = require("multer");

// In-memory storage; Excel files are parsed directly from the buffer.
const storage = multer.memoryStorage();

const excelUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (allowed.includes(file.mimetype) || /\.(xlsx|xls|csv)$/i.test(file.originalname)) {
      return cb(null, true);
    }
    return cb(new Error("Only Excel/CSV files are allowed"));
  },
});

module.exports = { excelUpload };
