const db = require('./db');
const asyncHandler = require('express-async-handler');

const userDao = (db, asyncHandler(async (req, res, next) => {
  const hasTable = async () => {
    try {
      await req.db.raw("SELECT * FROM users LIMIT 1")
      return true;
    } catch (error) {
      return false;
    }
  }
  
  const createTable = async () => {
    try {
      await req.db.schema.createTable('users', async (table) => {
        table.increments('uuid').primary();
        table.string('username').notNullable().unique();
        table.string('password').notNullable();
        table.string('firstname').notNullable();
        table.string('lastname').notNullable();
        table.string('role').notNullable();

      }).createTable('nursery', (table) => {
        table.increments('uuid').primary();
        table.date('report_date').notNullable();
        table.string('funded_by').notNullable();
        table.string('region').notNullable();
        table.string('province').notNullable();
        table.string('district').nullable();
        table.string('municipality').notNullable();
        table.string('barangay').notNullable();
        table.string('cooperative_name').notNullable();
        table.date('established_date').notNullable();
        table.double('area_in_has').notNullable();
        table.string('variety').notNullable();
        table.integer('moa_period').notNullable();
        table.integer('status').notNullable().defaultTo(1);
        table.timestamps(true, true);
        table.integer('import_by')
        .unsigned()
        .notNullable()
        .references('uuid')
        .inTable('users')
        .onDelete('CASCADE');

        }).createTable('distribution', (table) => {
        table.increments('uuid').primary();
        table.date('report_date').notNullable();
        table.string('type').notNullable();
        table.string('cooperative_name').notNullable();
        table.string('region').notNullable();
        table.string('province').notNullable();
        table.string('district').nullable();
        table.string('municipality').notNullable();
        table.string('barangay').notNullable();
        table.integer('establishment_no_of_pm').notNullable();
        table.string('variety').notNullable();
        table.integer('distributed_no_of_pm').notNullable();
        table.string('recipient_name').notNullable();
        table.string('beneficiary_address').notNullable();
        table.string('gender').notNullable();
        table.string('category').notNullable();
        table.integer('status').notNullable().defaultTo(1);
        table.timestamps(true, true);
        table.integer('import_by')
        .unsigned()
        .notNullable()
        .references('uuid')
        .inTable('users')
        .onDelete('CASCADE');

      }).createTable('classrooms', async(table) => {
        table.increments('uuid').primary();
        table.string('subject').notNullable();
        table.string('description').notNullable();
        table.integer('status').notNullable().defaultTo(1);
        table.integer('created_by')
        .unsigned()
        .notNullable()
        .references('uuid')
        .inTable('users')
        .onDelete('CASCADE');

      }).createTable('logs', async (table) => {
        table.increments('log_id').primary();
        table.timestamp('created_acc_at').nullable();
        table.timestamp('updated_acc_at').nullable();
        table.timestamp('logged_in_at').nullable();
        table.timestamp('logged_out_at').nullable();
        table.timestamp('joined_room_at').nullable();
        table.timestamp('left_room_at').nullable();
        table.timestamp('created_quiz_at').nullable();
        table.timestamp('submitted_at').nullable();
        table.timestamp('add_classroom_at').nullable();
        table.timestamp('update_classroom_at').nullable();
        table.integer('user_id')
        .unsigned()
        .notNullable()
        .references('uuid')
        .inTable('users')
        .onDelete('CASCADE');
        table.integer('class_id')
        .unsigned()
        .nullable()
        .references('uuid')
        .inTable('classrooms')
        .onDelete('CASCADE');
      });
    } catch (error) {
      return res.status(500).send({ 
        error: 'Error creating user tables' 
      });
    }
  }

  const main = async () => {
    if (!await hasTable()) {
      await createTable();
    }
    req.userDao = userDao;
    next();
  }

  main();
}));

module.exports=userDao;
