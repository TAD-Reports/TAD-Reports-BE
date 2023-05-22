const { query } = require('express');
const moment = require('moment-timezone');
const pmsurvivedTableConfig = require('../../configuration/pmsurvivedTableConfig');
const currentDate = moment().format('YYYY-MM-DD');

class PmSurvivedStore {
  constructor(db) {
    this.db = db;
    this.table = pmsurvivedTableConfig.tableName;
    this.cols = pmsurvivedTableConfig.columnNames;
  }


  async add(row) {
    return await this.db(this.table).insert({
      report_date: row['Report Date'],
      type_of_planting_materials: row['Type of Planting Materials'],
      name_of_cooperator_individual: row['Name of Cooperator/ Individual'],
      region: row['Region'],
      province: row['Province'],
      district: row['District'],
      municipality: row['Municipality'],
      barangay: row['Barangay'],
      number_of_pm_available: row['Number of PM Available During Establishment'],
      variety: row['Variety'],
      date_received: row['Date Received'],
      number_of_pm_planted: row['Number of PM Planted'],
      number_of_pm_survived: row['Number of PM Survived'],
      remarks: row['Remarks'],
      status: 1, // Assuming 'status' is always 1
      imported_by: row.imported_by, // Assign the import_by field from the row object
    });
  }


  async update(uuid, body) {
    return await this.db(this.table)
      .where(this.cols.id, uuid)
      .update({
        report_date: body.reportDate,
        funded_by: body.fundedBy,
        region: body.region,
        province: body.province,
        district: body.district,
        municipality: body.municipality,
        barangay: body.barangay,
        complete_name_of_cooperator_organization: body.cooperator,
        date_established: body.establishedDate,
        area_in_hectares_ha: body.area,
        variety_used: body.variety,
        period_of_moa: body.moa,
        remarks: body.remarks,
        status: body.status, 
      });
  }


  async getDuplicates(row) {
    const query = this.db(this.table);
    for (const [column, value] of Object.entries(row)) {
      const columnName = column.toLowerCase().replace(/ /g, '_').replace('/', '').replace('(', '').replace(')', '').replace('.', '');
      query.where(columnName, value);
    }
    const existingRows = await query.select('*');
    return existingRows.length > 0 ? existingRows : null;
  }


  async getByUUID(uuid) {
    const results = await this.db(this.table)
      .select()
      .where(this.cols.id, uuid);
      const convertedResults = convertDatesToTimezone(results, [this.cols.reportDate, this.cols.establishedDate]);
      return convertedResults;
  }


  async getAll() {
    const results = await this.db(this.table)
      .select()
      .orderBy(this.cols.region)
      .orderBy(this.cols.reportDate);
    const convertedResults = convertDatesToTimezone(results, [this.cols.reportDate, this.cols.establishedDate]);
    return convertedResults;
  }


  async delete(uuid) {
    return await this.db(this.table)
      .where(this.cols.id, uuid)
      .del();
  }
  

  async getCurrentMonthRecords(startOfMonth, endOfMonth) {
    const query = await this.db(this.table)
      .count(`${this.cols.reportDate} as count`)
      .whereBetween(this.cols.reportDate, [startOfMonth, endOfMonth]);
    return query;
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
    let firstDate;
    let lastDate;
    const currentMonthRecordCount = await this.getCurrentMonthRecords(
      firstDateOfMonth(currentDate),
      lastDateOfMonth(currentDate)
    );
    if (currentMonthRecordCount[0].count > 0) {
      firstDate = firstDateOfMonth(currentDate);
      lastDate = lastDateOfMonth(currentDate);
    } else {
      const maxDate = await this.getMaxDate();
      console.log(maxDate);
      firstDate = firstDateOfMonth(maxDate);
      lastDate = lastDateOfMonth(maxDate);
    }
    const query = this.db(this.table)
      .select(`${this.cols.fundedBy} as name`)
      .sum(`${this.cols.area} as total`)
      .groupBy(this.cols.fundedBy);
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
    let firstDate;
    let lastDate;
    const currentMonthRecordCount = await this.getCurrentMonthRecords(
      firstDateOfMonth(),
      lastDateOfMonth()
    );
    if (currentMonthRecordCount[0].count > 0) {
      firstDate = firstDateOfMonth();
      lastDate = lastDateOfMonth();
    } else {
      const maxDate = await this.getMaxDate();
      console.log(maxDate);
      firstDate = firstDateOfMonth(maxDate);
      lastDate = lastDateOfMonth(maxDate);
    }
    const query = this.db(this.table)
      .select(this.cols.reportDate)
      .select(this.cols.fundedBy)
      .groupBy(this.cols.fundedBy)
      .groupBy(this.cols.reportDate)
      .select(this.db.raw(`SUM(${this.cols.area}) AS area`));
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
    const results = await query;
    // Data manipulation to divide sum_area by month
    const graphData = [];
    results.forEach(row => {
      const month = moment(row.report_date).format('MMMYYYY');
      let existingData = graphData.find(item => item.name === row.funded_by);
      if (!existingData) {
        existingData = {
          name: row.funded_by,
          months: {},
        };
        graphData.push(existingData);
      }
      existingData.months[month] = row.area;
    });
    return graphData;
  }

  
  async search(region, startDate, endDate, search) {
    //const formattedDate = formatDate(search); // Format the date string
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const query = this.db(this.table).select();
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
    const convertedResults = convertDatesToTimezone(results.map(row => row), [this.cols.reportDate, this.cols.establishedDate]);
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


module.exports = PmSurvivedStore;


//SELECT * FROM accounts WHERE username like %:match% OR role like %:match%"