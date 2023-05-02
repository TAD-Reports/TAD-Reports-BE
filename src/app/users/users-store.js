class UserStore {
  constructor(db) {
    this.db = db;
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

  async getUsername(username) {
    return await this.db('users')
      .where('username', username)
      .first();
  }

  async registerUser(user, hash) {
    return await this.db('users')
      .insert({
        USERNAME: user.username,
        PASSWORD: hash,
        FIRSTNAME: user.firstname,
        LASTNAME: user.lastname,
        EMAIL: user.email,
        ROLE: user.role
      });
  }

  async updateUser(uuid, user, hash) {
    return await this.db('users')
      .where('UUID', uuid)
      .update({
        USERNAME: user.username,
        PASSWORD: hash,
        FIRSTNAME: user.firstname,
        LASTNAME: user.lastname,
        EMAIL:user.email,
        ROLE: user.role
      });
  }


  async deleteUser(uuid) {
    return await this.db('users')
      .where('UUID', uuid)
      .del();
  }
}

module.exports = UserStore;