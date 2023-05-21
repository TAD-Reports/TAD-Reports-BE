const express = require("express");
const auth = require("../../middlewares/auth");
const db = require("../../middlewares/db");
const schema = require("../../middlewares/schema");
const asyncHandler = require("express-async-handler");
const NurseryService = require("./nursery-service");
const uploadFile = require("../../middlewares/upload-file");
const { errorHandler } = require("../../middlewares/errors");

const nurseryService = new NurseryService();
const router = express.Router();

router.use(errorHandler);

//Add / Import
router.post("/nursery", db, uploadFile, asyncHandler(nurseryService.add));

//Get
router.get("/nursery/get/:uuid", db, asyncHandler(nurseryService.get));

//Graph and Table
router.get("/nursery/data", db, asyncHandler(nurseryService.getData));

//Update
router.put("/nursery/update/:uuid", db, asyncHandler(nurseryService.update));

//Delete
router.delete("/nursery/delete/:uuid", db, asyncHandler(nurseryService.delete));

//Download File Template
router.get("/nursery/download/template/:filename", nurseryService.getTemplate);

module.exports = router;
