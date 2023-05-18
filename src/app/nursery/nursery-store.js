const { query } = require('express');
const moment = require('moment-timezone');
const nurseryTableConfig = require('../../configuration/nurseryTableConfig');

class NurseryStore {
  constructor(db) {
    this.db = db;
    this.table = nurseryTableConfig.tableName;
    this.cols = nurseryTableConfig.columnNames;
  }


  async add(row) {
    return await this.db('nursery').insert({
      report_date: row['Report Date'],
      funded_by: row['Funded by'],
      region: row['Region'],
      province: row['Province'],
      district: row['District'],
      municipality: row['Municipality'],
      barangay: row['Barangay'],
      complete_name_of_cooperator_organization: row['Complete Name of Cooperator/ Organization'],
      date_established: row['Date Established'],
      area_in_hectares_ha: row['Area in Hectares (ha)'],
      variety_used: row['Variety Used'],
      period_of_moa: row['Period of MOA'],
      remarks: row['Remarks'],
      status: 1, // Assuming 'status' is always 1
      imported_by: row.imported_by, // Assign the import_by field from the row object
    });
  }


  async update(uuid, data) {
    return await this.db(this.table)
      .where(this.cols.id, uuid)
      .update({
        report_date: data.reportDate,
        funded_by: data.fundedBy,
        region: data.region,
        province: data.province,
        district: data.district,
        municipality: data.municipality,
        barangay: data.barangay,
        complete_name_of_cooperator_organization: data.cooperator,
        date_established: data.establishedDate,
        area_in_hectares_ha: data.area,
        variety_used: data.variety,
        period_of_moa: data.moa,
        remarks: data.remarks,
        status: data.status, 
      });
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