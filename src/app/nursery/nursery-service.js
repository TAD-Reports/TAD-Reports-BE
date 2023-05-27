const Store = require("./nursery-store");
const Logs = require("../logs/logs-store");
const XLSX = require("xlsx");
const { DateTime } = require("luxon");
const {
    NotFoundError,
    BadRequestError,
    FileUploadError,
    errorHandler,
} = require("../../middlewares/errors");

class NurseryService {
    constructor(store) {}
    
    // Add
    async add(req, res, next) {
        try {
            const store = new Store(req.db);
            const logs = new Logs(req.db);
            const body = req.body;

            // Check if a file was uploaded
            if (!req.file) {
                throw new FileUploadError("No file uploaded");
            }

            // Get the uploaded file and read its contents
            const file = req.file;
            const fileContents = file.buffer;

            // Read the Excel file
            const workbook = XLSX.read(fileContents, { type: "buffer" });

            // Assuming the data is in the first sheet (index 0)
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            // Find the header row index
            let headerRowIndex = 0;
            const range = XLSX.utils.decode_range(sheet["!ref"]);
            for (let row = range.s.r; row <= range.e.r; row++) {
                const cell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
                if (cell && cell.v === "Report Date") {
                    headerRowIndex = row;
                    break;
                }
            }

            // Convert the sheet data to JSON starting from the header row
            const jsonData = XLSX.utils.sheet_to_json(sheet, {
                range: headerRowIndex,
            });

            const uniqueRows = new Map(); // Map to store unique rows with their row numbers
            const duplicateRows = []; // Array to store duplicate rows with their row numbers
            const existingRows = []; // Array to store existing rows with their row numbers

            // Iterate over each row in the JSON data
            const rowsToAdd = [];
            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i];

                // Check if any required fields are empty
                if (
                    !row["Report Date"] ||
                    !row["Nurseries"] ||
                    !row["Funded by"] ||
                    !row["Region"] ||
                    !row["Province"] ||
                    !row["Municipality"] ||
                    !row["Barangay"] ||
                    !row["Complete Name of Cooperator/ Organization"] ||
                    !row["Date Established"] ||
                    !row["Area in Hectares (ha)"] ||
                    !row["Variety Used"] ||
                    !row["Period of MOA"]
                ) {
                    throw new BadRequestError(
                        `Incomplete data found in Excel row ${
                            i + headerRowIndex + 2
                        } or below`
                    );
                }

                // Add the import_by field from req.body
                row.imported_by = body.imported_by;

                // Convert the date format
                if (
                    row["Report Date"] &&
                    typeof row["Report Date"] === "number"
                ) {
                    row["Report Date"] = convertExcelDate(row["Report Date"]);
                }

                if (
                    row["Date Established"] &&
                    typeof row["Date Established"] === "number"
                ) {
                    row["Date Established"] = convertExcelDate(
                        row["Date Established"]
                    );
                }

                const rowKey = JSON.stringify(row); // Convert the row object to a string for comparison

                // Check if the row already exists in the uniqueRows map
                if (uniqueRows.has(rowKey)) {
                    duplicateRows.push(i + 1); // Add the duplicate row with row numbers to the array
                } else {
                    uniqueRows.set(rowKey, i + 1); // Add the row to the map with the current row number

                    // Check if the row already exists in the database
                    const existingRow = await store.getDuplicates(row);

                    if (!existingRow) {
                        rowsToAdd.push(row); // Add the row to the rowsToAdd array
                    } else {
                        existingRows.push({
                            success: false,
                            message: existingRow,
                            rowNumber: i + 1,
                        }); // Add the existing row with row number to the array
                    }
                }
            }

            if (duplicateRows.length > 0) {
                throw new FileUploadError(
                    "Duplicate rows found in Excel",
                    duplicateRows
                );
            }

            // If no duplicate rows or existing rows, store all the rows in the database
            const rowsAdded = [];
            for (const row of rowsToAdd) {
                await store.add(row);
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
            const id = await store.getByUUID(uuid);
            if (!id) {
                throw new NotFoundError("ID Not Found");
            }
            const result = store.update(uuid, body);
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
            const monthGraph = await store.getMonthGraph(
                region,
                startDate,
                endDate,
                search
            );
            const totalGraph = await store.getTotalGraph(
                region,
                startDate,
                endDate,
                search
            );
            if (!monthGraph && !totalGraph) {
                monthGraph = [];
                totalGraph = [];
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

module.exports = NurseryService;
