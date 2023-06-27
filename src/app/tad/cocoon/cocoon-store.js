const { query } = require('express');
const moment = require('moment-timezone');
const TableConfig = require("../../../configuration/cocoonTableConfig");

class CocoonStore {
  constructor(db) {
    this.db = db;
    this.table = TableConfig.tableName;
    this.cols = TableConfig.columnNames;
  }

  async add(row) {
    return await this.db(this.table).insert({
      report_date: row["Report Date"],
      complete_name_of_cooperator_organization:
        row["Complete Name of Cooperator/ Organization"],
      region: row["Region"],
      province: row["Province"],
      district: row["District"],
      municipality: row["Municipality"],
      barangay: row["Barangay"],
      gender: row["Gender"],
      category: row["Category"],
      no_of_box_reared: row["No. of Box Reared"],
      date_of_rearing: row["Date of Rearing"],
      total_production_in_kg: row["Total Production in Kg"],
      value_in_php: row["Value In Php"],
      imported_by: row.imported_by, // Assign the import_by field from the row object
    });
  }

  async update(uuid, body) {
    // Perform the update operation
    await this.db(this.table).where(this.cols.id, uuid).update({
      report_date: body.report_date,
      complete_name_of_cooperator_organization:
        body.complete_name_of_cooperator_organization,
      region: body.region,
      province: body.province,
      district: body.district,
      municipality: body.municipality,
      barangay: body.barangay,
      gender: body.gender,
      category: body.category,
      no_of_box_reared: body.no_of_box_reared,
      date_of_rearing: body.date_of_rearing,
      total_production_in_kg: body.total_production_in_kg,
      value_in_php: body.value_in_php,
    });

    // Fetch the updated rows
    const updatedRows = await this.db(this.table)
      .where(this.cols.id, uuid)
      .select("*")
      .first();

    return updatedRows;
  }

  async getExisting(row) {
    const excludedFields = ["imported_by", "District"];
    const query = this.db(this.table);
    for (const [column, value] of Object.entries(row)) {
      const columnName = column
        .toLowerCase()
        .replace(/ /g, "_")
        .replace("/", "")
        .replace("(", "")
        .replace(")", "")
        .replace(".", "");
      if (!excludedFields.includes(column)) {
        query.where(columnName, value);
      }
    }
    const existingRows = await query.select("*");
    return existingRows.length > 0 ? existingRows : null;
  }

  async getByUUID(uuid) {
    const results = await this.db(this.table)
      .select()
      .where(this.cols.id, uuid);
    const convertedResults = convertDatesToTimezone(results, [
      this.cols.reportDate,
      this.dateOfRearing,
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
    if (!results) {
      return null;
    }
    const convertedResults = convertDatesToTimezone(results, [
      this.cols.reportDate,
      this.dateOfRearing,
    ]);
    const columnNames = await this.db(this.table)
      .columnInfo()
      .then((columns) => Object.keys(columns));
    return results.length > 0 ? convertedResults : { columnNames };
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
    if (result.max_date === null) {
      return null;
    }
    const convertedResults = convertDatesToTimezone([result], ["max_date"]);
    return convertedResults[0].max_date;
  }

  async getGraph(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = firstDateOfMonth(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const query = this.db(this.table)
      .select(this.cols.category)
      .select(
        this.db.raw(
          `CONCAT(MONTHNAME(report_date), YEAR(report_date)) AS month_year`
        )
      )
      .sum(`${this.cols.totalProductionInKg} AS total_production`)
      .groupBy(
        this.cols.category,
        this.db.raw(`CONCAT(MONTHNAME(report_date), YEAR(report_date))`),
        this.cols.reportDate
      )
      .orderBy(this.cols.reportDate);
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
        const index = acc.findIndex((item) => item.name === curr.category);
        if (index !== -1) {
          acc[index].months[curr.month_year] = curr.total_production;
        } else {
          acc.push({
            name: curr.category,
            months: {
              [curr.month_year]: curr.total_production,
            },
          });
        }
        return acc;
      }, []);
      const updatedFormattedData = formattedData.map((item) => {
        const months = item.months;
        const total = Object.values(months).reduce(
          (acc, value) => acc + parseInt(value),
          0
        );
        return { ...item, months: { ...months, total } };
      });
      return updatedFormattedData;
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
    if (!maxDate) {
      return [];
    }
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
      [this.cols.reportDate, this.cols.dateOfRearing]
    );
    return convertedResults;
  }

  async totalBeneficiary(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = firstDateOfMonth(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const result = await this.db(this.table)
      .count(`${this.cols.completeNameOfCooperatorOrganization} AS count`)
      .where((query) => {
        if (!maxDate) {
          query.whereRaw("false");
        } else if (startDate && endDate) {
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
          query.andWhere((builder) => {
            Object.values(this.cols).forEach((column) => {
              builder.orWhere(column, "like", `%${search}%`);
            });
          });
        }
      })
      .first();
    const count = result ? result.count : 0;
    return count;
  }
}

function formatDate(dateString) {
  const date = moment(dateString, 'YYYY/MM/DD', true); // Use moment.js to parse the date
  if (!date.isValid()) {
    console.log("Invalid Date! Use this format YYYY/MM/DD");
    return ("");
  }
  return date.format('YYYY-MM-DD');
}

function convertDatesToTimezone(rows, dateFields) {
  return rows.map(row => {
    const convertedFields = {};
    dateFields.forEach(field => {
      const convertedDate = moment.utc(row[field]).tz('Asia/Singapore').format('YYYY-MM-DD');
      convertedFields[field] = convertedDate;
    });
    return { ...row, ...convertedFields };
  });
}

function firstDateOfMonth(date) {
  const firstDate = moment(date).startOf('month').format('YYYY-MM-DD');
  return firstDate;
}

function lastDateOfMonth(date) {
  const lastDate = moment(date).endOf('month').format('YYYY-MM-DD');
  return lastDate;
}

module.exports = CocoonStore;
//SELECT * FROM accounts WHERE username like %:match% OR role like %:match%"