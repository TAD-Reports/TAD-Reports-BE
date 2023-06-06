const { query } = require('express');
const moment = require('moment-timezone');
const trainingTableConfig = require('../../configuration/trainingTableConfig');

class TrainingStore {
  constructor(db) {
    this.db = db;
    this.table = trainingTableConfig.tableName;
    this.cols = trainingTableConfig.columnNames;
  }

  async add(row) {
    return await this.db(this.table).insert({
      report_date: row['Report Date'],
      conduct_of_training: row['Conduct of Training'],
      region: row['Region'],
      province: row['Province'],
      district: row['District'],
      municipality: row['Municipality'],
      barangay: row['Barangay'],
      gender: row['Gender'],
      age_group: row['Age Group'],
      venue: row['Venue'],
      start_date: row['Start Date'],
      end_date: row['End Date'],
      participants: row['Participants'],
      remarks: row['Remarks'],
      imported_by: row.imported_by, // Assign the import_by field from the row object
    });
  }


  async update(uuid, body) {
    // Perform the update operation
    await this.db(this.table)
      .where(this.cols.id, uuid)
      .update({
        report_date: body.reportDate,
        conduct_of_training: body.training,
        region: body.region,
        province: body.province,
        district: body.district,
        municipality: body.municipality,
        barangay: body.barangay,
        gender: body.gender,
        age_group: body.ageGroup,
        venue: body.venue,
        start_date: body.startDate,
        end_date: body.endDate,
        participants: body.participants,
        remarks: body.remarks,
      });

    // Fetch the updated rows
    const updatedRows = await this.db(this.table)
      .where(this.cols.id, uuid)
      .select('*')
      .first();

    return updatedRows;
  }


  async getExisting(row) {
    const excludedFields = ["District", "Remarks"];
    const query = this.db(this.table);
    for (const [column, value] of Object.entries(row)) {
      const columnName = column.toLowerCase().replace(/ /g, '_').replace('/', '').replace('(', '').replace(')', '');
      if (!excludedFields.includes(column)) {
        query.where(columnName, value);
      }
    }
    const existingRows = await query.select('*');
    return existingRows.length > 0 ? existingRows : null;
  }


  async getByUUID(uuid) {
    const results = await this.db(this.table)
      .select()
      .where(this.cols.id, uuid);
    const convertedResults = convertDatesToTimezone(results, [this.cols.reportDate, this.cols.startDate, this.endDate]);
    return convertedResults;
  }


  async getAll() {
    const results = await this.db(this.table)
      .select()
      .orderBy([
        { column: this.cols.region },
        { column: this.cols.reportDate, order: 'desc' }
      ]);
    const convertedResults = convertDatesToTimezone(results, [this.cols.reportDate, this.cols.startDate, this.endDate]);
    return convertedResults;
  }



  async delete(uuid) {
    const deletedRows = await this.db(this.table)
      .where(this.cols.id, uuid)
      .select('*')
      .first();
    await this.db(this.table)
      .where(this.cols.id, uuid)
      .del();
    return deletedRows;
  }


  async getMaxDate() {
    const result = await this.db(this.table)
      .max(`${this.cols.reportDate} as max_date`)
      .first();
    const convertedResults = convertDatesToTimezone([result], ['max_date']);
    return convertedResults[0].max_date;
  }


  async getTotalGraph(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = firstDateOfMonth(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const query = this.db(this.table)
      .select(`${this.cols.gender} as name`)
      .sum(`${this.cols.participants} as total`)
      .groupBy(this.cols.gender);
    if (startDate && endDate) {
      query.whereBetween(this.cols.reportDate, [formattedStartDate, formattedEndDate]);
    } else {
      query.whereBetween(this.cols.reportDate, [firstDate, lastDate]);
    }
    if (region) {
      query.where(this.cols.region, region);
    }
    if (search) {
      const columns = await this.db(this.table).columnInfo(); // Retrieve column information
      query.andWhere((builder) => {
        builder.where((innerBuilder) => {
          Object.keys(columns).forEach((column) => {
            innerBuilder.orWhere(column, 'like', `%${search}%`);
          });
        });
      });
    }
    return await query;
  }


  async getMonthGraph(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = firstDateOfMonth(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const query = this.db(this.table)
      .select(this.cols.gender)
      .select(this.db.raw(`CONCAT(MONTHNAME(report_date), YEAR(report_date)) AS month_year`))
      .sum(`${this.cols.participants} AS area`)
      .groupBy(this.cols.gender, this.db.raw(`CONCAT(MONTHNAME(report_date), YEAR(report_date))`));

    if (startDate && endDate) {
      query.whereBetween(this.cols.reportDate, [formattedStartDate, formattedEndDate]);
    } else {
      query.whereBetween(this.cols.reportDate, [firstDate, lastDate]);
    }
    if (region) {
      query.where(this.cols.region, region);
    }
    if (search) {
      const columns = await this.db(this.table).columnInfo(); // Retrieve column information
      query.andWhere((builder) => {
        builder.where((innerBuilder) => {
          Object.keys(columns).forEach((column) => {
            innerBuilder.orWhere(column, 'like', `%${search}%`);
          });
        });
      });
    }

    const formattedResult = await query.then((rows) => {
      const formattedData = rows.reduce((acc, curr) => {
        const index = acc.findIndex((item) => item.name === curr.gender);
        if (index !== -1) {
          acc[index].months[curr.month_year] = curr.participants;
        } else {
          acc.push({
            name: curr.gender,
            months: {
              [curr.month_year]: curr.participants,
            },
          });
        }
        return acc;
      }, []);

      return formattedData;
    });

    return formattedResult;
  }


  async search(region, startDate, endDate, search) {
    //const formattedDate = formatDate(search); // Format the date string
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const query = this.db(this.table)
      .select()
      .orderBy([
        { column: this.cols.region },
        { column: this.cols.reportDate, order: 'desc' }
      ]);
    if (startDate && endDate) {
      query.whereBetween(this.cols.reportDate, [formattedStartDate, formattedEndDate]);
    }
    if (region) {
      query.where(this.cols.region, region);
    }
    if (search) {
      const columns = await this.db(this.table).columnInfo(); // Retrieve column information
      query.andWhere((builder) => {
        builder.where((innerBuilder) => {
          Object.keys(columns).forEach((column) => {
            innerBuilder.orWhere(column, 'like', `%${search}%`);
          });
        });
      });
    }
    const results = await query; // Execute the query and retrieve the results
    const convertedResults = convertDatesToTimezone(results.map(row => row), [this.cols.reportDate, this.cols.startDate, this.cols.endDate]);
    return convertedResults;
  }
}

function formatDate(dateString) {
  const date = moment(dateString, 'YYYY/MM/DD', true); // Use moment.js to parse the date
  if (!date.isValid()) {
    console.log("Invalid Date! Use this format YYYY/MM/DD");
    return ("");
  }
  return date.format('YYYY-MM-DD');
}

function convertDatesToTimezone(rows, dateFields) {
  return rows.map(row => {
    const convertedFields = {};
    dateFields.forEach(field => {
      const convertedDate = moment.utc(row[field]).tz('Asia/Singapore').format('YYYY-MM-DD');
      convertedFields[field] = convertedDate;
    });
    return { ...row, ...convertedFields };
  });
}

function firstDateOfMonth(date) {
  const firstDate = moment(date).startOf('month').format('YYYY-MM-DD');
  return firstDate;
}


function lastDateOfMonth(date) {
  const lastDate = moment(date).endOf('month').format('YYYY-MM-DD');
  return lastDate;
}



module.exports = TrainingStore;


//SELECT * FROM accounts WHERE username like %:match% OR role like %:match%"