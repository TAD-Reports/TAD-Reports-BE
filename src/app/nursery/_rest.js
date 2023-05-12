const express = require('express');
const auth = require('../../middlewares/auth');
const db = require('../../middlewares/db');
const schema = require('../../middlewares/schema');
const asyncHandler = require('express-async-handler');
const NurseryService = require('./nursery-service');
const uploadFile = require('../../middlewares/upload-file');

const nurseryService = new NurseryService();
const router = express.Router();

// Get nursery
router.get('/nursery/get/:uuid', db, asyncHandler(nurseryService.getNursery));

// Add new nursery / import
router.post('/nursery', db, uploadFile, asyncHandler(nurseryService.addNursery));

// Delete nursery row
router.delete('/nursery/delete/:uuid', db, asyncHandler(nurseryService.deleteNursery));

//Search by key
router.get('/nursery/search/:key', db, asyncHandler(nurseryService.search));

//Get Graph Data
router.get('/nursery/graph/:date', db, asyncHandler(nurseryService.getGraphData));

module.exports = router;