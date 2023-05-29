class UserStore {
  constructor(db) {
    this.db = db;
  }

  async getUsername(username) {
    return await this.db('users')
      .where('username', username)
      .first();
  }

  async registerUser(body, hash) {
    return await this.db('users')
      .insert({
        username: body.username,
        password: hash,
        firstname: body.firstname,
        lastname: body.lastname,
        region: body.region,
        role: body.role
      });
  }

  async updateUser(uuid, body, hash) {
    return await this.db('users')
      .where('UUID', uuid)
      .update({
        username: body.username,
        password: hash,
        firstname: body.firstname,
        lastname: body.lastname,
        region: body.region,
        role: body.role,
        status: body.status
      });
  }

  async getUserByUUID(uuid) {
    return await this.db('users')
      .select()
      .where('UUID', uuid)
      .first();
  }

  async getAllUsers() {
    return await this.db('users')
      .select();
  }

  // async deleteUser(uuid) {
  //   return await this.db('users')
  //     .where('UUID', uuid)
  //     .del();
  // }
}

module.exports = UserStore;