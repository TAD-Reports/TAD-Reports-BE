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
  //devided Region search per user

  async searchByKey(key) {
    const formattedDate = formatDate(key); // Format the date string
    const results = await this.db('nursery')
      .select()
        .whereILike('month_report', `%${formattedDate}%`)
        .orWhereILike('region', `%${key}%`)
        .orWhereILike('province', `%${key}%`)
        .orWhereILike('district', `%${key}%`)
        .orWhereILike('municipality', `%${key}%`)
        .orWhereILike('barangay', `%${key}%`)
        .orWhereILike('funded_by', `%${key}%`)
        .orWhereILike('complete_name_of_cooperator_organization', `%${key}%`)
        .orWhereILike('area_in_hectares_ha', `%${key}%`)
        .orWhereILike('variety_used', `%${key}%`)
        .orWhereILike('period_of_moa', `%${key}%`)
        .orWhereILike('remarks', `%${key}%`);
    const convertedResults = convertDatesToTimezone(results, ['month_report', 'date_established']);
    return convertedResults;
  }

  async getGraphData(regionKey, dateKey) {
    const formattedDate = formatDate(dateKey);
    const lastDayOfMonth = moment(formattedDate, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD');

    const query = this.db('nursery')
      .select('funded_by')
      .count('funded_by as count')
      .groupBy('funded_by');

    if (regionKey) {
      query.where('region', regionKey);
    } else if (dateKey) {
      query.whereBetween('month_report', [formattedDate, lastDayOfMonth]);
    } else {
      return null;
    }

    return await query;
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

module.exports = NurseryStore;


//SELECT * FROM accounts WHERE username like %:match% OR role like %:match%"