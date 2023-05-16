const express = require('express');
const auth = require('../../middlewares/auth');
const db = require('../../middlewares/db');
const schema = require('../../middlewares/schema');
const asyncHandler = require('express-async-handler');
const NurseryService = require('./nursery-service');
const uploadFile = require('../../middlewares/upload-file');

const nurseryService = new NurseryService();
const router = express.Router();

//Add nursery / Import
router.post('/nursery', db, uploadFile, asyncHandler(nurseryService.add));

//Get nursery
router.get('/nursery/get/:uuid', db, asyncHandler(nurseryService.get));

//Search
router.get('/nursery/search', db, asyncHandler(nurseryService.search));

//Graph
router.get('/nursery/graph', db, asyncHandler(nurseryService.getGraph));

//Delete
router.delete('/nursery/delete/:uuid', db, asyncHandler(nurseryService.delete));

module.exports = router;