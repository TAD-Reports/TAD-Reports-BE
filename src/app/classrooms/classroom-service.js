const ClassroomStore = require('./classroom-store');
const LogsStore = require('../logs/logs-store');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class ClassroomService {
  constructor(classroomStore) {
  }


// Add new Classroom  
  async addClassroom(req, res) {
    const classroomStore = new ClassroomStore(req.db);
    const logsStore = new LogsStore(req.db);
    const classroom = req.body;
    // Get user ID using auth
    const userId = req.auth.id;
    try{
      // Create new classroom
      const result = await classroomStore.addClassroom(classroom, userId);
      const uuid = result[0];
      
      // Create logs
      await logsStore.addClassLogs(uuid, userId);
      return res.status(201).send({
        success: true,
        message: 'Adding classroom successful',
        data: {
          classID: uuid,
          ...classroom
        }
      })
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Error adding a classroom',
        error: error
      })
    }
  }


// Get Classroom by ID
    async getClassroom(req, res) {
      const classroomStore = new ClassroomStore(req.db);
      const uuid = req.params.uuid;
      const classroom = await classroomStore.getClassroomByUUID(uuid);
      if (!classroom) {
        return res.status(404).send({
          success: false,
          message: 'Classroom not found'
        });
      }
      return res.status(200).send({
        success: true,
        data: classroom
      });
    }


// Get all Classroom
    async getClassrooms(req, res) {
      const classroomStore = new ClassroomStore(req.db);
      try{
        const classroom = await classroomStore.getAllClassrooms();
        return res.status(200).send({
          success: true,
          data: classroom
        })
      } catch (error) {
        return res.status(500).send({
          success: false,
          message: 'Error fetching classrooms',
          error: error
        });
      }
    }


// Update Classroom by ID
    async updateClassroom(req, res) {
      const classroomStore = new ClassroomStore(req.db);
      const logsStore = new LogsStore(req.db);
      const uuid = req.params.uuid;
      const classroom = req.body;
      const id = await classroomStore.getClassroomByUUID(uuid);
      if (!id) {
        return res.status(404).send({
          success: false,
          message: 'Classroom not found'
        });
      }
      try {
        const result = classroomStore.updateClassroom(uuid, classroom);
        if (result === 0 ) {
          return res.status(400).send({
            success: false,
            message: 'Classroom not found'
          });
        }
        // Create logs
        await logsStore.classUpdateLogs(uuid);
      } catch (error) {
        return res.status(500).send({
          success: false,
          message: 'Error updating classroom',
          error: error
        });
      }
      return res.status(200).send({
        success: true,
        data: {
          uuid, ...classroom
        }
      });
    }
}

module.exports = ClassroomService;