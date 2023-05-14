const express = require('express');
const auth = require('../../middlewares/auth');
const db = require('../../middlewares/db');
const schema = require('../../middlewares/schema');
const asyncHandler = require('express-async-handler');
const NurseryService = require('./nursery-service');
const uploadFile = require('../../middlewares/upload-file');

const nurseryService = new NurseryService();
const router = express.Router();

//Get nursery
router.get('/nursery/get/:uuid', db, asyncHandler(nurseryService.getNursery));

//Add nursery / Import
router.post('/nursery', db, uploadFile, asyncHandler(nurseryService.addNursery));

//Delete
router.delete('/nursery/delete/:uuid', db, asyncHandler(nurseryService.deleteNursery));

//Search
router.get('/nursery/search', db, asyncHandler(nurseryService.search));

//Graph
router.get('/nursery/graph', db, asyncHandler(nurseryService.getGraphData));

module.exports = router;