const { query } = require("express");
const moment = require("moment-timezone");
const TableConfig = require("../../../configuration/jobappConfig/JobApplication/applicantTableConfig");
const AttachmentsTableConfig = require("../../../configuration/jobappConfig/JobApplication/attachmentsTableConfig");
const EligibilitiesTableConfig = require("../../../configuration/jobappConfig/JobApplication/eligibilitiesTableConfig");

class AppFormStore {
  constructor(db) {
    this.db = db;
    this.table = TableConfig.tableName;
    this.attachmentsTable = AttachmentsTableConfig.tableName;
    this.eligibilitiesTable = EligibilitiesTableConfig.tableName;
    this.cols = TableConfig.columnNames;
    this.attachcols = AttachmentsTableConfig.columnNames;
    this.eligibscols = EligibilitiesTableConfig.columnNames;
  }

  async add(body, attachments, eligibility) {
    const [uuid] = await this.db(this.table).insert({
      last_name: body.lastName,
      first_name: body.firstName,
      middle_name: body.middleName,
      suffix: body.suffix,
      position_applied: body.positionApplied,
      salary_grade: body.salaryGrade,
      college_school: body.collegeSchool,
      college_year: body.collegeYear,
      college_course: body.collegeCourse,
      masteral_school: body.masteralSchool,
      masteral_year: body.masteralYear,
      masteral_course: body.masteralCourse,
      doctoral_school: body.doctoralSchool,
      doctoral_year: body.doctoralYear,
      doctoral_course: body.doctoralCourse,
    });

    await this.db(this.attachmentsTable).insert({
      uploaded_by: uuid,
      pds: attachments.pds.buffer,
      college: attachments.college.buffer,
      masteral: attachments.masteral.buffer,
      doctoral: attachments.doctoral.buffer,
    });

    await this.db(this.eligibilitiesTable).insert({
      uploaded_by: uuid,
      type: eligibility.type,
      file_name: eligibility.fileName,
      file: eligibility.file.buffer,
    });

    return this.getExisting(body);
  }

  async getExisting(body) {
    const result = await this.db(this.table)
      .select("*")
      .where(this.cols.firstName, body.firstName)
      .andWhere(this.cols.lastName, body.lastName)
      .andWhere(this.cols.middleName, body.middleName)
      .andWhere(this.cols.suffix, body.suffix)
      .first();

    return result;
  }

  async update(uuid, body, attachments, eligibility) {
    await this.db(this.table).where(this.cols.id, uuid).update({
      last_name: body.lastName,
      first_name: body.firstName,
      middle_name: body.middleName,
      suffix: body.suffix,
      position_applied: body.positionApplied,
      salary_grade: body.salaryGrade,
      college_school: body.collegeSchool,
      college_year: body.collegeYear,
      college_course: body.collegeCourse,
      masteral_school: body.masteralSchool,
      masteral_year: body.masteralYear,
      masteral_course: body.masteralCourse,
      doctoral_school: body.doctoralSchool,
      doctoral_year: body.doctoralYear,
      doctoral_course: body.doctoralCourse,
    });

    await this.db(this.attachmentsTable)
      .where(this.attachcols.uploadedBy, uuid)
      .update({
        uploaded_by: uuid,
        pds: attachments.pds.buffer,
        college: attachments.college.buffer,
        masteral: attachments.masteral.buffer,
        doctoral: attachments.doctoral.buffer,
      });

    await this.db(this.eligibilitiesTable)
      .where(this.eligibscols.uploadedBy, uuid)
      .update({
        type: eligibility.type,
        file_name: eligibility.fileName,
        file: eligibility.file.buffer,
        uploaded_by: uuid,
      });

    // Fetch the updated rows
    const updatedRows = await this.db(this.table)
      .where(this.cols.id, uuid)
      .select("*")
      .first();

    return updatedRows;
  }

  async attachments(body) {
    return await this.db("attachments").insert({
      pds: body.pds,
      college: body.college,
      masteral: body.masteral,
      doctoral: body.doctoral,
    });
  }

  async eligibilities(body) {
    return await this.db("eligibilities").insert({
      file_name: body.fileName,
      file: body.file,
    });
  }

  async getByUUID(uuid) {
    const results = await this.db(this.table)
      .select()
      .where(this.cols.id, uuid);
    return results;
  }

  async getAll() {
    const results = await this.db(this.table).select();
    return results;
  }

  async delete(uuid) {
    const deletedRows = await this.db(this.table)
      .where(this.cols.id, uuid)
      .select("*")
      .first();
    await this.db(this.table).where(this.cols.id, uuid).del();
    return deletedRows;
  }

  async getMaxDate() {
    const result = await this.db(this.table)
      .max(`${this.cols.reportDate} as max_date`)
      .first();
    const convertedResults = convertDatesToTimezone([result], ["max_date"]);
    return convertedResults[0].max_date;
  }

  async search(search) {
    const query = this.db(this.table).select();
    if (search) {
      const columns = await this.db(this.table).columnInfo(); // Retrieve column information
      query.andWhere((builder) => {
        builder.where((innerBuilder) => {
          Object.keys(columns).forEach((column) => {
            innerBuilder.orWhere(column, "like", `%${search}%`);
          });
        });
      });
    }
    const results = await query; // Execute the query and retrieve the results
    return results;
  }
}

function formatDate(dateString) {
  const date = moment(dateString, "YYYY/MM/DD", true); // Use moment.js to parse the date
  if (!date.isValid()) {
    console.log("Invalid Date! Use this format YYYY/MM/DD");
    return "";
  }
  return date.format("YYYY-MM-DD");
}

function convertDatesToTimezone(rows, dateFields) {
  return rows.map((row) => {
    const convertedFields = {};
    dateFields.forEach((field) => {
      const convertedDate = moment
        .utc(row[field])
        .tz("Asia/Singapore")
        .format("YYYY-MM-DD");
      convertedFields[field] = convertedDate;
    });
    return { ...row, ...convertedFields };
  });
}

module.exports = AppFormStore;

//SELECT * FROM accounts WHERE username like %:match% OR role like %:match%"
