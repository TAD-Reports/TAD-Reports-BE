const express = require('express');
const auth = require('../../middlewares/auth');
const db = require('../../middlewares/db');
const schema = require('../../middlewares/schema');
const asyncHandler = require('express-async-handler');
const DistributionService = require('./distribution-service');
const uploadFile = require('../../middlewares/upload-file');

const distributionService = new DistributionService();
const router = express.Router();

//Get 
router.get('/distribution/get/:uuid', db, asyncHandler(distributionService.get));

//Add 
router.post('/distribution', db, uploadFile, asyncHandler(distributionService.add));

//Delete
router.delete('/distribution/delete/:uuid', db, asyncHandler(distributionService.delete));

//Search
router.get('/distribution/search', db, asyncHandler(distributionService.search));

//Graph
router.get('/distribution/graph', db, asyncHandler(distributionService.getGraphData));

module.exports = router;