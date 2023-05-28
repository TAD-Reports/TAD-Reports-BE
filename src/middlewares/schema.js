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
        table.string('region').nullable();
        table.string('role').notNullable();

      }).createTable('nursery', (table) => {
        table.increments('uuid').primary();
        table.date('report_date').notNullable();
        table.string('nurseries').notNullable();
        table.string('funded_by').notNullable();
        table.string('region').notNullable();
        table.string('province').notNullable();
        table.string('district').nullable();
        table.string('municipality').notNullable();
        table.string('barangay').notNullable();
        table.string('complete_name_of_cooperator_organization').notNullable();
        table.date('date_established').notNullable();
        table.double('area_in_hectares_ha').notNullable();
        table.string('variety_used').notNullable();
        table.integer('period_of_moa').notNullable();
        table.string('remarks').nullable();
        table.integer('status').notNullable().defaultTo(1);
        table.timestamps(true, true);
        table.integer('imported_by')
          .unsigned()
          .notNullable()
          .references('uuid')
          .inTable('users')
          .onDelete('CASCADE');

      }).createTable('distribution', (table) => {
        table.increments('uuid').primary();
        table.date('report_date').notNullable();
        table.string('type_of_planting_materials').notNullable();
        table.string('name_of_cooperative_individual').notNullable();
        table.string('region').notNullable();
        table.string('province').notNullable();
        table.string('district').nullable();
        table.string('municipality').notNullable();
        table.string('barangay').notNullable();
        table.integer('no_of_pm_available_during_establishment').notNullable();
        table.string('variety').notNullable();
        table.integer('no_of_pm_distributed').notNullable();
        table.string('name_of_recipient_bene').notNullable();
        table.string('address_of_beneficiary').notNullable();
        table.string('gender').notNullable();
        table.string('category').notNullable();
        table.string('remarks').nullable();
        table.integer('status').notNullable().defaultTo(1);
        table.timestamps(true, true);
        table.integer('imported_by')
          .unsigned()
          .notNullable()
          .references('uuid')
          .inTable('users')
          .onDelete('CASCADE');

      }).createTable('pmsurvived', (table) => {
        table.increments('uuid').primary();
        table.date('report_date').notNullable();
        table.string('type_of_planting_materials').notNullable();
        table.string('name_of_cooperator_individual').notNullable();
        table.string('region').notNullable();
        table.string('province').notNullable();
        table.string('district').nullable();
        table.string('municipality').notNullable();
        table.string('barangay').notNullable();
        table.integer('number_of_pm_available_during_establishment').notNullable();
        table.string('variety').notNullable();
        table.date('date_received').notNullable();
        table.integer('number_of_pm_planted').notNullable();
        table.integer('number_of_pm_survived').notNullable();
        table.string('remarks').nullable();
        table.integer('status').notNullable().defaultTo(1);
        table.timestamps(true, true);
        table.integer('imported_by')
          .unsigned()
          .notNullable()
          .references('uuid')
          .inTable('users')
          .onDelete('CASCADE');

      }).createTable('classrooms', async (table) => {
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

      await req.db('users').insert({
        username: 'superadmin',
        password: '$2b$10$ISpxoyTQgNqOzUGNAU4r6.Fn9.q4NU8.YGJtkIBNhLeFEkKewqsya',
        firstname: 'Ray',
        lastname: 'Ray',
        region: 'all',
        role: 'superadmin'
      });


    } catch (error) {
      console.error('Error creating user tables:', error);
      throw new Error('Error creating user tables');
    }
  };

  const main = async () => {
    try {
      if (!await hasTable()) {
        await createTable();
      }
      req.userDao = userDao;
      next();
    } catch (error) {
      console.error('Error creating user tables:', error);
      return res.status(500).send({ error: 'Error creating user tables' });
    }
  };

  main();
}));

module.exports = userDao;
