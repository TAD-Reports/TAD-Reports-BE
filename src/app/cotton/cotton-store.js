const { query } = require('express');
const moment = require('moment-timezone');
const TableConfig = require('../../configuration/cottonTableConfig');

class CottonStore {
  constructor(db) {
    this.db = db;
    this.table = TableConfig.tableName;
    this.cols = TableConfig.columnNames;
  }

  async add(row) {
    return await this.db(this.table).insert({
      report_date: row['Report Date'],
      name_of_beneficiary: row['Name of Beneficiary'],
      region: row['Region'],
      province: row['Province'],
      district: row['District'],
      municipality: row['Municipality'],
      barangay: row['Barangay'],
      gender: row['Gender'],
      category: row['Category'],
      quantity_of_cotton_seeds_given: row['Quantity of Cotton Seeds Given'],
      area_planted_ha: row['Area Planted (ha)'],
      date_planted: row['Date Planted'],
      seed_cotton_harvested: row['Seed Cotton Harvested'],
      variety: row['Variety'],
      remarks: row['Remarks'],
      imported_by: row.imported_by, // Assign the import_by field from the row object
    });
  }

  async update(uuid, body) {
    // Perform the update operation
    await this.db(this.table)
      .where(this.cols.id, uuid)
      .update({
        report_date: body.report_date,
        name_of_beneficiary: body.name_of_beneficiary,
        region: body.region,
        province: body.province,
        district: body.district,
        municipality: body.municipality,
        barangay: body.barangay,
        gender: body.gender,
        category: body.category,
        quantity_of_cotton_seeds_given: body.quantity_of_cotton_seeds_given,
        area_planted_ha: body.area_planted_ha,
        date_planted: body.date_planted,
        seed_cotton_harvested: body.seed_cotton_harvested,
        variety: body.variety,
        remarks: body.remarks,
      });

    const updatedRows = await this.db(this.table)
      .where(this.cols.id, uuid)
      .select('*')
      .first();

    return updatedRows;
  }


  async getExisting(row) {
    const excludedFields = ["imported_by", "District", "Remarks"];
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
    const convertedResults = convertDatesToTimezone(results, [this.cols.reportDate, this.cols.datePlanted]);
    return convertedResults;
  }


  async getAll() {
    const results = await this.db(this.table)
      .select()
      .orderBy([
        { column: this.cols.region },
        { column: this.cols.reportDate, order: 'desc' }
      ]);
    const convertedResults = convertDatesToTimezone(results, [this.cols.reportDate, this.cols.datePlanted]);
    const columnNames = await this.db(this.table)
      .columnInfo()
      .then((columns) => Object.keys(columns));
    return results.length > 0 ? convertedResults : { columnNames };
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


  async getGraph(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = firstDateOfMonth(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const query = this.db(this.table)
      .select(this.cols.nameOfBeneficiary)
      .select(this.db.raw(`CONCAT(MONTHNAME(report_date), YEAR(report_date)) AS month_year`))
      .sum(`${this.cols.areaPlanted} AS area_planted`)
      .groupBy(
        this.cols.nameOfBeneficiary,
        this.db.raw(`CONCAT(MONTHNAME(report_date), YEAR(report_date))`),
        this.cols.reportDate
      )
      .orderBy(this.cols.reportDate);
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
        const index = acc.findIndex((item) => item.name === curr.name_of_beneficiary);
        if (index !== -1) {
          acc[index].months[curr.month_year] = curr.area_planted;
        } else {
          acc.push({
            name: curr.name_of_beneficiary,
            months: {
              [curr.month_year]: curr.area_planted,
            },
          });
        }
        return acc;
      }, []);
      const updatedFormattedData = formattedData.map((item) => {
        const months = item.months;
        const total = Object.values(months).reduce((acc, value) => acc + parseInt(value), 0);
        return { ...item, months: { ...months, total } };
      });
      return updatedFormattedData;
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
    const convertedResults = convertDatesToTimezone(results.map(row => row), [this.cols.reportDate, this.cols.datePlanted]);
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



module.exports = CottonStore;


//SELECT * FROM accounts WHERE username like %:match% OR role like %:match%"