class ClassroomStore {
  constructor(db) {
    this.db = db;
  }

  async addClassroom(classroom, userId) {
    return await this.db('classrooms')
      .insert({
        subject: classroom.subject,
        description: classroom.description,
        created_by: userId
      });
  }

  async getClassroomByUUID(uuid) {
    return await this.db('classrooms')
      .select()
      .where('UUID', uuid)
      .first();
  }

  async getAllClassrooms() {
    return await this.db('classrooms')
      .select();
  }

  async updateClassroom(uuid, classroom) {
    return await this.db('classrooms')
      .where('UUID', uuid)
      .update({
        subject: classroom.subject,
        description: classroom.description,
        status: classroom.status
      });
  }
}

module.exports = ClassroomStore;