const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'philfida',
    database: 'tad'
  },
  pool: {
    min: 2,  // minimum number of connections
    max: 100, // maximum number of connections
    idleTimeoutMillis: 30000, // connection idle timeout in milliseconds
    createTimeoutMillis: 3000, // connection creation timeout in milliseconds
    acquireTimeoutMillis: 3000 // connection acquisition timeout in milliseconds
  }
});
