const express = require("express");
const auth = require("../../../middlewares/auth");
const db = require("../../../middlewares/db");
const schema = require("../../../middlewares/schema");
const asyncHandler = require("express-async-handler");
const Service = require("./coconutproject-service");
const uploadFile = require("../../../middlewares/upload-file");

const service = new Service();
const router = express.Router();

//Add / Import
router.post("/coconutproject", db, uploadFile, asyncHandler(service.add));

//Get
router.get("/coconutproject/get/:uuid", db, asyncHandler(service.get));

//Graph & Table
router.get("/coconutproject/data", db, asyncHandler(service.getData));

//Update
router.put("/coconutproject/update/:uuid", db, asyncHandler(service.update));

//Delete
router.delete("/coconutproject/delete/:uuid", db, asyncHandler(service.delete));

module.exports = router;
