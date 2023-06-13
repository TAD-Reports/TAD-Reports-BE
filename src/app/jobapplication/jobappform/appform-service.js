const Store = require('./appform-store');
const XLSX = require('xlsx');
const { DateTime } = require('luxon');
const {
  NotFoundError,
  BadRequestError,
  FileUploadError,
  errorHandler,
} = require('../../../middlewares/errors');

class AppFormService {
  constructor(store) {}

  // Add
  async add(req, res, next) {
    try {
      const store = new Store(req.db);
      const body = req.body;

      if (
        !req.pds ||
        !req.college ||
        !req.masteral ||
        !req.doctoral ||
        !req.eligibilities
      ) {
        throw new FileUploadError('No file uploaded');
      }

      const attachments = {
        pds: req.pds,
        college: req.college,
        masteral: req.masteral,
        doctoral: req.doctoral,
      };

      const eligibilities = req.eligibilities;

      let result = [];

      const applicant = await store.getExisting(body);
      if (applicant) {
        result = await store.update(applicant.uuid, body);
      } else {
        if (eligibilities) {
          result = await store.add(body, attachments, eligibilities);
        }
        result = await store.add(body, attachments);
      }

      return res.status(200).json({
        success: true,
        message: 'Saved Successfully',
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
        throw new NotFoundError('Data Not Found');
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
        throw new NotFoundError('ID Not Found');
      }
      const result = await store.update(uuid, body);
      if (result === 0) {
        throw new NotFoundError('Data Not Found');
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
        throw new NotFoundError('Data Not Found');
      }
      return res.status(202).send({
        success: true,
        message: 'Deleted successfuly',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Graph Data
  async getData(req, res, next) {
    try {
      const store = new Store(req.db);
      const search = req.query.search;
      let table;
      if (!search) {
        table = await store.getAll();
      } else {
        table = await store.search(search);
      }
      return res.status(200).send({
        success: true,
        data: table,
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
  return convertedDate.toFormat('yyyy/MM/dd');
}

module.exports = AppFormService;
