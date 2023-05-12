class NurseryStore {
  constructor(db) {
    this.db = db;
  }

  async addNurseryRow(row) {
    return await this.db('nursery')
      .insert({
        report_date: row['Month Report'],
        region: row['Region'],
        province: row['Province'],
        district: row['District'],
        municipality: row['Municipality'],
        barangay: row['Barangay'],
        funded_by: row['Funded by'],
        cooperative_name: row['Complete Name of Cooperator/ Organization'],
        established_date: row['Date Established'],
        area_in_has: row['Area in Hectares (ha)'],
        variety: row['Variety Used'],
        moa_period: row['Period of MOA'],
        remarks: row['Remarks'],
        status: 1, // Assuming 'status' is always 1
        import_by: row.import_by // Assign the import_by field from the row object
      });
  } 
}

module.exports = NurseryStore;

  // getNurseryByUUID

  // getAllNursery