const express = require("express");
const auth = require("../../../middlewares/auth");
const db = require("../../../middlewares/db");
const schema = require("../../../middlewares/schema");
const asyncHandler = require("express-async-handler");
const Service = require("./ndrrm-service");
const uploadFile = require("../../../middlewares/upload-file");

const service = new Service();
const router = express.Router();

//Add / Import
router.post("/ndrrm", db, uploadFile, asyncHandler(service.add));

//Get
router.get("/ndrrm/get/:uuid", db, asyncHandler(service.get));

//Graph & Table
router.get("/ndrrm/data", db, asyncHandler(service.getData));

//Update
router.put("/ndrrm/update/:uuid", db, asyncHandler(service.update));

//Delete
router.delete("/ndrrm/delete/:uuid", db, asyncHandler(service.delete));

//Export
router.get("/ndrrm/export", db, asyncHandler(service.exportDataToExcel));

module.exports = router;
