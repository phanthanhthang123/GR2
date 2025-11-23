'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Task belongs to Project
      Task.belongsTo(models.Project, {
        foreignKey: 'project_id',
        as: 'project'
      });

      // Task belongs to User (assigned_to)
      Task.belongsTo(models.Users, {
        foreignKey: 'assigned_to',
        as: 'assignedUser'
      });
    }
  }
  Task.init({
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    project_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Projects',
        key: 'id'
      }
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High'),
      allowNull: true
    },
    assigned_to: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('To Do', 'In Progress', 'Done'),
      allowNull: true
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Task',
    timestamps: true,
    underscored: false
  });
  return Task;
};

