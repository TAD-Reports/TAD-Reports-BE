const Store = require("./appform-store");
const XLSX = require("xlsx");
const { DateTime } = require("luxon");
const {
  NotFoundError,
  BadRequestError,
  FileUploadError,
  errorHandler,
} = require("../../../middlewares/errors");

class AppFormService {
  constructor(store) {}

  // Add
  async add(req, res, next) {
    try {
      const store = new Store(req.db);
      const body = req.body;

      let result = [];

      const applicant = await store.getExisting(body);
      if (applicant) {
        result = await store.update(applicant.uuid, body);
      } else {
        result = await store.add(body);
      }

      return res.status(200).json({
        success: true,
        message: "Saved Successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // Get
  async get(req, res, next) {
    try {
      const store = new Store(req.db);
      const uuid = req.params.uuid;
      const result = await store.getByUUID(uuid);
      if (!result) {
        throw new NotFoundError("Data Not Found");
      }
      return res.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update
  async update(req, res, next) {
    try {
      const store = new Store(req.db);
      const uuid = req.params.uuid;
      const body = req.body;
      //const userId = req.auth.id; // Get user ID using auth
      const id = await store.getByUUID(uuid);
      if (!id) {
        throw new NotFoundError("ID Not Found");
      }
      const result = await store.update(uuid, body);
      if (result === 0) {
        throw new NotFoundError("Data Not Found");
      }
      return res.status(200).send({
        success: true,
        data: {
          uuid,
          ...body,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete
  async delete(req, res, next) {
    try {
      const store = new Store(req.db);
      const uuid = req.params.uuid;
      const body = req.body;
      //const userId = req.auth.id; // Get user ID using auth
      const result = await store.delete(uuid);
      if (result === 0) {
        throw new NotFoundError("Data Not Found");
      }
      return res.status(202).send({
        success: true,
        message: "Deleted successfuly",
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Graph Data
  async getData(req, res, next) {
    try {
      const store = new Store(req.db);
      const region = req.query.region;
      const startDate = req.query.start;
      const endDate = req.query.end;
      const search = req.query.search;
      let table;
      let monthGraph = [];
      let totalGraph = [];
      const hasData = await store.getAll();
      if (hasData.length > 0) {
        monthGraph = await store.getMonthGraph(
          region,
          startDate,
          endDate,
          search
        );
        totalGraph = await store.getTotalGraph(
          region,
          startDate,
          endDate,
          search
        );
      }
      if (!region && !startDate && !endDate && !search) {
        table = await store.getAll();
      } else {
        table = await store.search(region, startDate, endDate, search);
      }
      return res.status(200).send({
        success: true,
        monthGraph: monthGraph,
        totalGraph: totalGraph,
        table: table,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Function to convert Excel date to "dd/mm/yyyy" format
function convertExcelDate(excelDate) {
  const baseDate = DateTime.fromObject({ year: 1900, month: 1, day: 1 });
  const convertedDate = baseDate.plus({ days: excelDate - 2 });
  return convertedDate.toFormat("yyyy/MM/dd");
}

module.exports = AppFormService;
