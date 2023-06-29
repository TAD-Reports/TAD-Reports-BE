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

  async update(req, res, next) {
    try {
      const store = new Store(req.db);
      const logs = new Logs(req.db);
      const uuid = req.params.uuid;
      const body = req.body;
      //const userId = req.auth.id; // Get user ID using auth
      const id = await store.getByUUID(uuid);
      if (!id) {
        throw new NotFoundError('ID Not Found');
      }
      const result = store.update(uuid, body);
      if (result === 0) {
        throw new NotFoundError('Data Not Found');
      }
      logs.add({
        uuid: userId,
        module: moduleName,
        action: `updated a row in ${moduleName} table`,
        data: result,
        ...body
      });
      return res.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const store = new Store(req.db);
      const logs = new Logs(req.db);
      const uuid = req.params.uuid;
      const body = req.body;
      const result = await store.delete(uuid);
      //const userId = req.auth.id; // Get user ID using auth
      if (result === 0) {
        throw new NotFoundError('Data Not Found');
      }
      logs.add({
        uuid: userId,
        module: moduleName,
        action: `deleted a row in ${moduleName} table`,
        data: result,
        ...body
      });
      return res.status(202).send({
        success: true,
        message: 'Deleted successfuly'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = JobPositionsService;

