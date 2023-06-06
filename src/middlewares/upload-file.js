const multer = require('multer');
const { BadRequestError } = require('./errors');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return cb(new BadRequestError('Invalid file type. Only XLSX files are allowed.'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 100 // 100 MB file size limit
  }
});

const uploadFile = (req, res, next) => {
  upload.single('file')(req, res, function (err) {
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
