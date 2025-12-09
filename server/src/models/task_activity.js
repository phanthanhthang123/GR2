'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task_Activity extends Model {
    static associate(models) {
      Task_Activity.belongsTo(models.Task, {
        foreignKey: 'task_id',
        as: 'task'
      });
      Task_Activity.belongsTo(models.Users, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }
  Task_Activity.init({
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
      allowNull: true
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Task_Activity',
    tableName: 'Task_Activities',
    timestamps: true,
    underscored: false
  });
  return Task_Activity;
};

