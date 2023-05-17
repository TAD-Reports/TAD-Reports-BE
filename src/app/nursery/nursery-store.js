const { query } = require('express');
const moment = require('moment-timezone');

class NurseryStore {
  constructor(db) {
    this.db = db;
  }

  async getDuplicates(row) {
    const query = this.db('nursery');
    for (const [column, value] of Object.entries(row)) {
      const columnName = column.toLowerCase().replace(/ /g, '_').replace('/', '').replace('(', '').replace(')', '');
      query.where(columnName, value);
    }
    const existingRows = await query.select('*');
    return existingRows.length > 0 ? existingRows : null;
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

  async getByUUID(uuid) {
    const results = await this.db('nursery')
      .select()
      .where('UUID', uuid);
      const convertedResults = convertDatesToTimezone(results, ['report_date', 'date_established']);
      return convertedResults;
  }

  async getAll() {
    const results = await this.db('nursery')
      .select()
      .orderBy('region')
      .orderBy('report_date');
    const convertedResults = convertDatesToTimezone(results, ['report_date', 'date_established']);
    return convertedResults;
  }

  async delete(uuid) {
    return await this.db('nursery')
      .where('UUID', uuid)
      .del();
  }

  //TO DO:
  //devided Region search per user

async getCurrentMonthRecords(startOfMonth, endOfMonth) {
  const query = await this.db('nursery')
    .count('report_date as count')
    .whereBetween('report_date', [startOfMonth, endOfMonth]);
  return query;
}

async getTotalGraph(region, startDate, endDate) {
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  let firstDate;
  let lastDate;

  const currentMonthRecordCount = await this.getCurrentMonthRecords(
    firstDateOfMonth(),
    lastDateOfMonth()
  );
  console.log(currentMonthRecordCount);

  if (currentMonthRecordCount[0].count > 0) {
    firstDate = firstDateOfMonth();
    lastDate = lastDateOfMonth();
  } else {
    firstDate = previousMonth(firstDateOfMonth());
    lastDate = previousMonth(lastDateOfMonth());
  }

  const query = this.db('nursery')
    .select('funded_by as name')
    .sum('area_in_hectares_ha as total')
    .groupBy('funded_by');

    if (startDate && endDate) {
    query.whereBetween('report_date', [formattedStartDate, formattedEndDate]);
  } else {
    query.whereBetween('report_date', [firstDate, lastDate]);
  }

  if (region) {
    query.where('region', region);
  }

  return await query;
}


  async getMonthGraph(region, startDate, endDate) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const query = this.db('nursery')
      .select('report_date')
      .select('funded_by')
      .groupBy('funded_by')
      .groupBy('report_date')
      .select(this.db.raw('SUM(area_in_hectares_ha) AS area'));

    if (startDate && endDate) {
      query.whereBetween('report_date', [formattedStartDate, formattedEndDate]);
    }
    if (region) {
      query.where('region', region);
    }
    const results = await query;
    
    // Perform data manipulation to divide sum_area by month
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
    const query = this.db('nursery').select();
  
    if (startDate && endDate) {
      query.whereBetween('report_date', [formattedStartDate, formattedEndDate]);
    } else if (region) {
      query.andWhereILike('region', `%${region}%`);
    } else if (search) {
      query.andWhereILike('report_date', `%${formattedDate}%`)
          .andWhereILike('funded_by', `%${search}%`)
          .andWhereILike('province', `%${search}%`)
          .andWhereILike('district', `%${search}%`)
          .andWhereILike('municipality', `%${search}%`)
          .andWhereILike('barangay', `%${search}%`)
          .andWhereILike('complete_name_of_cooperator_organization', `%${search}%`)
          .andWhereILike('date_established', `%${formattedDate}%`)
          .andWhereILike('area_in_hectares_ha', `%${search}%`)
          .andWhereILike('variety_used', `%${search}%`)
          .andWhereILike('period_of_moa', `%${search}%`)
          .andWhereILike('remarks', `%${search}%`);
    } else {
      return "JC BADING"
    }
    const results = await query; // Execute the query and retrieve the results
    const convertedResults = convertDatesToTimezone(results.map(row => row), ['report_date', 'date_established']);
    return convertedResults;
  }
}

function formatDate(dateString) {
  const date = moment(dateString, 'YYYY/MM/DD', true); // Use moment.js to parse the date
  if (!date.isValid()) {
    return ("Invalid Date! Use this format YYYY/MM/DD");
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