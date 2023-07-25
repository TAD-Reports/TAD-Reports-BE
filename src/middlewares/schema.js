const db = require("./db");
const asyncHandler = require("express-async-handler");

const userDao =
  (db,
  asyncHandler(async (req, res, next) => {
    const hasTable = async () => {
      try {
        await req.db.raw("SELECT * FROM users LIMIT 1");
        return true;
      } catch (error) {
        return false;
      }
    };

    const createTable = async () => {
      try {
        await req.db.schema
          .createTable("users", async (table) => {
            table.increments("uuid").primary();
            table.string("username").notNullable().unique();
            table.string("password").notNullable();
            table.string("firstname").notNullable();
            table.string("lastname").notNullable();
            table.string("region").nullable();
            table.string("role").notNullable();
            table.string("refresh_token").nullable();
            table.integer("status").notNullable().defaultTo(1);
          })
          .createTable("nursery", (table) => {
            table.increments("uuid").primary();
            table.date("report_date").notNullable();
            table.string("nurseries").notNullable();
            table.string("funded_by").notNullable();
            table.string("region").notNullable();
            table.string("province").notNullable();
            table.string("district").nullable();
            table.string("municipality").notNullable();
            table.string("barangay").notNullable();
            table.date("birthdate").notNullable();
            table.integer("age").notNullable();
            table.string("name_of_cooperative_individual").notNullable();
            table.string("gender").notNullable();
            table.date("date_established").notNullable();
            table.double("area_in_hectares_ha").notNullable();
            table.string("variety_used").notNullable();
            table.integer("period_of_moa").notNullable();
            table.string("remarks").nullable();
            table.timestamps(true, true);
            table
              .integer("imported_by")
              .unsigned()
              .notNullable()
              .references("uuid")
              .inTable("users")
              .onDelete("RESTRICT");
          })
          .createTable("distribution", (table) => {
            table.increments("uuid").primary();
            table.date("report_date").notNullable();
            table.string("type_of_planting_materials").notNullable();
            table.string("name_of_cooperative_individual").notNullable();
            table.string("region").notNullable();
            table.string("province").notNullable();
            table.string("district").nullable();
            table.string("municipality").notNullable();
            table.string("barangay").notNullable();
            table
              .double("no_of_pm_available_during_establishment")
              .notNullable();
            table.string("variety").notNullable();
            table.double("no_of_pm_distributed").notNullable();
            table.string("name_of_recipient_bene").notNullable();
            table.string("address_of_beneficiary").notNullable();
            table.integer("age").notNullable();
            table.date("birthdate").notNullable();
            table.string("gender").notNullable();
            table.string("category").notNullable();
            table.string("remarks").nullable();
            table.timestamps(true, true);
            table
              .integer("imported_by")
              .unsigned()
              .notNullable()
              .references("uuid")
              .inTable("users")
              .onDelete("RESTRICT");
          })
          .createTable("pmsurvived", (table) => {
            table.increments("uuid").primary();
            table.date("report_date").notNullable();
            table.string("type_of_planting_materials").notNullable();
            table.string("name_of_cooperative_individual").notNullable();
            table.string("region").notNullable();
            table.string("province").notNullable();
            table.string("district").nullable();
            table.string("municipality").notNullable();
            table.string("barangay").notNullable();
            table
              .double("no_of_pm_available_during_establishment")
              .notNullable();
            table.string("variety").notNullable();
            table.date("birthdate").notNullable();
            table.integer("age").notNullable();
            table.string("gender").notNullable();
            table.date("date_received").notNullable();
            table.double("no_of_pm_planted").notNullable();
            table.double("no_of_pm_survived").notNullable();
            table.string("remarks").nullable();
            table.timestamps(true, true);
            table
              .integer("imported_by")
              .unsigned()
              .notNullable()
              .references("uuid")
              .inTable("users")
              .onDelete("RESTRICT");
          })
          .createTable("expansionandrehabilitation", (table) => {
            table.increments("uuid").primary();
            table.date("report_date").notNullable();
            table.string("name_of_fiber_crops").notNullable();
            table.string("region").notNullable();
            table.string("province").notNullable();
            table.string("district").nullable();
            table.string("municipality").notNullable();
            table.string("barangay").notNullable();
            table.string("name_of_beneficiary").notNullable();
            table.date("birthdate").notNullable();
            table.integer("age").notNullable();
            table.string("gender").notNullable();
            table.string("category").notNullable();
            table.double("area_planted_has").notNullable();
            table.string("variety").notNullable();
            table.string("source_of_pm").notNullable();
            table.string("remarks").nullable();
            table.timestamps(true, true);
            table
              .integer("imported_by")
              .unsigned()
              .notNullable()
              .references("uuid")
              .inTable("users")
              .onDelete("RESTRICT");
          })
          .createTable("cotton", (table) => {
            table.increments("uuid").primary();
            table.date("report_date").notNullable();
            table.string("name_of_beneficiary").notNullable();
            table.string("region").notNullable();
            table.string("province").notNullable();
            table.string("district").nullable();
            table.string("municipality").notNullable();
            table.string("barangay").notNullable();
            table.date("birthdate").notNullable();
            table.integer("age").notNullable();
            table.string("gender").notNullable();
            table.string("category").notNullable();
            table.double("quantity_of_cotton_seeds_given").notNullable();
            table.double("area_planted_ha").notNullable();
            table.date("date_planted").notNullable();
            table.double("seed_cotton_harvested").notNullable();
            table.string("variety").notNullable();
            table.string("remarks").nullable();
            table.timestamps(true, true);
            table
              .integer("imported_by")
              .unsigned()
              .notNullable()
              .references("uuid")
              .inTable("users")
              .onDelete("RESTRICT");
          })
          .createTable("cocoon", (table) => {
            table.increments("uuid").primary();
            table.date("report_date").notNullable();
            table
              .string("complete_name_of_cooperator_organization")
              .notNullable();
            table.string("region").notNullable();
            table.string("province").notNullable();
            table.string("district").nullable();
            table.string("municipality").notNullable();
            table.string("barangay").notNullable();
            table.integer("age").notNullable();
            table.date("birthdate").notNullable();
            table.string("gender").notNullable();
            table.string("category").notNullable();
            table.double("no_of_box_reared").notNullable();
            table.date("date_of_rearing").notNullable();
            table.double("total_production_in_kg").notNullable();
            table.double("value_in_php").notNullable();
            table.string("remarks").nullable();
            table.timestamps(true, true);
            table
              .integer("imported_by")
              .unsigned()
              .notNullable()
              .references("uuid")
              .inTable("users")
              .onDelete("RESTRICT");
          })
          .createTable("training", (table) => {
            table.increments("uuid").primary();
            table.date("report_date").notNullable();
            table.string("conduct_of_training").notNullable();
            table.string("region").notNullable();
            table.string("province").notNullable();
            table.string("district").nullable();
            table.string("municipality").notNullable();
            table.string("barangay").notNullable();
            table.string("gender").notNullable();
            table.string("age_group").notNullable();
            table.string("venue").notNullable();
            table.date("start_date").notNullable();
            table.date("end_date").notNullable();
            table.double("participants").notNullable();
            table.string("remarks").nullable();
            table.timestamps(true, true);
            table
              .integer("imported_by")
              .unsigned()
              .notNullable()
              .references("uuid")
              .inTable("users")
              .onDelete("RESTRICT");
          })
          .createTable("iecmaterials", (table) => {
            table.increments("uuid").primary();
            table.date("report_date").notNullable();
            table.string("title_of_iec_material").notNullable();
            table.double("no_of_copies_distributed").notNullable();
            table.string("region").notNullable();
            table.string("province").notNullable();
            table.string("district").nullable();
            table.string("municipality").notNullable();
            table.string("barangay").notNullable();
            table.string("gender").notNullable();
            table.string("category").notNullable();
            table.date("date_distributed").notNullable();
            table.string("remarks").nullable();
            table.timestamps(true, true);
            table
              .integer("imported_by")
              .unsigned()
              .notNullable()
              .references("uuid")
              .inTable("users")
              .onDelete("RESTRICT");
          })
          .createTable("abacadiseasemanagement", (table) => {
            table.increments("uuid").primary();
            table.date("report_date").notNullable();
            table.string("name_of_fiber_crops").notNullable();
            table.string("region").notNullable();
            table.string("province").notNullable();
            table.string("district").nullable();
            table.string("municipality").notNullable();
            table.string("barangay").notNullable();
            table.string("name_of_beneficiary").notNullable();
            table.string("gender").notNullable();
            table.string("category").notNullable();
            table.double("actual_area_ha").notNullable();
            table.string("effective_area").notNullable();
            table
              .double("disease_incidence_during_eradication_percentage")
              .notNullable();
            table.double("area_treated_eradicated").notNullable();
            table.date("date_eradicated").notNullable();
            table.string("remarks").nullable();
            table.timestamps(true, true);
            table
              .integer("imported_by")
              .unsigned()
              .notNullable()
              .references("uuid")
              .inTable("users")
              .onDelete("RESTRICT");
          })
          .createTable("coconutproject", (table) => {
            table.increments("uuid").primary();
            table.date("report_date").notNullable();
            table.string("name_of_fiber_crops").notNullable();
            table.string("region").notNullable();
            table.string("province").notNullable();
            table.string("district").nullable();
            table.string("municipality").notNullable();
            table.string("barangay").notNullable();
            table.string("name_of_beneficiary").notNullable();
            table.string("gender").notNullable();
            table.string("category").notNullable();
            table.double("area_planted_has").notNullable();
            table.string("variety").notNullable();
            table.double("no_of_seed_derived_pm_distributed").notNullable();
            table.string("remarks").nullable();
            table.timestamps(true, true);
            table
              .integer("imported_by")
              .unsigned()
              .notNullable()
              .references("uuid")
              .inTable("users")
              .onDelete("RESTRICT");
          })
          .createTable("jobpositions", (table) => {
            table.increments("uuid").primary();
            table.string("position_title").notNullable();
            table.string("plantilia_item_no").notNullable();
            table.string("salary_job_pay_grade").notNullable();
            table.double("monthly_salary").notNullable();
            table.string("education").nullable();
            table.string("training").notNullable();
            table.string("experience").notNullable();
            table.string("eligibility").notNullable();
            table.string("competency").nullable();
            table.string("place_of_assignment").notNullable();
            table.timestamps(true, true);
            table
              .integer("imported_by")
              .unsigned()
              .nullable()
              .references("uuid")
              .inTable("users")
              .onDelete("RESTRICT");
          })
          .createTable("applicant", (table) => {
            table.increments("uuid").primary();
            table.string("last_name").notNullable();
            table.string("first_name").notNullable();
            table.string("middle_name").nullable();
            table.string("suffix").nullable();
            table.string("position_applied").notNullable();
            table.string("salary_grade").notNullable();
            table.string("college_school").notNullable();
            table.string("college_year").notNullable();
            table.string("college_course").notNullable();
            table.string("masteral_school").notNullable();
            table.string("masteral_year").notNullable();
            table.string("masteral_course").notNullable();
            table.string("doctoral_school").notNullable();
            table.string("doctoral_year").notNullable();
            table.string("doctoral_course").notNullable();
            table.timestamps(true, true);
          })
          .createTable("attachments", (table) => {
            table.increments("uuid").primary();
            table.binary("pds").notNullable();
            table.binary("college").notNullable();
            table.binary("masteral").notNullable();
            table.binary("doctoral").notNullable();
            table.timestamps(true, true);
            table
              .integer("uploaded_by")
              .unsigned()
              .notNullable()
              .references("uuid")
              .inTable("applicant")
              .onDelete("CASCADE");
          })

          .createTable("eligibilities", (table) => {
            table.increments("uuid").primary();
            table.string("type").notNullable();
            table.string("file_name").notNullable();
            table.binary("file").notNullable();
            table.timestamps(true, true);
            table
              .integer("uploaded_by")
              .unsigned()
              .notNullable()
              .references("uuid")
              .inTable("applicant")
              .onDelete("CASCADE");
          })

          .createTable("logs", (table) => {
            table.increments("log_id").primary();
            table
              .integer("user_id")
              .unsigned()
              .references("uuid")
              .inTable("users")
              .onDelete("RESTRICT");
            table
              .enu("module", [
                "Authentication",
                "Nursery",
                "Distribution",
                "PM Survived",
                "Expansion and Rehabilitation",
                "Cotton",
                "Cocoon",
                "Training",
                "Iec Material",
                "Expansion Under Coconut Project",
                "Abaca Disease Management Project",
                "Job Positions",
              ])
              .notNullable();
            table.string("action").notNullable();
            table.json("data").nullable();
            table.string("ip_address").nullable();
            table.string("operating_system").nullable();
            table.string("session_id").nullable();
            table.text("user_agent").nullable();
            table.timestamps(true, true);
          });

        await req.db("users").insert([
          {
            username: "sa",
            password:
              "$2b$10$aoZz7ydLZrckRUJivZApvOKw5g8JYKMl4blpDlGib48Io651w166G",
            firstname: "Mark",
            lastname: "Salem",
            region: "all",
            role: "superadmin",
          },
          {
            username: "hr",
            password:
              "$2b$10$ZEvsCQvjjbfkD.Zmwac/AegakD9cDVknJPTK5onPl/STsXtaKxYFG",
            firstname: "Tony",
            lastname: "Start",
            region: "all",
            role: "hradmin",
          },
          {
            username: "pictu",
            password:
              "$2b$10$Kwfe69CG8eom.ueyw4DM3.1SxWwJsY8k7dpE53rhL8Txpq3hDprye",
            firstname: "Pictu",
            lastname: "Pictu",
            region: "all",
            role: "pictu",
          },
        ]);
      } catch (error) {
        console.error("Error creating user tables:", error);
        throw new Error("Error creating user tables");
      }
    };

    const main = async () => {
      try {
        if (!(await hasTable())) {
          await createTable();
        }
        req.userDao = userDao;
        next();
      } catch (error) {
        console.error("Error creating user tables:", error);
        return res.status(500).send({ error: "Error creating user tables" });
      }
    };

    main();
  }));

module.exports = userDao;
