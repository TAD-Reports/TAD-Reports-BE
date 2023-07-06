const express = require("express");
const auth = require("../../../middlewares/auth");
const db = require("../../../middlewares/db");
const schema = require("../../../middlewares/schema");
const asyncHandler = require("express-async-handler");
const Service = require("./appform-service");
const uploadFile = require("../../../middlewares/appform-fileupload");

const service = new Service();
const router = express.Router();

//Add / Import
router.post("/appform", db, uploadFile, asyncHandler(service.add));

//Get
router.get("/appform/get/:uuid", db, asyncHandler(service.get));

//Search
router.get("/appform/data", db, asyncHandler(service.getData));

//Update
// router.put("/appform/update/:uuid", db, asyncHandler(service.update));

//Delete
router.delete("/appform/delete/:uuid", db, asyncHandler(service.delete));

module.exports = router;
