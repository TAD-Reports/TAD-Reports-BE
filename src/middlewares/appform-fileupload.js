const multer = require('multer');
const { BadRequestError } = require('./errors');

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
    'image/png',
    'image/jpeg',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Invalid file type. Only XLSX, PDF, PNG, and JPEG files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 100, // 100 MB file size limit
  },
});

const uploadFile = (req, res, next) => {
  upload.fields([
    { name: 'pds', maxCount: 1 },
    { name: 'college', maxCount: 1 },
    { name: 'masteral', maxCount: 1 },
    { name: 'doctoral', maxCount: 1 },
    { name: 'eligibility', maxCount: 1 },
  ])(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Multer-specific error
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new BadRequestError('File size exceeds the limit.'));
      }
      return next(err);
    } else if (err) {
      // Other errors
      return next(err);
    }
    next();
  });
};

module.exports = uploadFile;
