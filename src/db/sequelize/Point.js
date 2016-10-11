import Config from '../../Config'

export default function (sequelize, DataTypes) {
  return sequelize.define('Point', {
    lnglat: {
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: false
    },
    value: {
      type: DataTypes.ARRAY(DataTypes.DOUBLE),
      allowNull: false
    }
  }, Object.assign({}, Config.get().sequelize.modelOptions, {
    tableName: 'points',
    timestamps: false,
    indexes: [{
      fields: ['lnglat'],
      using: 'gist'
    }]
  }))
}
