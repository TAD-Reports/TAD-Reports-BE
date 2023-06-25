const express = require("express");
const auth = require("../../../middlewares/auth");
const db = require("../../../middlewares/db");
const schema = require("../../../middlewares/schema");
const asyncHandler = require("express-async-handler");
const Service = require("./cocoon-service");
const uploadFile = require("../../../middlewares/upload-file");

const service = new Service();
const router = express.Router();


//Add / Import
router.post("/cocoon", db, uploadFile, asyncHandler(service.add));

//Get
router.get("/cocoon/get/:uuid", db, asyncHandler(service.get));

//Graph and Table
router.get("/cocoon/data", db, asyncHandler(service.getData));

//Update
router.put("/cocoon/update/:uuid", db, asyncHandler(service.update));

//Delete
router.delete("/cocoon/delete/:uuid", db, asyncHandler(service.delete));

module.exports = router;