const Store = require("./jobpositions-store");
const Logs = require("../../logs/logs-store");
// const XLSX = require("xlsx");
// const { DateTime } = require("luxon");
// const {
//   NotFoundError,
//   BadRequestError,
//   FileUploadError,
//   errorHandler,
// } = require("../../../middlewares/errors");
const moduleName = 'Job Positions';
const userId = 1;

class JobPositionsService {
  constructor(store) {
  }

  // Add
  async add(req, res, next) {
    try {
      const store = new Store(req.db);
      const logs = new Logs(req.db);
      const body = req.body;
      const positionToAdd = [body];
  
      const positionAdded = [];
      for (const position of positionToAdd) {
        await store.add(position);
        await logs.add({
          uuid: userId,
          module: moduleName,
          data: position,
          action: `added a new row in ${moduleName} table`,
          ...body
        });
        positionAdded.push(position);
      }
      return res.status(200).json({
        success: true,
        message: `${positionAdded.length} position are added to the database`,
        // duplicates: existingRows.length,
        data: positionAdded
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = JobPositionsService;

