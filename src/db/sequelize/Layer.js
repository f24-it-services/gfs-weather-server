import Config from '../../Config'

export default function (sequelize, DataTypes) {
  return sequelize.define('Layer', {
    data_set_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'layers_unique_idx'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'layers_unique_idx'
    },
    surface: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'layers_unique_idx'
    }
  }, Object.assign({}, Config.get().sequelize.modelOptions, {
    tableName: 'layers'
  }))
}
