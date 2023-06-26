const express = require("express");
const auth = require("../../../middlewares/auth");
const db = require("../../../middlewares/db");
const schema = require("../../../middlewares/schema");
const asyncHandler = require("express-async-handler");
const Service = require("./distribution-service");
const uploadFile = require("../../../middlewares/upload-file");

const service = new Service();
const router = express.Router();

//Add / Import
router.post("/distribution", db, uploadFile, asyncHandler(service.add));

//Get
router.get("/distribution/get/:uuid", db, asyncHandler(service.get));

//Graph and Table
router.get("/distribution/data", db, asyncHandler(service.getData));

//Update
router.put("/distribution/update/:uuid", db, asyncHandler(service.update));

//Delete
router.delete("/distribution/delete/:uuid", db, asyncHandler(service.delete));

module.exports = router;
