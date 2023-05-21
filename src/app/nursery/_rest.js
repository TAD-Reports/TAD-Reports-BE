const express = require("express");
const auth = require("../../middlewares/auth");
const db = require("../../middlewares/db");
const schema = require("../../middlewares/schema");
const asyncHandler = require("express-async-handler");
const NurseryService = require("./nursery-service");
const uploadFile = require("../../middlewares/upload-file");
const { errorHandler } = require("../../middlewares/errors");

const service = new NurseryService();
const router = express.Router();

router.use(errorHandler);

//Add / Import
router.post("/nursery", db, uploadFile, asyncHandler(service.add));

//Get
router.get("/nursery/get/:uuid", db, asyncHandler(service.get));

//Graph and Table
router.get("/nursery/data", db, asyncHandler(service.getData));

//Update
router.put("/nursery/update/:uuid", db, asyncHandler(service.update));

//Delete
router.delete("/nursery/delete/:uuid", db, asyncHandler(service.delete));

module.exports = router;
