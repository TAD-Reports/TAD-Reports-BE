const express = require('express');
const auth = require('../../middlewares/auth');
const db = require('../../middlewares/db');
const schema = require('../../middlewares/schema');
const asyncHandler = require('express-async-handler');
const DistributionService = require('./distribution-service');
const uploadFile = require('../../middlewares/upload-file');

const distributionService = new DistributionService();
const router = express.Router();

//Get nursery
router.get('/distribution/get/:uuid', db, asyncHandler(distributionService.getNursery));

//Add nursery / Import
router.post('/distribution', db, uploadFile, asyncHandler(distributionService.addNursery));

//Delete
router.delete('/distribution/delete/:uuid', db, asyncHandler(distributionService.deleteNursery));

//Search
router.get('/distribution/search', db, asyncHandler(distributionService.search));

//Graph
router.get('/distribution/graph', db, asyncHandler(distributionService.getGraphData));

module.exports = router;