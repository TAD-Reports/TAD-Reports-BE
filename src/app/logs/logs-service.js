const Store = require("./logs-store");
const {
  NotFoundError,
  BadRequestError,
  errorHandler,
} = require("../../middlewares/errors");

class LogsService {
  constructor(store) { }


  async add(req, res, next) {
    try {
      const store = new Store(req.db);
      const moduleName = req.params.module;
      const body = req.body;
      //const userId = req.auth.id; // Get user ID using auth
      const userId = 1;
      if (!moduleName === 'Authentication') {
        store.add({
          uuid: userId,
          module: moduleName,
          action: "signed out",
          ...body
        });
      } else {
        store.add({
          uuid: userId,
          module: moduleName,
          action: `downloaded data from ${moduleName} table`,
          ...body
        });
      }
      return res.status(200).send({
        success: true,
      });
    } catch(err) {
      next(err);
    }
  }
}

module.exports = LogsService;
