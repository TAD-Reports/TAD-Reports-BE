const moment = require('moment-timezone');

class NurseryStore {
  constructor(db) {
    this.db = db;
  }

  async getExistingRow(row) {
    const query = this.db('nursery');
    for (const [column, value] of Object.entries(row)) {
      const columnName = column.toLowerCase().replace(/ /g, '_').replace('/', '').replace('(', '').replace(')', '');
      query.where(columnName, value);
    }
    const existingRows = await query.select('*');
    return existingRows.length > 0 ? existingRows : null;
  }

  async addNurseryRow(row) {
    return await this.db('nursery').insert({
      month_report: row['Month Report'],
      region: row['Region'],
      province: row['Province'],
      district: row['District'],
      municipality: row['Municipality'],
      barangay: row['Barangay'],
      funded_by: row['Funded by'],
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

  async getNurseryByUUID(uuid) {
    const results = await this.db('nursery')
      .select()
      .where('UUID', uuid);
      const convertedResults = convertDatesToTimezone(results, ['month_report', 'date_established']);
      return convertedResults;
  }

  async deleteNursery(uuid) {
    return await this.db('nursery')
      .where('UUID', uuid)
      .del();
  }

  async getAllNursery() {
    const results = await this.db('nursery')
      .select()
      .orderBy('region')
      .orderBy('month_report');
    const convertedResults = convertDatesToTimezone(results, ['month_report', 'date_established']);
    return convertedResults;
  }

  //TO DO:
  //devided search per Region
  //make the provided date as startDate and get the endDate of the month

  async searchByKey(key) {
    const formattedDate = formatDate(key); // Format the date string
    const results = await this.db('nursery')
      .select()
        .whereILike('month_report', `%${formattedDate}%`)
        .orWhereILike('region', `%${key}%`);
    const convertedResults = convertDatesToTimezone(results, ['month_report', 'date_established']);
    return convertedResults;
  }

  async getGraphData(regionKey, dateKey) {
    const formattedDate = formatDate(dateKey);
    const query = this.db('nursery')
      .select('funded_by')
      .count('funded_by as count')
      .groupBy('funded_by');

    if (regionKey) {
      query.where('region', regionKey);
    }

    if (dateKey) {
      query.where('month_report', formattedDate);
    }

    if (!regionKey && formattedDate) {
      query.where('month_report', formattedDate);
    }

    return await query;
  }
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

function formatDate(dateString) {
  const date = moment(dateString, 'YYYY/MM/DD', true); // Use moment.js to parse the date
  if (!date.isValid()) {
    return (""); //DITO YUNG DEFAULT NA PREVIOUS AND CURRENT MONTH!!
  }
  return date.format('YYYY-MM-DD');
}



module.exports = NurseryStore;


//SELECT * FROM accounts WHERE username like %:match% OR role like %:match%"