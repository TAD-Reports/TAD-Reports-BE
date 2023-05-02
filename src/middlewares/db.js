const db = (req, res, next) => {
  const knex = require('knex')({
    client: 'mysql',
    connection: {
      host : '127.0.0.1',
      port : 3306,
      user : 'root',
      password : '',
      database : 'konek'
    }
  });
  req.db = knex;
  next();
};

module.exports = db;