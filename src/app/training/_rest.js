const express = require("express");
const auth = require("../../middlewares/auth");
const db = require("../../middlewares/db");
const schema = require("../../middlewares/schema");
const asyncHandler = require("express-async-handler");
const TrainingService = require("./training-service");
const uploadFile = require("../../middlewares/upload-file");
const { errorHandler } = require("../../middlewares/errors");

const service = new TrainingService();
const router = express.Router();

router.use(errorHandler);

//Add / Import
router.post("/training", db, uploadFile, asyncHandler(service.add));

//Get
router.get("/training/get/:uuid", db, asyncHandler(service.get));

//Graph and Table
router.get("/training/data", db, asyncHandler(service.getData));

//Update
router.put("/training/update/:uuid", db, asyncHandler(service.update));

//Delete
router.delete("/training/delete/:uuid", db, asyncHandler(service.delete));

module.exports = router;
