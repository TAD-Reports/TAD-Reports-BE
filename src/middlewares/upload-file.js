const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return cb(new Error('Invalid file type. Only XLSX files are allowed.'))
    }
    cb(null, true)
  },
  limits: {
    fileSize: 1024 * 1024 * 10 // 10 MB
  }
});

const uploadFile = (req, res, next) => {
  upload.single('file')(req, res, function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

module.exports = uploadFile;
