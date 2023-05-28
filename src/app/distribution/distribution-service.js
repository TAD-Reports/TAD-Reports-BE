const Store = require('./distribution-store');
const Logs = require('../logs/logs-store');
const XLSX = require('xlsx');
const { DateTime } = require('luxon');
const { NotFoundError, BadRequestError, FileUploadError, errorHandler } = require('../../middlewares/errors');

class DistributionService {
  constructor(store) {
  }
  // Add
  async add(req, res, next) {
    try {
      const store = new Store(req.db);
      const logs = new Logs(req.db);
      const body = req.body;
      if (!req.file) {
        throw new FileUploadError('No file uploaded');
      }
      const file = req.file;
      const fileContents = file.buffer;
      const workbook = XLSX.read(fileContents, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      let headerRowIndex = 0;
      const range = XLSX.utils.decode_range(sheet['!ref']);
      for (let row = range.s.r; row <= range.e.r; row++) {
        const cell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
        if (cell && cell.v === 'Report Date') {
          headerRowIndex = row;
          break;
        }
      }
      const jsonData = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });
      const uniqueRows = new Map();
      const duplicateRows = [];
      const existingRows = [];
      const rowsToAdd = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row['Report Date'] ||
          !row['Type of Planting Materials'] ||
          !row['Name of Cooperative/ Individual'] ||
          !row['Region'] ||
          !row['Province'] ||
          !row['Municipality'] ||
          !row['Barangay'] ||
          !row['No. of PM available during Establishment'] ||
          !row['Variety'] ||
          !row['No. of PM Distributed'] ||
          !row['Name of Recipient/ Bene'] ||
          !row['Address of Beneficiary'] ||
          !row['Gender'] ||
          !row['Category']) {
          throw new BadRequestError(`Incomplete data found in Excel row ${i + headerRowIndex + 2} or below`);
        }
        row.imported_by = body.imported_by;
        if (row['Report Date'] && typeof row['Report Date'] === 'number') {
          row['Report Date'] = convertExcelDate(row['Report Date']);
        }
        const rowKey = JSON.stringify(row);
        if (uniqueRows.has(rowKey)) {
          duplicateRows.push(i + 1);
        } else {
          uniqueRows.set(rowKey, i + 1);
          const existingRow = await store.getDuplicates(row);
          if (!existingRow) {
            rowsToAdd.push(row);
          } else {
            existingRows.push({
              success: false,
              message: existingRow, rowNumber: i + 1
            });
          }
        }
      }
      if (duplicateRows.length > 0) {
        throw new FileUploadError("Duplicate rows found in Excel", duplicateRows);
      }
      const rowsAdded = [];
      for (const row of rowsToAdd) {
        await store.add(row);
        rowsAdded.push(row);
      }
      return res.status(200).json({
        success: true,
        message: `${rowsAdded.length} rows are added from ${file.originalname} into the database`,
        duplicates: existingRows.length,
        data: rowsAdded
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
        data: data
      });
    } catch (error) {
      next(error);
    }
  }


  // Update 
  async update(req, res, next) {
    try {
      const store = new Store(req.db);
      const logsStore = new LogsStore(req.db);
      const uuid = req.params.uuid;
      const body = req.body;
      const id = await store.getByUUID(uuid);
      if (!id) {
        throw new NotFoundError('ID Not Found');
      }
      const result = store.update(uuid, body);
      if (result === 0) {
        throw new NotFoundError('Data Not Found');
      }
      return res.status(200).send({
        success: true,
        data: {
          uuid, ...body
        }
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
      const result = await store.delete(uuid);
      if (result === 0) {
        throw new NotFoundError('Data Not Found');
      }
      return res.status(202).send({
        success: true,
        message: 'Deleted successfuly'
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

function convertExcelDate(excelDate) {
  const baseDate = DateTime.fromObject({ year: 1900, month: 1, day: 1 });
  const convertedDate = baseDate.plus({ days: excelDate - 2 });
  return convertedDate.toFormat('yyyy/MM/dd');
}


module.exports = DistributionService;