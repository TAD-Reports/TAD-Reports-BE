class LogsStore {
  constructor(db) {
    this.db = db;
  }

  async add(body) {
    await this.db('logs')
      .insert({
        user_id: body.uuid,
        module: body.module,
        data: body.data,
        action: body.action,
        ip_address: body.ip,
        operating_system: body.os,
        session_id: body.sessionId,
        user_agent: body.userAgent,
      });
  }
}

module.exports = LogsStore;
