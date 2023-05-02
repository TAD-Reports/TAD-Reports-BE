const express = require('express');
const auth = require('../../middlewares/auth');
const db = require('../../middlewares/db');
const schema = require('../../middlewares/schema');
const asyncHandler = require('express-async-handler');
const UserService = require('./users-service');
//const UserService = require('./users-service');
//const { restart } = require('nodemon');

const userService = new UserService();
const router = express.Router();

// Get user by ID
router.get('/user/:uuid', db, auth, asyncHandler(userService.getUser));

// Get all users
router.get('/users', db, auth, asyncHandler(userService.getUsers));

// Update user info
router.put('/user/:uuid', db, auth, asyncHandler(userService.updateUser));

// Delete a user
router.delete('/user/:uuid', db, auth, asyncHandler(userService.deleteUser));

// Register new user
router.post('/register', db, schema, asyncHandler (userService.addUser));

// User login
router.post('/login', db, schema, asyncHandler(userService.loginUser));


module.exports = router;