const express = require('express');
const auth = require('../../middlewares/auth');
const db = require('../../middlewares/db');
const schema = require('../../middlewares/schema');
const asyncHandler = require('express-async-handler');
const NurseryService = require('./nursery-service');

const nurseryService = new NurseryService();
const router = express.Router();

// Get nursery
router.get('/nursery/:uuid', db, asyncHandler(nurseryService.getNursery));