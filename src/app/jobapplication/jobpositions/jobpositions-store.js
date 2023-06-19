const { query } = require("express");
const moment = require("moment-timezone");
const TableConfig = require("../../../configuration/jobappConfig/jobPositionConfig");

class PositionsStore {
  constructor(db) {
    this.db = db;
    this.table = TableConfig.tableName;
    this.cols = TableConfig.columnNames;
  }

  //Add
  async add(body) {
    return await this.db(this.table).insert({
      position_title: body.positionTitle,
      plantilia_item_no: body.plantiliaItemNo,
      salary_job_pay_grade: body.salaryJobPayGrade,
      monthly_salary: body.monthlySalary,
      education: body.education,
      training: body.training,
      experience: body.experience,
      eligibility: body.eligibility,
      competency: body.competency,
      place_of_assignment: body.placeOfAssignment,
    });
  }

  async update(uuid, body) {
    // Perform the update operation
    await this.db(this.table).where(this.cols.id, uuid).update({
      position_title: body.positionTitle,
      plantilia_item_no: body.plantiliaItemNo,
      salary_job_pay_grade: body.salaryJobPayGrade,
      monthly_salary: body.monthlySalary,
      education: body.education,
      training: body.training,
      experience: body.experience,
      eligibility: body.eligibility,
      competency: body.competency,
      place_of_assignment: body.placeOfAssignment,
    });
    const updatedRows = await this.db(this.table)
      .where(this.cols.uuid, uuid)
      .select("*")
      .first();

    return updatedRows;
  }

  // async getExisting(row) {
  //   const excludedFields = ["District", "Remarks"];
  //   const query = this.db(this.table);
  //   for (const [column, value] of Object.entries(row)) {
  //     const columnName = column.toLowerCase().replace(/ /g, '_').replace('/', '').replace('(', '').replace(')', '');
  //     if (!excludedFields.includes(column)) {
  //       query.where(columnName, value);
  //     }
  //   }
  //   const existingRows = await query.select('*');
  //   return existingRows.length > 0 ? existingRows : null;
  // }

  async getByUUID(uuid) {
    const results = await this.db(this.table)
      .select()
      .where(this.cols.id, uuid);
    return convertedResults;
  }

  async getAll() {
    const results = await this.db(this.table)
      .select()
      .orderBy([
        { column: this.cols.region },
        { column: this.cols.reportDate, order: "desc" },
      ]);

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

  async search(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = firstDateOfMonth(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const query = this.db(this.table)
      .select()
      .orderBy([
        { column: this.cols.region },
        { column: this.cols.reportDate, order: "desc" },
      ]);
    if (startDate && endDate) {
      query.whereBetween(this.cols.reportDate, [
        formattedStartDate,
        formattedEndDate,
      ]);
    } else {
      query.whereBetween(this.cols.reportDate, [firstDate, lastDate]);
    }
    if (region) {
      query.where(this.cols.region, region);
    }
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
    const convertedResults = convertDatesToTimezone(
      results.map((row) => row),
      [this.cols.reportDate, this.cols.establishedDate]
    );
    return convertedResults;
  }
}

module.exports = PositionsStore;

//SELECT * FROM accounts WHERE username like %:match% OR role like %:match%"
