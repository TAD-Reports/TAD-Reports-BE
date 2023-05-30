const { query } = require('express');
const moment = require('moment-timezone');
const distributionTableConfig = require('../../configuration/distributionTableConfig');

class DistributionStore {
  constructor(db) {
    this.db = db;
    this.table = distributionTableConfig.tableName;
    this.cols = distributionTableConfig.columnNames;
  }

  async add(row) {
    return await this.db(this.table).insert({
      report_date: row['Report Date'],
      type_of_planting_materials: row['Type of Planting Materials'],
      name_of_cooperative_individual: row['Name of Cooperative/ Individual'],
      region: row['Region'],
      province: row['Province'],
      district: row['District'],
      municipality: row['Municipality'],
      barangay: row['Barangay'],
      no_of_pm_available_during_establishment: row['No. of PM available during Establishment'],
      variety: row['Variety'],
      no_of_pm_distributed: row['No. of PM Distributed'],
      name_of_recipient_bene: row['Name of Recipient/ Bene'],
      address_of_beneficiary: row['Address of Beneficiary'],
      gender: row['Gender'],
      category: row['Category'],
      remarks: row['Remarks'],
      status: 1, 
      imported_by: row.imported_by
    });
  }


  async update(uuid, data) {
    return await this.db(this.table)
      .where(this.cols.id, uuid)
      .update({
        report_date: data.reportDate,
        type_of_planting_materials: data.typeOfMaterials,
        name_of_cooperative_individual: data.coopName,
        region: data.region,
        province: data.province,
        district: data.district,
        municipality: data.municipality,
        barangay: data.barangay,
        no_of_pm_available_during_establishment: data.establishPm,
        variety: data.variety,
        no_of_pm_distributed: data.distributedPm,
        name_of_recipient_bene: data.recipient,
        address_of_beneficiary: data.beneAddress,
        gender: data.gender,
        category: data.category,
        remarks: data.remarks,
        status: data.status,
      });
  }

  
  async getExisting(row) {
    const excludedFields = ["District", "Remarks"];
    const query = this.db(this.table);
    for (const [column, value] of Object.entries(row)) {
      const columnName = column.toLowerCase().replace(/ /g, '_').replace('/', '').replace('.', '');
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
      const convertedResults = convertDatesToTimezone(results, [this.cols.reportDate]);
      return convertedResults;
  }


  async getAll() {
    const results = await this.db(this.table)
      .select()
      .orderBy(this.cols.region)
      .orderBy(this.cols.reportDate);
    const convertedResults = convertDatesToTimezone(results, [this.cols.reportDate]);
    return convertedResults;
  }


  async delete(uuid) {
    return await this.db(this.table)
      .where(this.cols.id, uuid)
      .del();
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
      .select(`${this.cols.typeOfMaterials} as name`)
      .sum(`${this.cols.distributedPm} as total`)
      .groupBy(this.cols.typeOfMaterials);
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
      .select(this.cols.typeOfMaterials)
      .select(this.db.raw(`CONCAT(MONTHNAME(report_date), YEAR(report_date)) AS month_year`))
      .sum(`${this.cols.distributedPm} AS distributed_pm`)
      .groupBy(this.cols.typeOfMaterials, this.db.raw(`CONCAT(MONTHNAME(report_date), YEAR(report_date))`));

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
        const index = acc.findIndex((item) => item.name === curr.type_of_planting_materials);
        if (index !== -1) {
          acc[index].months[curr.month_year] = curr.distributed_pm;
        } else {
          acc.push({
            name: curr.type_of_planting_materials,
            months: {
              [curr.month_year]: curr.distributed_pm,
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


module.exports = DistributionStore;