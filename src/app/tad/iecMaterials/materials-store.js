const { query } = require('express');
const moment = require('moment-timezone');
const TableConfig = require("../../../configuration/materialsTableConfig");

class MaterialsStore {
  constructor(db) {
    this.db = db;
    this.table = TableConfig.tableName;
    this.cols = TableConfig.columnNames;
  }

  async add(row) {
    return await this.db(this.table).insert({
      report_date: row["Report Date"],
      title_of_iec_material: row["Title of IEC Material"],
      no_of_copies_distributed: row["No. of Copies Distributed"],
      name_of_trainee: row["Name of Trainee"],
      region: row["Region"],
      province: row["Province"],
      district: row["District"],
      municipality: row["Municipality"],
      barangay: row["Barangay"],
      age: row["Age"],
      gender: row["Gender"],
      birthdate: row["Birthdate"],
      category: row["Category"],
      date_distributed: row["Date Distributed"],
      remarks: row["Remarks"],
      imported_by: row.imported_by, // Assign the import_by field from the row object
    });
  }

  async update(uuid, body) {
    // Perform the update operation
    await this.db(this.table).where(this.cols.id, uuid).update({
      report_date: body.report_date,
      title_of_iec_material: body.title_of_iec_material,
      no_of_copies_distributed: body.no_of_copies_distributed,
      name_of_trainee: body.name_of_trainee,
      region: body.region,
      province: body.province,
      district: body.district,
      municipality: body.municipality,
      barangay: body.barangay,
      age: body.age,
      gender: body.gender,
      birthdate: body.birthdate,
      category: body.category,
      date_distributed: body.date_distributed,
      remarks: body.remarks
    });

    // Fetch the updated rows
    const updatedRows = await this.db(this.table)
      .where(this.cols.id, uuid)
      .select("*")
      .first();

    return updatedRows;
  }

  async getExisting(row) {
    const excludedFields = ["imported_by", "District"];
    const query = this.db(this.table);
    for (const [column, value] of Object.entries(row)) {
      const columnName = column
        .toLowerCase()
        .replace(/ /g, "_")
        .replace("/", "")
        .replace("(", "")
        .replace(")", "")
        .replace(".", "");
      if (!excludedFields.includes(column)) {
        query.where(columnName, value);
      }
    }
    const existingRows = await query.select("*");
    return existingRows.length > 0 ? existingRows : null;
  }

  async getByUUID(uuid) {
    const results = await this.db(this.table)
      .select()
      .where(this.cols.id, uuid);
    const convertedResults = convertDatesToTimezone(results, [
      this.cols.reportDate,
      this.cols.dateDistributed,
      this.cols.birthdate
    ]);
    return convertedResults;
  }

  async getAll() {
    const results = await this.db(this.table)
      .select()
      .orderBy([
        { column: this.cols.region },
        { column: this.cols.reportDate, order: "desc" },
      ]);
    if (!results) {
      return null;
    }
    const convertedResults = convertDatesToTimezone(results, [
      this.cols.reportDate,
      this.cols.dateDistributed,
      this.cols.birthdate
    ]);
    const columnNames = await this.db(this.table)
      .columnInfo()
      .then((columns) => Object.keys(columns));
    return results.length > 0 ? convertedResults : { columnNames };
  }

  async delete(uuid) {
    const deletedRows = await this.db(this.table)
      .where(this.cols.id, uuid)
      .select("*")
      .first();
    await this.db(this.table).where(this.cols.id, uuid).del();
    return deletedRows;
  }

  async getMaxDate() {
    const result = await this.db(this.table)
      .max(`${this.cols.reportDate} as max_date`)
      .first();
    if (result.max_date === null) {
      return null;
    }
    const convertedResults = convertDatesToTimezone([result], ["max_date"]);
    return convertedResults[0].max_date;
  }

  // async getGraph(region, startDate, endDate, search) {
  //   const formattedStartDate = formatDate(startDate);
  //   const formattedEndDate = formatDate(endDate);
  //   const maxDate = await this.getMaxDate();
  //   const firstDate = firstDateOfMonth(maxDate);
  //   const lastDate = lastDateOfMonth(maxDate);
  //   const query = this.db(this.table)
  //     .select(this.cols.titleOfIECMaterial)
  //     .select(this.db.raw(`CONCAT(MONTHNAME(report_date), YEAR(report_date)) AS month_year`))
  //     .sum(`${this.cols.noOfCopiesDistributed} AS copies_distributed`)
  //     .groupBy(
  //       this.cols.titleOfIECMaterial,
  //       this.db.raw(`CONCAT(MONTHNAME(report_date), YEAR(report_date))`),
  //       this.cols.reportDate
  //     )
  //     .orderBy(this.cols.reportDate);
  //   if (startDate && endDate) {
  //     query.whereBetween(this.cols.reportDate, [formattedStartDate, formattedEndDate]);
  //   } else {
  //     query.whereBetween(this.cols.reportDate, [firstDate, lastDate]);
  //   }
  //   if (region) {
  //     query.where(this.cols.region, region);
  //   }
  //   if (search) {
  //     const columns = await this.db(this.table).columnInfo(); // Retrieve column information
  //     query.andWhere((builder) => {
  //       builder.where((innerBuilder) => {
  //         Object.keys(columns).forEach((column) => {
  //           innerBuilder.orWhere(column, 'like', `%${search}%`);
  //         });
  //       });
  //     });
  //   }
  //   const formattedResult = await query.then((rows) => {
  //     const formattedData = rows.reduce((acc, curr) => {
  //       const index = acc.findIndex((item) => item.name === curr.title_of_iec_material);
  //       if (index !== -1) {
  //         acc[index].months[curr.month_year] = curr.copies_distributed;
  //       } else {
  //         acc.push({
  //           name: curr.title_of_iec_material,
  //           months: {
  //             [curr.month_year]: curr.copies_distributed,
  //           },
  //         });
  //       }
  //       return acc;
  //     }, []);
  //     const updatedFormattedData = formattedData.map((item) => {
  //       const months = item.months;
  //       const total = Object.values(months).reduce((acc, value) => acc + parseInt(value), 0);
  //       return { ...item, months: { ...months, total } };
  //     });
  //     return updatedFormattedData;
  //   });
  //   return formattedResult;
  // }

  async getLineGraph(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = sixMonthBehindDate(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const query = this.db(this.table)
      .select(this.cols.titleOfIECMaterial)
      .select(
        this.db.raw(
          `CONCAT(MONTHNAME(report_date), YEAR(report_date)) AS month_year`
        )
      )
      .sum(`${this.cols.noOfCopiesDistributed} AS copies_distributed`)
      .groupBy(
        this.cols.titleOfIECMaterial,
        this.db.raw(`CONCAT(MONTHNAME(report_date), YEAR(report_date))`),
        this.cols.reportDate
      )
      .orderBy(this.cols.reportDate);
    if (startDate && endDate) {
      query.whereBetween(this.cols.reportDate, [
        formattedStartDate,
        formattedEndDate,
      ]);
    } else {
      query.whereBetween(this.cols.reportDate, [firstDate, lastDate]);
    }
    if (region) {
      query.where(this.cols.region, region);
    }
    if (search) {
      const columns = await this.db(this.table).columnInfo();
      query.andWhere((builder) => {
        builder.where((innerBuilder) => {
          Object.keys(columns).forEach((column) => {
            innerBuilder.orWhere(column, "like", `%${search}%`);
          });
        });
      });
    }
    const formattedResult = await query.then((rows) => {
      const formattedData = rows.reduce((acc, curr) => {
        const index = acc.findIndex(
          (item) => item.id === curr.title_of_iec_material
        );
        if (index !== -1) {
          acc[index].data.push({
            x: curr.month_year,
            y: curr.copies_distributed,
          });
        } else {
          acc.push({
            id: curr.title_of_iec_material,
            data: [
              {
                x: curr.month_year,
                y: curr.copies_distributed,
              },
            ],
          });
        }
        return acc;
      }, []);

      // Find unique x values
      const uniqueXValues = new Set();
      formattedData.forEach((item) => {
        item.data.forEach((dataPoint) => {
          uniqueXValues.add(dataPoint.x);
        });
      });

      // Add missing x values with y = 0
      formattedData.forEach((item) => {
        const missingXValues = Array.from(uniqueXValues).filter(
          (x) => !item.data.find((dataPoint) => dataPoint.x === x)
        );
        missingXValues.forEach((x) => {
          item.data.push({ x, y: 0 });
        });

        // Sort data array based on x values
        item.data.sort((a, b) => {
          const dateA = new Date(a.x);
          const dateB = new Date(b.x);
          return dateA - dateB;
        });
      });

      return formattedData;
    });

    return formattedResult;
  }

  async getBarGraph(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = sixMonthBehindDate(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const query = this.db(this.table)
      .select(this.cols.titleOfIECMaterial)
      .select(
        this.db.raw(
          `CONCAT(MONTHNAME(report_date), YEAR(report_date)) AS month_year`
        )
      )
      .sum(`${this.cols.noOfCopiesDistributed} AS copies_distributed`)
      .groupBy(
        this.cols.titleOfIECMaterial,
        this.db.raw(`CONCAT(MONTHNAME(report_date), YEAR(report_date))`),
        this.cols.reportDate
      )
      .orderBy(this.cols.reportDate);
    if (startDate && endDate) {
      query.whereBetween(this.cols.reportDate, [
        formattedStartDate,
        formattedEndDate,
      ]);
    } else {
      query.whereBetween(this.cols.reportDate, [firstDate, lastDate]);
    }
    if (region) {
      query.where(this.cols.region, region);
    }
    if (search) {
      const columns = await this.db(this.table).columnInfo();
      query.andWhere((builder) => {
        builder.where((innerBuilder) => {
          Object.keys(columns).forEach((column) => {
            innerBuilder.orWhere(column, "like", `%${search}%`);
          });
        });
      });
    }

    const formattedResult = await query.then((rows) => {
      const formattedData = rows.reduce((acc, curr) => {
        const index = acc.findIndex(
          (item) => item.name === curr.title_of_iec_material
        );
        if (index !== -1) {
          acc[index][curr.month_year] = curr.copies_distributed;
        } else {
          acc.push({
            name: curr.title_of_iec_material,
            [curr.month_year]: curr.copies_distributed,
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
    const maxDate = await this.getMaxDate();
    const firstDate = firstDateOfMonth(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const query = this.db(this.table)
      .select()
      .orderBy([
        { column: this.cols.region },
        { column: this.cols.reportDate, order: "desc" },
      ]);
    if (!maxDate) {
      return [];
    }
    if (startDate && endDate) {
      query.whereBetween(this.cols.reportDate, [
        formattedStartDate,
        formattedEndDate,
      ]);
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
            innerBuilder.orWhere(column, "like", `%${search}%`);
          });
        });
      });
    }
    const results = await query; // Execute the query and retrieve the results
    const convertedResults = convertDatesToTimezone(
      results.map((row) => row),
      [this.cols.reportDate, this.cols.dateDistributed, this.cols.birthdate]
    );
    return convertedResults;
  }

  async totalBeneficiary(region, startDate, endDate, search) {
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    const maxDate = await this.getMaxDate();
    const firstDate = firstDateOfMonth(maxDate);
    const lastDate = lastDateOfMonth(maxDate);
    const result = await this.db(this.table)
      .count(`${this.cols.barangay} AS count`)
      .where((query) => {
        if (!maxDate) {
          query.whereRaw("false");
        } else if (startDate && endDate) {
          query.whereBetween(this.cols.reportDate, [
            formattedStartDate,
            formattedEndDate,
          ]);
        } else {
          query.whereBetween(this.cols.reportDate, [firstDate, lastDate]);
        }

        if (region) {
          query.where(this.cols.region, region);
        }

        if (search) {
          query.andWhere((builder) => {
            Object.values(this.cols).forEach((column) => {
              builder.orWhere(column, "like", `%${search}%`);
            });
          });
        }
      })
      .first();
    const count = result ? result.count : 0;
    return count;
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

function sixMonthBehindDate(date) {
  const sixMonthsAgo = moment(date).subtract(6, "months");
  const firstDate = sixMonthsAgo.startOf("month").format("YYYY-MM-DD");
  return firstDate;
}

function firstDateOfMonth(date) {
  const firstDate = moment(date).startOf('month').format('YYYY-MM-DD');
  return firstDate;
}

function lastDateOfMonth(date) {
  const lastDate = moment(date).endOf('month').format('YYYY-MM-DD');
  return lastDate;
}

module.exports = MaterialsStore;
//SELECT * FROM accounts WHERE username like %:match% OR role like %:match%"