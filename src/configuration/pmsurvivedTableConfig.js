module.exports = {
    tableName: 'pmsurvived',
    columnNames: {
      id: 'uuid',
      reportDate: 'report_date',
      plantingMaterials: 'type_of_planting_materials',
      cooperator: 'name_of_cooperator_individual',
      region: 'region',
      province: 'province',
      district: 'district',
      municipality: 'municipality',
      barangay: 'barangay',
      pmestablishment: 'number_of_pm_available_during_establishment',
      variety: 'area_in_hectares_ha',
      dateReceived: 'date_received',
      pmPlanted: 'number_of_pm_planted',
      pmSurvived: 'number_of_pm_survived',
      stats: 'status',
      remarks: 'remarks',
      importedBy: 'imported_by'
      // Add other column names here if necessary
    },
  };