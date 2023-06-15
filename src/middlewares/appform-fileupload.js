const multer = require("multer");

// Configure multer without storage
const uploadFile = multer().any();

module.exports = uploadFile;
