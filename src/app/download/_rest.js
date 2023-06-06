const express = require("express");
const db = require("../../middlewares/db");
const asyncHandler = require("express-async-handler");
const DownloadService = require("./download-service");

const service = new DownloadService();
const router = express.Router();

//Download File Template
router.get("/download/:filename", db, asyncHandler(service.getTemplate));

module.exports = router;
