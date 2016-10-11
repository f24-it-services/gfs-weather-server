import Config from '../../Config'

export default function (sequelize, DataTypes) {
  return sequelize.define('DataSet', {
    generatedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'generated_date'
    },
    forecastedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'forecasted_date',
      unique: true
    }
  }, Object.assign({}, Config.get().sequelize.modelOptions, {
    tableName: 'datasets'
  }))
}
