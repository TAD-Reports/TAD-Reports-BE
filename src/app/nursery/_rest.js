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
router.get('/nursery/:uuid', db, asyncHandler(nurseryService.getNursery));

// Get all nursery
router.get('/nurseries', db, asyncHandler(nurseryService.getAllNursery));

// Add new nursery / import
router.post('/nursery', db, uploadFile, asyncHandler(nurseryService.addNursery));

// Delete nursery row
router.delete('/nursery/:uuid', db, asyncHandler(nurseryService.deleteNursery));

module.exports = router;