const express = require("express");
const auth = require("../../middlewares/auth");
const db = require("../../middlewares/db");
const schema = require("../../middlewares/schema");
const asyncHandler = require("express-async-handler");
const JobPositionService = require("./applicationform-service");
const uploadFile = require("../../middlewares/upload-file");


const service = new JobPositionService();
const router = express.Router();

//Add / Import
router.post("/jobposition", db, uploadFile, asyncHandler(service.add));

//Get
// router.get("/iecmaterials/get/:uuid", db, asyncHandler(service.get));

//Graph and Table
// router.get("/iecmaterials/data", db, asyncHandler(service.getData));

//Update
// router.put("/iecmaterials/update/:uuid", db, asyncHandler(service.update));

//Delete
// router.delete("/iecmaterials/delete/:uuid", db, asyncHandler(service.delete));

module.exports = router;