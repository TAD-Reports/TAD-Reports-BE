const express = require("express");
const auth = require("../../../middlewares/auth");
const db = require("../../../middlewares/db");
const schema = require("../../../middlewares/schema");
const asyncHandler = require("express-async-handler");
const Service = require("./jobpositions-service");
const uploadFile = require("../../../middlewares/upload-file");

const service = new Service();
const router = express.Router();

//Add / Import
router.post("/jobposition", db, asyncHandler(service.add));

//Update
router.put("/jobposition/update/:uuid", db, asyncHandler(service.update));

//Delete
router.delete("/jobposition/delete/:uuid", db, asyncHandler(service.delete));

//Get
// router.get("/iecmaterials/get/:uuid", db, asyncHandler(service.get));

module.exports = router;