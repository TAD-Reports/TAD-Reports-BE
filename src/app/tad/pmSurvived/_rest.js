const express = require("express");
const auth = require("../../../middlewares/auth");
const db = require("../../../middlewares/db");
const schema = require("../../../middlewares/schema");
const asyncHandler = require("express-async-handler");
const PmSurvivedService = require("./pmsurvived-service");
const uploadFile = require("../../../middlewares/upload-file");

const service = new PmSurvivedService();
const router = express.Router();

//Add / Import
router.post("/pmsurvived", db, uploadFile, asyncHandler(service.add));

//Get
router.get("/pmsurvived/get/:uuid", db, asyncHandler(service.get));

//Graph and Table
router.get("/pmsurvived/data", db, asyncHandler(service.getData));

//Update
router.put("/pmsurvived/update/:uuid", db, asyncHandler(service.update));

//Delete
router.delete("/pmsurvived/delete/:uuid", db, asyncHandler(service.delete));

module.exports = router;
