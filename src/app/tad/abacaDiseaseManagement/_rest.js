const express = require('express');
const auth = require("../../../middlewares/auth");
const db = require("../../../middlewares/db");
const schema = require("../../../middlewares/schema");
const asyncHandler = require('express-async-handler');
const Service = require('./abacadisease-service');
const uploadFile = require("../../../middlewares/upload-file");

const service = new Service();
const router = express.Router();

//Add / Import
router.post('/abacadiseasemanagement', db, uploadFile, asyncHandler(service.add));

//Get 
router.get('/abacadiseasemanagement/get/:uuid', db, asyncHandler(service.get));

//Graph and Table
router.get("/abacadiseasemanagement/data", db, asyncHandler(service.getData));

//Update
router.put("/abacadiseasemanagement/update/:uuid", db, asyncHandler(service.update));

//Delete
router.delete('/abacadiseasemanagement/delete/:uuid', db, asyncHandler(service.delete));

module.exports = router;