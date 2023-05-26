const { query } = require('express');
const moment = require('moment-timezone');
const nurseryTableConfig = require('../../configuration/nurseryTableConfig');
const currentDate = moment().format('YYYY-MM-DD');

class NurseryStore {
  constructor(db) {
    this.db = db;
    this.table = nurseryTableConfig.tableName;
    this.cols = nurseryTableConfig.columnNames;
  }


  async add(row) {
    return await this.db(this.table).insert({
      report_date: row['Report Date'],
      funded_by: row['Funded by'],
      region: row['Region'],
      province: row['Province'],
      district: row['District'],
      municipality: row['Municipality'],
      barangay: row['Barangay'],
      complete_name_of_cooperator_organization: row['Complete Name of Cooperator/ Organization'],
      date_established: row['Date Established'],
      area_in_hectares_ha: row['Area in Hectares (ha)'],
      variety_used: row['Variety Used'],
      period_of_moa: row['Period of MOA'],
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
      const columnName = column.toLowerCase().replace(/ /g, '_').replace('/', '').replace('(', '').replace(')', '');
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
      .orderBy([
        { column: this.cols.region },
        { column: this.cols.reportDate, order: 'desc' }
      ]);
    const convertedResults = convertDatesToTimezone(results, [this.cols.reportDate, this.cols.establishedDate]);
    return convertedResults;
  }


  async delete(uuid) {
    return await this.db(this.table)
      .where(this.cols.id, uuid)
      .del();
  }

  async getMaxDate() {
    try {
      const result = await this.db(this.table)
        .max(`${this.cols.reportDate} as max_date`)
        .first();

      const convertedResults = convertDatesToTimezone([result], ['max_date']);
      return convertedResults[0].max_date;
    } catch (error) {
      return error
    }
  }

  
  async getTotalGraph(region, startDate, endDate, search) {
    try {
      const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = firstDateOfMonth(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
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
    } catch(error) {
      return error;
    }
    
  }

  
  async getMonthGraph(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = firstDateOfMonth(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const query = this.db(this.table)
      .select(this.cols.fundedBy)
      .select(this.db.raw(`CONCAT(MONTHNAME(report_date), YEAR(report_date)) AS month_year`))
      .sum(`${this.cols.area} AS area`)
      .groupBy(this.cols.fundedBy, this.db.raw(`CONCAT(MONTHNAME(report_date), YEAR(report_date))`));

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
        const index = acc.findIndex((item) => item.name === curr.funded_by);
        if (index !== -1) {
          acc[index].months[curr.month_year] = curr.area;
        } else {
          acc.push({
            name: curr.funded_by,
            months: {
              [curr.month_year]: curr.area,
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


module.exports = NurseryStore;


//SELECT * FROM accounts WHERE username like %:match% OR role like %:match%"