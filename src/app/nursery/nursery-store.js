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
}

module.exports = NurseryStore;


  // getNurseryByUUID

  // getAllNursery