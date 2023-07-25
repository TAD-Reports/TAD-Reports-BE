const Store = require("./coconutproject-store");
const Logs = require("../../logs/logs-store");
const XLSX = require("xlsx");
const { DateTime } = require("luxon");
const {
  NotFoundError,
  BadRequestError,
  FileUploadError,
  errorHandler,
} = require("../../../middlewares/errors");
const moduleName = "coconutproject";
const userId = 1;

class CoconutService {
  constructor(store) {}
  // Add
  async add(req, res, next) {
    try {
      const store = new Store(req.db);
      const logs = new Logs(req.db);
      const body = req.body;
      //const userId = req.auth.id; // Get user ID using auth
      if (!req.file) {
        throw new FileUploadError("No file uploaded");
      }
      const file = req.file;
      const fileContents = file.buffer;
      const workbook = XLSX.read(fileContents, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      let headerRowIndex = 0;
      const range = XLSX.utils.decode_range(sheet["!ref"]);
      for (let row = range.s.r; row <= range.e.r; row++) {
        const cell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
        if (cell && cell.v === "Report Date") {
          headerRowIndex = row;
          break;
        }
      }
      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        range: headerRowIndex,
      });
      const uniqueRows = new Map();
      const duplicateRows = [];
      const existingRows = [];
      const rowsToAdd = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (
          !row["Report Date"] ||
          !row["Name of Fiber Crops"] ||
          !row["Region"] ||
          !row["Province"] ||
          !row["Municipality"] ||
          !row["Barangay"] ||
          !row["Name of Beneficiary"] ||
          !row["Gender"] ||
          !row["Category"] ||
          !row["Area Planted (has)"] ||
          !row["Variety"] ||
          !row["No. of seed-derived PM distributed"]
        ) {
          throw new BadRequestError(
            `Incomplete data found in Excel row ${
              i + headerRowIndex + 2
            } or below`
          );
        }
        row.imported_by = body.imported_by;
        if (row["Report Date"] && typeof row["Report Date"] === "number") {
          row["Report Date"] = convertExcelDate(row["Report Date"]);
        }

        if (row["Birthdate"] && typeof row["Birthdate"] === "number") {
          row["Birthdate"] = convertExcelDate(row["Birthdate"]);
        }

        const regionValue = row["Region"];
        if (!regionValue.startsWith("Regional Office ")) {
          throw new BadRequestError(
            `Invalid value found in the Region column of Excel row ${
              i + headerRowIndex + 2
            }. The value should start with Regional Office (e.g., 'Regional Office 1', or 'Regional Office 13').`
          );
        }
        const rowKey = JSON.stringify(row);
        if (uniqueRows.has(rowKey)) {
          duplicateRows.push(i + 1);
        } else {
          uniqueRows.set(rowKey, i + 1);
          const existingRow = await store.getExisting(row);
          if (!existingRow) {
            rowsToAdd.push(row);
          } else {
            existingRows.push({
              success: false,
              message: existingRow,
              rowNumber: i + 1,
            });
          }
        }
      }
      if (duplicateRows.length > 0) {
        throw new FileUploadError(
          "Duplicate rows found in Excel",
          duplicateRows
        );
      }
      const rowsAdded = [];
      for (const row of rowsToAdd) {
        await store.add(row);
        // await logs.add({
        //   uuid: userId,
        //   module: moduleName,
        //   data: row,
        //   action: `imported a new row in ${moduleName} table`,
        //   ...body,
        // });
        rowsAdded.push(row);
      }
      return res.status(200).json({
        success: true,
        message: `${rowsAdded.length} rows are added from ${file.originalname} into the database`,
        duplicates: existingRows.length,
        data: rowsAdded,
      });
    } catch (err) {
      next(err);
    }
  }

  // Get
  async get(req, res, next) {
    try {
      const store = new Store(req.db);
      const logs = new Logs(req.db);
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
      const logs = new Logs(req.db);
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
      // logs.add({
      //   uuid: userId,
      //   module: moduleName,
      //   action: `updated a row in ${moduleName} table`,
      //   data: result,
      //   ...body
      // });
      return res.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete
  async delete(req, res, next) {
    try {
      const store = new Store(req.db);
      const logs = new Logs(req.db);
      const uuid = req.params.uuid;
      const body = req.body;
      const result = await store.delete(uuid);
      //const userId = req.auth.id; // Get user ID using auth
      if (result === 0) {
        throw new NotFoundError("Data Not Found");
      }
      logs.add({
        uuid: userId,
        module: moduleName,
        action: `deleted a row in ${moduleName} table`,
        data: result,
        ...body,
      });
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

      let total = 0;
      let table = [];
      let lineGraph = [];
      let barGraph = [];

      const hasData = await store.getAll();

      if (hasData.length > 0) {
        lineGraph = await store.getLineGraph(
          region,
          startDate,
          endDate,
          search
        );
        barGraph = await store.getBarGraph(region, startDate, endDate, search);
        table = await store.search(region, startDate, endDate, search);
        total = await store.totalBeneficiary(
          region,
          startDate,
          endDate,
          search
        );
      } else {
        table = await store.getAll();
      }
      return res.status(200).send({
        success: true,
        total: total,
        lineGraph: lineGraph,
        barGraph: barGraph,
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
  return convertedDate.toFormat("yyyy/MM/dd");
}

module.exports = CoconutService;
