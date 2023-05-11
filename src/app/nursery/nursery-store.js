class NurseryStore {
  constructor(db) {
    this.db = db;
  }

  async addFile(fileName, fileContents) {
    return await this.db('nursery_files')
      .insert({
        file_name: fileName,
        file_contents: fileContents
      });
  }
}

module.exports = NurseryStore;
  // getNurseryByUUID

  // getAllNursery