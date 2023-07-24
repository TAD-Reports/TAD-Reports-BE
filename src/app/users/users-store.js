const TableConfig = require("../../configuration/userTableConfig");

class UserStore {
  constructor(db) {
    this.db = db;
    this.table = TableConfig.tableName;
    this.cols = TableConfig.columnNames;
  }

  async getUsername(username) {
    return await this.db("users").where("username", username).first();
  }

  async registerUser(body, hash) {
    return await this.db("users").insert({
      username: body.username,
      password: hash,
      firstname: body.firstname,
      lastname: body.lastname,
      region: body.region,
      role: body.role,
    });
  }

  async updateUser(uuid, body, hash) {
    return await this.db("users").where("UUID", uuid).update({
      username: body.username,
      password: hash,
      firstname: body.firstname,
      lastname: body.lastname,
      region: body.region,
      role: body.role,
      refresh_token: body.refresh_token,
      status: body.status,
    });
  }

  async updateRefreshToken(uuid, body, refreshtoken) {
    return await this.db("users").where("UUID", uuid).update({
      username: body.username,
      password: body.password,
      firstname: body.firstname,
      lastname: body.lastname,
      region: body.region,
      role: body.role,
      refresh_token: refreshtoken,
      status: body.status,
    });
  }

  async getUserByUUID(uuid) {
    return await this.db("users").select().where("UUID", uuid).first();
  }

  async getAll() {
    return await this.db("users").select();
  }

  async search(search) {
    const query = this.db(this.table)
      .select()
      .orderBy([{ column: this.cols.id, order: "asc" }]);
    if (search) {
      const columns = await this.db(this.table).columnInfo();
      query.andWhere((builder) => {
        builder.where((innerBuilder) => {
          Object.keys(columns).forEach((column) => {
            innerBuilder.orWhere(column, "like", `%${search}%`);
          });
        });
      });
    }
    const results = await query;
    return results;
  }

  // async deleteUser(uuid) {
  //   return await this.db('users')
  //     .where('UUID', uuid)
  //     .del();
  // }
}

module.exports = UserStore;
