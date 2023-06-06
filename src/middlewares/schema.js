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
        table.integer('status').notNullable().defaultTo(1);

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
        table.timestamps(true, true);
        table.integer('imported_by')
          .unsigned()
          .notNullable()
          .references('uuid')
          .inTable('users')
          .onDelete('RESTRICT');

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
        table.timestamps(true, true);
        table.integer('imported_by')
          .unsigned()
          .notNullable()
          .references('uuid')
          .inTable('users')
          .onDelete('RESTRICT');

      }).createTable('pmsurvived', (table) => {
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
        table.date('date_received').notNullable();
        table.integer('no_of_pm_planted').notNullable();
        table.integer('no_of_pm_survived').notNullable();
        table.string('remarks').nullable();
        table.timestamps(true, true);
        table.integer('imported_by')
          .unsigned()
          .notNullable()
          .references('uuid')
          .inTable('users')
          .onDelete('RESTRICT');

      }).createTable('training', (table) => {
        table.increments('uuid').primary();
        table.date('report_date').notNullable();
        table.string('conduct_of_training').notNullable();
        table.string('region').notNullable();
        table.string('province').notNullable();
        table.string('district').nullable();
        table.string('municipality').notNullable();
        table.string('barangay').notNullable();
        table.string('gender').notNullable();
        table.string('age_group').notNullable();
        table.string('venue').notNullable();
        table.date('start_date').notNullable();
        table.date('end_date').notNullable();
        table.integer('participants').notNullable();
        table.string('remarks').nullable();
        table.timestamps(true, true);
        table.integer('imported_by')
          .unsigned()
          .notNullable()
          .references('uuid')
          .inTable('users')
          .onDelete('RESTRICT');

      }).createTable('logs', (table) => {
        table.increments('log_id').primary();
        table.integer('user_id').unsigned().references('uuid').inTable('users').onDelete('RESTRICT');
        table.enu('module',
          ['Authentication',
            'Nursery',
            'Distribution',
            'PM Survived',
            'Expantion and Rehabilitation',
            'Cotton',
            'Cocoon',
            'Training',
            'Iec Material',
            'Expansion Under Coconut Project',
            'Abaca Disease Management Project']).notNullable();
        table.string('action').notNullable();
        table.json('data').nullable();
        table.string('ip_address').nullable();
        table.string('operating_system').nullable();
        table.string('session_id').nullable();
        table.text('user_agent').nullable();
        table.timestamps(true, true);
      });

      await req.db('users').insert({
        username: 'sa',
        password: '$2b$10$aoZz7ydLZrckRUJivZApvOKw5g8JYKMl4blpDlGib48Io651w166G',
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
