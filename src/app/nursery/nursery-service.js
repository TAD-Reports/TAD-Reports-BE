const NurseryStore = require('./nursery-store');
const LogsStore = require('../logs/logs-store');

class NurseryService {
  constructor(nurseryStore) {
  }


//   //get File
//   async addFile(req, res) {
//     const distributionStore = new ClassroomStore(req.db);
//     const distribution = req.body;

//     // Check if a file was uploaded
//     if (!req.files || !req.files.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     // Get the uploaded file and read its contents
//     const file = req.files.file;
//     const fileContents = file.data;

//     // TODO: validate that the uploaded file is an xlsm file
//     // (e.g. by checking the file extension or using a library like XLSX)

//     try {
//       // Store the file in the database
//       await distributionStore.addFile(file.name, fileContents);
//       return res.json({ success: true });
//     } catch (err) {
//       console.error(err);
//       return res.status(500).json({ error: "Failed to add file to database" });
//     }
//   }
// }



// Add Nursery
  async getNursery(req, res) {
    const nurseryStore = new NurseryStore(req.db);
    const logsStore = new LogsStore(req.db);
    const nursery = req.body;
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
  async getNursery(req, res) {
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