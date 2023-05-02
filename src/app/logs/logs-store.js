class LogsStore {
  constructor(db) {
    this.db = db;
  }

  async registerLogs(uuid) {
    await this.db('logs')
      .insert({
        created_acc_at: this.db.fn.now(),
        user_id: uuid
      });
  }


  async userUpdateLogs(uuid) {
    await this.db('logs')
      .where({user_id: uuid})
      .update({updated_acc_at: this.db.fn.now()});
  }

  
  async loginLogs(uuid) {
    await this.db('logs')
      .where({user_id: uuid})
      .update({logged_in_at: this.db.fn.now()});
  }


  async addClassLogs(uuid, userId) {
    await this.db('logs')
      .where({user_id: userId})
      .update({
        add_classroom_at: this.db.fn.now(),
        class_id: uuid
      });
  }

  async classUpdateLogs(uuid) {
    await this.db('logs')
      .where({class_id: uuid})
      .update({update_classroom_at: this.db.fn.now()});
  }


}



module.exports = LogsStore;