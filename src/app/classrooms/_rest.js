const express = require('express');
const auth = require('../../middlewares/auth');
const db = require('../../middlewares/db');
const schema = require('../../middlewares/schema');
const asyncHandler = require('express-async-handler');
const ClassroomService = require('./classroom-service');

const classroomService = new ClassroomService();
const router = express.Router();

// Get Classroom
router.get('/classroom/:uuid', db, auth, asyncHandler(classroomService.getClassroom));

// Get all Classroom
router.get('/classrooms', db, auth, asyncHandler(classroomService.getClassrooms));

// Add new Classroom
router.post('/classroom', db, auth, asyncHandler(classroomService.addClassroom));

// Update Classroom by ID
router.put('/classroom/:uuid', db, auth, asyncHandler(classroomService.updateClassroom));

module.exports = router;