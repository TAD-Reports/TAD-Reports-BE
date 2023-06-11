const { query } = require("express");
const moment = require("moment-timezone");
const TableConfig = require("../../../configuration/jobappConfig/applicantTableConfig");

class AppFormStore {
  constructor(db) {
    this.db = db;
    this.table = TableConfig.tableName;
    this.cols = TableConfig.columnNames;
  }

  async add(body) {
    await this.db(this.table).insert({
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

  async update(uuid, body) {
    // Perform the update operation
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
    const convertedResults = convertDatesToTimezone(results, [
      this.cols.reportDate,
      this.cols.establishedDate,
    ]);
    return convertedResults;
  }

  async getAll() {
    const results = await this.db(this.table)
      .select()
      .orderBy([
        { column: this.cols.region },
        { column: this.cols.reportDate, order: "desc" },
      ]);
    const convertedResults = convertDatesToTimezone(results, [
      this.cols.reportDate,
      this.cols.establishedDate,
    ]);
    return convertedResults;
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

  async getTotalGraph(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = firstDateOfMonth(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const query = this.db(this.table)
      .select(`${this.cols.fundedBy} as name`)
      .sum(`${this.cols.area} as total`)
      .groupBy(this.cols.fundedBy);
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
    return await query;
  }

  async getMonthGraph(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = firstDateOfMonth(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const query = this.db(this.table)
      .select(this.cols.fundedBy)
      .select(
        this.db.raw(
          `CONCAT(MONTHNAME(report_date), YEAR(report_date)) AS month_year`
        )
      )
      .sum(`${this.cols.area} AS area`)
      .groupBy(
        this.cols.fundedBy,
        this.db.raw(`CONCAT(MONTHNAME(report_date), YEAR(report_date))`)
      );

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

    const formattedResult = await query.then((rows) => {
      const formattedData = rows.reduce((acc, curr) => {
        const index = acc.findIndex((item) => item.name === curr.funded_by);
        if (index !== -1) {
          acc[index].months[curr.month_year] = curr.area;
        } else {
          acc.push({
            name: curr.funded_by,
            months: {
              [curr.month_year]: curr.area,
            },
          });
        }
        return acc;
      }, []);

      return formattedData;
    });

    return formattedResult;
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

function firstDateOfMonth(date) {
  const firstDate = moment(date).startOf("month").format("YYYY-MM-DD");
  return firstDate;
}

function lastDateOfMonth(date) {
  const lastDate = moment(date).endOf("month").format("YYYY-MM-DD");
  return lastDate;
}

module.exports = AppFormStore;

//SELECT * FROM accounts WHERE username like %:match% OR role like %:match%"
