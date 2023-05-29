const path = require('path');
const Logs = require("../logs/logs-store");
const {
  NotFoundError,
  BadRequestError,
  FileUploadError,
  errorHandler,
} = require("../../middlewares/errors");
const userId = 1;

class DownloadService {
  constructor(store) { }

  async getTemplate(req, res, next) {
    try {
      //const userId = req.auth.id; // Get user ID using auth
      const logs = new Logs(req.db);
      const templateFileName = req.params.filename;
      const templatePath = getTemplatePath(templateFileName);
      const moduleName = templateFileName.split("_")[0];

      // Check if the template file exists
      if (!templatePath) {
        throw new NotFoundError("Template file not found");
      }

      // Set the appropriate headers for the response
      res.setHeader(
        "Content-disposition",
        `attachment; filename=${templateFileName}.xlsx`
      );
      res.setHeader(
        "Content-type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      // Send the file in the response
      res.sendFile(templatePath, (err) => {
        if (err) {
          console.error("Error occurred while sending file:", err);
          next(err);
        } else {
          logs.add({
            uuid: userId,
            module: moduleName,
            action: `downloaded ${templateFileName}.xlsx`,
          });
          console.log(`File ${templateFileName}.xlsx sent successfully`);
        }
      });
    } catch (error) {
      console.error("Error occurred while downloading template:", error);
      next(error);
    }
  }
}

function getTemplatePath(templateFileName) {
  const templatePath = path.join(__dirname, '../../templates', templateFileName + '.xlsx');
  return templatePath;
}

module.exports = DownloadService;
