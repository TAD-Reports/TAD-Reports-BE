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
    return await this.db('nursery')
      .select()
      .where('UUID', uuid)
      .first();
  }

  async getAllNursery() {
    return await this.db('nursery')
      .select();
  } 

  async deleteNursery(uuid) {
    return await this.db('nursery')
      .where('UUID', uuid)
      .del();
  }

  async searchByKey(key) {
    const formattedDate = formatDate(key); // Format the date string
    return await this.db('nursery')
      .select()
      .whereILike('month_report', `%${formattedDate}%`)
      .orWhereILike('region', `%${key}%`);
  }


  async getGraphData(date) {
    const formattedDate = formatDate(date); // Format the date string
    return await this.db('nursery')
      .select('funded_by')
      .where('month_report', `${formattedDate}`)
      .count('funded_by as count')
      .groupBy('funded_by');
  }

}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('/');
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
}

module.exports = NurseryStore;


//SELECT * FROM accounts WHERE username like %:match% OR role like %:match%"