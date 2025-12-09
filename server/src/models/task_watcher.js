'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task_Watcher extends Model {
    static associate(models) {
      Task_Watcher.belongsTo(models.Task, {
        foreignKey: 'task_id',
        as: 'task'
      });
      Task_Watcher.belongsTo(models.Users, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }
  Task_Watcher.init({
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    task_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Task_Watcher',
    tableName: 'Task_Watchers',
    timestamps: true,
    underscored: false
  });
  return Task_Watcher;
};

