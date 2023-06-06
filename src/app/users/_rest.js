const express = require('express');
const auth = require('../../middlewares/auth');
const db = require('../../middlewares/db');
const schema = require('../../middlewares/schema');
const asyncHandler = require('express-async-handler');
const UserService = require('./users-service');
const { restart } = require('nodemon');

const service = new UserService();
const router = express.Router();

// User login
router.post('/login', db, schema, asyncHandler(service.login));

// Register new user
router.post('/register', db, asyncHandler(service.register));

// Get password for download Data
router.post('/password', db, asyncHandler(service.password));

// Get user by ID
router.get('/user/:uuid', db, asyncHandler(service.user));

// Get all users
router.get('/users', db, asyncHandler(service.users));

// Update user info
router.put('/user/:uuid', db, asyncHandler(service.update));

// Delete a user
// router.delete('/user/:uuid', db, asyncHandler(service.delete));


module.exports = router;