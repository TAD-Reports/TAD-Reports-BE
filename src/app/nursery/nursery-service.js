const NurseryStore = require('./nursery-store');
const LogsStore = require('../logs/logs-store');
const XLSX = require('xlsx');
const { DateTime } = require('luxon');

class NurseryService {
  constructor(nurseryStore) {
  }

// Add Nursery
async addNursery(req, res) {
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

  // Convert the sheet data to JSON
  const jsonData = XLSX.utils.sheet_to_json(sheet);

  const uniqueRows = new Set(); // Set to store unique rows
  const duplicateRows = []; // Array to store duplicate rows

  try {
      // for (let i = 1; i < jsonData.length; i++) {
      // const row = jsonData[i];

    // Iterate over each row in the JSON data
    for (const row of jsonData) {
      // Add the import_by field from req.body
      row.imported_by = nursery.imported_by;

      // Convert the date format
      if (row['Month Report'] && typeof row['Month Report'] === 'number') {
        row['Month Report'] = convertExcelDate(row['Month Report']);
      }

      if (row['Date Established'] && typeof row['Date Established'] === 'number') {
        row['Date Established'] = convertExcelDate(row['Date Established']);
      }

      console.log('Row:', row); // Print the row data

      const rowKey = JSON.stringify(row); // Convert the row object to a string for comparison

      // Check if the row already exists in the uniqueRows set
      if (uniqueRows.has(rowKey)) {
        duplicateRows.push(row); // Add the duplicate row to the array
      } else {
        uniqueRows.add(rowKey); // Add the row to the set
      }
    }

    if (duplicateRows.length > 0) {
      return res.status(400).json({ error: "Duplicate rows found", duplicateRows });
    }

    // If no duplicate rows, store all the rows in the database
    for (const row of jsonData) {
      await nurseryStore.addNurseryRow(row);
    }

    return res.status(200).json({ 
      success: true,
      message: `${file.originalname} data imported successfully` 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add data to the database" });
  }
}

// Get Nursery
  async getNursery(req, res) {
    const nurseryStore = new NurseryStore(req.db);
    const uuid = req.params.uuid;
    const nursery = await nurseryStore.getNurseryByUUID(uuid);
    if (!nursery) {
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

// Get All Nursery
  async getAllNursery(req, res) {
    const nurseryStore = new NurseryStore(req.db);
    try{
      const nursery = await nurseryStore.getAllNursery();
      return res.status(200).send({
        success: true,
        data: nursery
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: 'Error fetching nursery',
        error: error
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