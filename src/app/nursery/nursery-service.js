const NurseryStore = require('./nursery-store');
const LogsStore = require('../logs/logs-store');
const XLSX = require('xlsx');
const { DateTime } = require('luxon');

class NurseryService {
  constructor(nurseryStore) {
  }
//ITO YUNG PANG IADJUST AND FIRST ROW OF DATA SA EXCEL
// for (let i = 1; i < jsonData.length; i++) {
// const row = jsonData[i];  

  // Add Nursery
  async add(req, res) {
    const nurseryStore = new NurseryStore(req.db);
    const logsStore = new LogsStore(req.db);
    const nursery = req.body;

    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Get the uploaded file and read its contents
    const file = req.file;
    const fileContents = file.buffer;

    // Read the Excel file
    const workbook = XLSX.read(fileContents, { type: 'buffer' });

    // Assuming the data is in the first sheet (index 0)
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // Find the header row index
    let headerRowIndex = 0;
    const range = XLSX.utils.decode_range(sheet['!ref']);
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
      if (cell && cell.v === 'Report Date') {
        headerRowIndex = row;
        break;
      }
    }

    // Convert the sheet data to JSON starting from the header row
    const jsonData = XLSX.utils.sheet_to_json(sheet, { range: headerRowIndex });

    const uniqueRows = new Map(); // Map to store unique rows with their row numbers
    const duplicateRows = []; // Array to store duplicate rows with their row numbers
    const existingRows = []; // Array to store existing rows with their row numbers

    try {
      // Iterate over each row in the JSON data
      const rowsToAdd = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];

        // Check if any required fields are empty
        if (!row['Report Date'] || !row['Funded by'] || !row['Region'] || !row['Province'] || !row['Municipality'] 
            || !row['Barangay'] || !row['Complete Name of Cooperator/ Organization'] || !row['Date Established'] 
            || !row['Area in Hectares (ha)'] || !row['Variety Used'] || !row['Period of MOA']) {
          return res.status(400).json({ 
            error: `Incomplete data found in Excel row ${i + headerRowIndex + 2 + ' or below'}` });
        }
        
        // Add the import_by field from req.body
        row.imported_by = nursery.imported_by;

        // Convert the date format
        if (row['Report Date'] && typeof row['Report Date'] === 'number') {
          row['Report Date'] = convertExcelDate(row['Report Date']);
        }

        if (row['Date Established'] && typeof row['Date Established'] === 'number') {
          row['Date Established'] = convertExcelDate(row['Date Established']);
        }

        const rowKey = JSON.stringify(row); // Convert the row object to a string for comparison

        // Check if the row already exists in the uniqueRows map
        if (uniqueRows.has(rowKey)) {
          duplicateRows.push(i + 1); // Add the duplicate row with row numbers to the array
        } else {
          uniqueRows.set(rowKey, i + 1); // Add the row to the map with the current row number

          // Check if the row already exists in the database
          const existingRow = await nurseryStore.getDuplicates(row);

          if (!existingRow) {
            rowsToAdd.push(row); // Add the row to the rowsToAdd array
          } else {
            existingRows.push({ row: existingRow, rowNumber: i + 1 }); // Add the existing row with row number to the array
          }
        }
      }

      if (duplicateRows.length > 0) {
        return res.status(400).json({ error: "Duplicate rows found in Excel", duplicateRows });
      }

      // If no duplicate rows or existing rows, store all the rows in the database
      const rowsAdded = [];
      for (const row of rowsToAdd) {
        await nurseryStore.add(row);
        rowsAdded.push(row);
      }

      return res.status(200).json({ 
        success: true,
        message: `${rowsAdded.length} rows are added from ${file.originalname} into the database`,
        data: rowsAdded,
        duplicates: existingRows.length
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ 
        error: "Failed to add data to the database" 
      });
    }
  }

  // Get Nursery
  async get(req, res) {
    const nurseryStore = new NurseryStore(req.db);
    const uuid = req.params.uuid;
    const nursery = await nurseryStore.getByUUID(uuid);
    if (nursery < 1) {
      return res.status(404).send({
        success: false,
        message: 'Nursery Data Not Found'
      });
    }
    return res.status(200).send({
      success: true,
      data: nursery
    });
  }

  // Delete a nursery
  async delete(req, res) {
    const nurseryStore = new NurseryStore(req.db);
    const uuid = req.params.uuid;
    try {
      const result = await nurseryStore.delete(uuid);
      if (result === 0) {
        return res.status(404).send({
          success: false,
          message: 'Nursery not found'
        });
      }
    } catch (error) {
      return res.status(500).send({ 
        success: false,
        message: 'Error deleting nursery',
        error: error
      });
    }
    return res.status(202).send({
      success: true,
      message: 'Nursery has been deleted'
    });
  }

  // Search by key
  // async search(req, res) {
  //   const nurseryStore = new NurseryStore(req.db);
  //   const key = req.query.key; // Get the key from query parameters
  //   let nursery;
  
  //   if (!key) {
  //     nursery = await nurseryStore.getAll();
  //   } else {
  //     nursery = await nurseryStore.searchByKey(key);
  //   }
  //   return res.status(200).send({
  //     success: true,
  //     data: nursery
  //   });
  // }

  // Get Graph Data
  async getData(req, res) {
    const nurseryStore = new NurseryStore(req.db);
    const region = req.query.region;
    const startDate = req.query.start;
    const endDate = req.query.end;
    const search = req.query.search;
    let table;
    
    try {
      const monthGraph = await nurseryStore.getMonthGraph(region, startDate, endDate);    
      const totalGraph = await nurseryStore.getTotalGraph(region, startDate, endDate);    
      if (!monthGraph && !totalGraph) {
        return res.status(404).send({
          success: false,
          message: 'Nursery Data Not Found'
        });
      }
      
      if (!region && !startDate && !endDate && !search) {
        table = await nurseryStore.getAll();
      } else {
        table = await nurseryStore.search(region, startDate, endDate, search);
      }
      
      return res.status(200).send({
        success: true,
        monthGraph: monthGraph,
        totalGraph: totalGraph,
        table: table
      });
    } catch (error) {
      return res.status(500).send({ 
        success: false,
        message: 'Error retrieving nursery data',
        error: error.message
      });
    }
  }
}

// Function to convert Excel date to "dd/mm/yyyy" format
function convertExcelDate(excelDate) {
  const baseDate = DateTime.fromObject({ year: 1900, month: 1, day: 1 });
  const convertedDate = baseDate.plus({ days: excelDate - 2 });
  return convertedDate.toFormat('yyyy/MM/dd');
}


module.exports = NurseryService;