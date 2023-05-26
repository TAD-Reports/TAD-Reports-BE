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
      type_of_planting_materials: row['Type of planting Materials'],
      complete_name_of_cooperator_organization: row['Name of Cooperator/ Individual'],
      region: row['Region'],
      province: row['Province'],
      district: row['District'],
      municipality: row['Municipality'],
      barangay: row['Barangay'],
      establishment_no_of_pm: row['No. of PM available during Establishment'],
      variety: row['Variety'],
      distributed_no_of_pm: row['No. of PM Distributed'],
      recipient_name: row['Name of Recipient/ Bene'],
      beneficiary_address: row['Address eof Beneficiary'],
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
        complete_name_of_cooperator_organization: data.coopName,
        region: data.region,
        province: data.province,
        district: data.district,
        municipality: data.municipality,
        barangay: data.barangay,
        establishment_no_of_pm: data.establishmentPm,
        variety: data.variety,
        distributed_no_of_pm: data.distributedPm,
        recipient_name: data.recipient,
        beneficiary_address: data.beneAddress,
        gender: data.gender,
        category: data.category,
        remarks: data.remarks,
        status: data.status,
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
  

  async getCurrentMonthRecords(startOfMonth, endOfMonth) {
    const query = await this.db(this.table)
      .count(`${this.cols.reportDate} as count`)
      .whereBetween(this.cols.reportDate, [startOfMonth, endOfMonth]);
    return query;
  }


  async getTotalGraph(region, startDate, endDate, search) {
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
      firstDate = previousMonth(firstDateOfMonth());
      lastDate = previousMonth(lastDateOfMonth());
    }
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
      firstDate = previousMonth(firstDateOfMonth());
      lastDate = previousMonth(lastDateOfMonth());
    }
    const query = this.db(this.table)
      .select(this.cols.reportDate)
      .select(this.cols.typeOfMaterials)
      .groupBy(this.cols.reportDate)
      .groupBy(this.cols.typeOfMaterials)
      .select(this.db.raw(`SUM(${this.cols.distributedPm}) AS PM`));
    
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
    const graphData = [];
    results.forEach(row => {
      const month = moment(row.report_date).format('MMMYYYY');
      let existingData = graphData.find(item => item.name === row.type_of_planting_materials);
      if (!existingData) {
        existingData = {
          name: row.type_of_planting_materials,
          months: {},
        };
        graphData.push(existingData);
      }
      existingData.months[month] = row.distributed_no_of_pm;
    });
    return graphData;
  }

  
  async search(region, startDate, endDate, search) {
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
    const convertedResults = convertDatesToTimezone(results.map(row => row), [this.cols.reportDate]);
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

function firstDateOfMonth() {
  const firstDate = moment().startOf('month').format('YYYY-MM-DD');
  return firstDate;
}

function lastDateOfMonth() {
  const lastDate = moment().endOf('month').format('YYYY-MM-DD');
  return lastDate;
}

function previousMonth(date) {
  const previousMonth = moment(date).subtract(1, 'month').format('YYYY-MM-DD');
  return previousMonth;
}


module.exports = DistributionStore;