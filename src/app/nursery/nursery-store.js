const { query } = require('express');
const moment = require('moment-timezone');
const nurseryTableConfig = require('../../configuration/nurseryTableConfig');

class NurseryStore {
  constructor(db) {
    this.db = db;
    this.table = nurseryTableConfig.tableName;
    this.cols = nurseryTableConfig.columnNames;
  }

  async getDuplicates(row) {
    const query = this.db(this.table);
    for (const [column, value] of Object.entries(row)) {
      const columnName = column.toLowerCase().replace(/ /g, '_').replace('/', '').replace('(', '').replace(')', '');
      query.where(columnName, value);
    }
    const existingRows = await query.select('*');
    return existingRows.length > 0 ? existingRows : null;
  }

  async add(row) {
    return await this.db(this.table).insert({
      report_date: row[this.cols.reportDate],
      funded_by: row[this.cols.fundedBy],
      region: row[this.cols.region],
      province: row[this.cols.province],
      district: row[this.cols.distric],
      municipality: row[this.cols.municipality],
      barangay: row[this.cols.barangay],
      complete_name_of_cooperator_organization: row[this.cols.cooperator],
      date_established: row[this.cols.establishedDate],
      area_in_hectares_ha: row[this.cols.area],
      variety_used: row[this.cols.variety],
      period_of_moa: row[this.cols.moa],
      remarks: row[this.cols.remarks],
      status: 1, // Assuming 'status' is default as 1 for active
      imported_by: row.imported_by, // Assign the import_by field from the row object
    });
  }

  async getByUUID(uuid) {
    const results = await this.db(this.table)
      .select()
      .where(this.cols.id, uuid);
      const convertedResults = convertDatesToTimezone(results, [this.cols.reportDate, this.cols.establishedDate]);
      return convertedResults;
  }

  async getAll() {
    const results = await this.db(this.table)
      .select()
      .orderBy(this.cols.region)
      .orderBy(this.cols.reportDate);
    const convertedResults = convertDatesToTimezone(results, [this.cols.reportDate, this.cols.establishedDate]);
    return convertedResults;
  }

  async delete(uuid) {
    return await this.db(this.table)
      .where(this.cols.id, uuid)
      .del();
  }

  //TO DO:
  //devided Region search per user

async getCurrentMonthRecords(startOfMonth, endOfMonth) {
  const query = await this.db(this.table)
    .count(`${this.cols.reportDate} as count`)
    .whereBetween(this.cols.reportDate, [startOfMonth, endOfMonth]);
  return query;
}

async getTotalGraph(region, startDate, endDate, search) {
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);
  let firstDate;
  let lastDate;
  const currentMonthRecordCount = await this.getCurrentMonthRecords(
    firstDateOfMonth(),
    lastDateOfMonth()
  );
  if (currentMonthRecordCount[0].count > 0) {
    firstDate = firstDateOfMonth();
    lastDate = lastDateOfMonth();
  } else {
    firstDate = previousMonth(firstDateOfMonth());
    lastDate = previousMonth(lastDateOfMonth());
  }
  const query = this.db(this.table)
    .select(`${this.cols.fundedBy} as name`)
    .sum(`${this.cols.area} as total`)
    .groupBy(this.cols.fundedBy);
    if (startDate && endDate) {
    query.whereBetween(this.cols.reportDate, [formattedStartDate, formattedEndDate]);
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
            innerBuilder.orWhere(column, 'like', `%${search}%`);
          });
        });
      });
    }
    return await query;
  }


  async getMonthGraph(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    let firstDate;
    let lastDate;
    const currentMonthRecordCount = await this.getCurrentMonthRecords(
      firstDateOfMonth(),
      lastDateOfMonth()
    );
    if (currentMonthRecordCount[0].count > 0) {
      firstDate = firstDateOfMonth();
      lastDate = lastDateOfMonth();
    } else {
      firstDate = previousMonth(firstDateOfMonth());
      lastDate = previousMonth(lastDateOfMonth());
    }
    const query = this.db(this.table)
      .select(this.cols.reportDate)
      .select(this.cols.fundedBy)
      .groupBy(this.cols.fundedBy)
      .groupBy(this.cols.reportDate)
      .select(this.db.raw(`SUM(${this.cols.area}) AS area`));
    if (startDate && endDate) {
      query.whereBetween(this.cols.reportDate, [formattedStartDate, formattedEndDate]);
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
            innerBuilder.orWhere(column, 'like', `%${search}%`);
          });
        });
      });
    }
    const results = await query;
    // Data manipulation to divide sum_area by month
    const graphData = [];
    results.forEach(row => {
      const month = moment(row.report_date).format('MMMYYYY');
      let existingData = graphData.find(item => item.name === row.funded_by);
      if (!existingData) {
        existingData = {
          name: row.funded_by,
          months: {},
        };
        graphData.push(existingData);
      }
      existingData.months[month] = row.area;
    });
    return graphData;
  }

  async search(region, startDate, endDate, search) {
    const formattedDate = formatDate(search); // Format the date string
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const query = this.db(this.table).select();
    if (startDate && endDate) {
      query.whereBetween(this.cols.reportDate, [formattedStartDate, formattedEndDate]);
    } 
    if (region) {
      query.where(this.cols.region, region);
    }
    if (search) {
      const columns = await this.db(this.table).columnInfo(); // Retrieve column information
      query.andWhere((builder) => {
        builder.where((innerBuilder) => {
          Object.keys(columns).forEach((column) => {
            innerBuilder.orWhere(column, 'like', `%${search}%`);
          });
        });
      });
    }
    const results = await query; // Execute the query and retrieve the results
    const convertedResults = convertDatesToTimezone(results.map(row => row), [this.cols.reportDate, this.cols.establishedDate]);
    return convertedResults;
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

function firstDateOfMonth() {
  const firstDate = moment().startOf('month').format('YYYY-MM-DD');
  return firstDate;
}

function lastDateOfMonth() {
  const lastDate = moment().endOf('month').format('YYYY-MM-DD');
  return lastDate;
}

function previousMonth(date) {
  const previousMonth = moment(date).subtract(1, 'month').format('YYYY-MM-DD');
  return previousMonth;
}


module.exports = NurseryStore;


//SELECT * FROM accounts WHERE username like %:match% OR role like %:match%"