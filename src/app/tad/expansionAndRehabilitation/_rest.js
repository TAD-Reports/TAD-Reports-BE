const express = require("express");
const auth = require("../../../middlewares/auth");
const db = require("../../../middlewares/db");
const schema = require("../../../middlewares/schema");
const asyncHandler = require("express-async-handler");
const Service = require("./expansionandrehab-service");
const uploadFile = require("../../../middlewares/upload-file");

const service = new Service();
const router = express.Router();

//Add / Import
router.post("/expansion", db, uploadFile, asyncHandler(service.add));

//Get
router.get("/expansion/get/:uuid", db, asyncHandler(service.get));

//Graph and Table
router.get("/expansion/data", db, asyncHandler(service.getData));

//Update
router.put("/expansion/update/:uuid", db, asyncHandler(service.update));

//Delete
router.delete("/expansion/delete/:uuid", db, asyncHandler(service.delete));

module.exports = router;