const express = require("express");
const auth = require("../../../middlewares/auth");
const db = require("../../../middlewares/db");
const schema = require("../../../middlewares/schema");
const asyncHandler = require("express-async-handler");
const Service = require("./nursery-service");
const uploadFile = require("../../../middlewares/upload-file");

const service = new Service();
const router = express.Router();

//Add / Import
router.post("/nursery", db, uploadFile, asyncHandler(service.add));

//Get
router.get("/nursery/get/:uuid", db, asyncHandler(service.get));

//Graph & Table
router.get("/nursery/data", db, asyncHandler(service.getData));

//Update
router.put("/nursery/update/:uuid", db, asyncHandler(service.update));

//Delete
router.delete("/nursery/delete/:uuid", db, asyncHandler(service.delete));

//Retrieve / Export
router.post("/nursery/export", db, asyncHandler(service.exportData));

module.exports = router;
