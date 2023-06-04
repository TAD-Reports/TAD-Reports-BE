const { query } = require('express');
class LogsStore {
  constructor(db) {
    this.db = db;
  }

  async add(body) {
    await this.db('logs').insert({
      user_id: body.uuid,
      module: body.module,
      action: body.action,
      data: body.data,
      ip_address: body.ip,
      operating_system: body.os,
      session_id: body.sessionId,
      user_agent: body.userAgent,
    });
  }
}

module.exports = LogsStore;
