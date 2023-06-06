const express = require("express");
const auth = require("../../middlewares/auth");
const db = require("../../middlewares/db");
const schema = require("../../middlewares/schema");
const asyncHandler = require("express-async-handler");
const LogsService = require("./logs-service");

const service = new LogsService();
const router = express.Router();

//Add logs for download button and logout
router.post("/logs/:module", db, asyncHandler(service.add));

//Pass the module name (e.g. Authentication or Nursery)

module.exports = router;
