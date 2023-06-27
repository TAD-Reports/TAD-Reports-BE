const { query } = require('express');
const moment = require('moment-timezone');
const tableConfig = require("../../../configuration/pmsurvivedTableConfig");

class PmSurvivedStore {
  constructor(db) {
    this.db = db;
    this.table = tableConfig.tableName;
    this.cols = tableConfig.columnNames;
  }

  async add(row) {
    return await this.db(this.table).insert({
      report_date: row["Report Date"],
      type_of_planting_materials: row["Type of Planting Materials"],
      name_of_cooperative_individual: row["Name of Cooperative/ Individual"],
      region: row["Region"],
      province: row["Province"],
      district: row["District"],
      municipality: row["Municipality"],
      barangay: row["Barangay"],
      no_of_pm_available_during_establishment:
        row["No. of PM available during Establishment"],
      variety: row["Variety"],
      date_received: row["Date Received"],
      no_of_pm_planted: row["No. of PM Planted"],
      no_of_pm_survived: row["No. of PM Survived"],
      remarks: row["Remarks"],
      imported_by: row.imported_by, // Assign the import_by field from the row object
    });
  }

  async update(uuid, body) {
    await this.db(this.table).where(this.cols.id, uuid).update({
      report_date: body.report_date,
      type_of_planting_materials: body.type_of_planting_materials,
      name_of_cooperative_individual: body.name_of_cooperative_individual,
      region: body.region,
      province: body.province,
      district: body.district,
      municipality: body.municipality,
      barangay: body.barangay,
      no_of_pm_available_during_establishment:
        body.no_of_pm_available_during_establishment,
      variety: body.variety,
      date_received: body.date_received,
      no_of_pm_planted: body.no_of_pm_planted,
      no_of_pm_survived: body.no_of_pm_survived,
      remarks: body.remarks,
    });
    // Fetch the updated rows
    const updatedRows = await this.db(this.table)
      .where(this.cols.id, uuid)
      .select("*")
      .first();
    return updatedRows;
  }

  async getExisting(row) {
    const excludedFields = ["imported_by", "District", "Remarks"];
    const query = this.db(this.table);
    for (const [column, value] of Object.entries(row)) {
      const columnName = column
        .toLowerCase()
        .replace(/ /g, "_")
        .replace("/", "")
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
      this.cols.dateReceived,
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
      this.cols.dateReceived,
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

  async getLineGraph(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = sixMonthBehindDate(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const query = this.db(this.table)
      .select(this.cols.plantingMaterials)
      .select(
        this.db.raw(
          `CONCAT(MONTHNAME(report_date), YEAR(report_date)) AS month_year`
        )
      )
      .sum(`${this.cols.pmSurvived} AS pm_survived`)
      .groupBy(
        this.cols.plantingMaterials,
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
      const columns = await this.db(this.table).columnInfo();
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
        const index = acc.findIndex(
          (item) => item.id === curr.type_of_planting_materials
        );
        if (index !== -1) {
          acc[index].data.push({
            x: curr.month_year,
            y: curr.pm_survived,
          });
        } else {
          acc.push({
            id: curr.type_of_planting_materials,
            data: [
              {
                x: curr.month_year,
                y: curr.pm_survived,
              },
            ],
          });
        }
        return acc;
      }, []);

      // Find unique x values
      const uniqueXValues = new Set();
      formattedData.forEach((item) => {
        item.data.forEach((dataPoint) => {
          uniqueXValues.add(dataPoint.x);
        });
      });

      // Add missing x values with y = 0
      formattedData.forEach((item) => {
        const missingXValues = Array.from(uniqueXValues).filter(
          (x) => !item.data.find((dataPoint) => dataPoint.x === x)
        );
        missingXValues.forEach((x) => {
          item.data.push({ x, y: 0 });
        });

        // Sort data array based on x values
        item.data.sort((a, b) => {
          const dateA = new Date(a.x);
          const dateB = new Date(b.x);
          return dateA - dateB;
        });
      });
      return formattedData;
    });
    return formattedResult;
  }

  async getBarGraph(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = sixMonthBehindDate(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const query = this.db(this.table)
      .select(this.cols.plantingMaterials)
      .select(
        this.db.raw(
          `CONCAT(MONTHNAME(report_date), YEAR(report_date)) AS month_year`
        )
      )
      .sum(`${this.cols.pmSurvived} AS pm_survived`)
      .groupBy(
        this.cols.plantingMaterials,
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
      const columns = await this.db(this.table).columnInfo();
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
        const index = acc.findIndex(
          (item) => item.name === curr.type_of_planting_materials
        );
        if (index !== -1) {
          acc[index][curr.month_year] = curr.pm_survived;
        } else {
          acc.push({
            name: curr.type_of_planting_materials,
            [curr.month_year]: curr.pm_survived,
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
      const columns = await this.db(this.table).columnInfo();
      query.andWhere((builder) => {
        builder.where((innerBuilder) => {
          Object.keys(columns).forEach((column) => {
            innerBuilder.orWhere(column, "like", `%${search}%`);
          });
        });
      });
    }
    const results = await query;
    const convertedResults = convertDatesToTimezone(
      results.map((row) => row),
      [this.cols.reportDate, this.cols.dateReceived]
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
      .count(`${this.cols.cooperative} AS count`)
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
  const date = moment(dateString, 'YYYY/MM/DD', true);
  if (!date.isValid()) {
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

function sixMonthBehindDate(date) {
  const sixMonthsAgo = moment(date).subtract(6, "months");
  const firstDate = sixMonthsAgo.startOf("month").format("YYYY-MM-DD");
  return firstDate;
}


function firstDateOfMonth(date) {
  const firstDate = moment(date).startOf('month').format('YYYY-MM-DD');
  return firstDate;
}


function lastDateOfMonth(date) {
  const lastDate = moment(date).endOf('month').format('YYYY-MM-DD');
  return lastDate;
}

module.exports = PmSurvivedStore;
