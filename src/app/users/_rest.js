const express = require('express');
const auth = require('../../middlewares/auth');
const db = require('../../middlewares/db');
const schema = require('../../middlewares/schema');
const asyncHandler = require('express-async-handler');
const UserService = require('./users-service');
const { restart } = require('nodemon');

const userService = new UserService();
const router = express.Router();

// Get user by ID
router.get('/user/:uuid', db, asyncHandler(userService.getUser));

// Get all users
router.get('/users', db, asyncHandler(userService.getUsers));

// Update user info
router.put('/user/:uuid', db, asyncHandler(userService.updateUser));

// Delete a user
router.delete('/user/:uuid', db, asyncHandler(userService.deleteUser));

// User login
router.post('/login', db, schema, asyncHandler(userService.loginUser));


module.exports = router;