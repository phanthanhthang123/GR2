'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Project belongs to Workspace
      Project.belongsTo(models.Workspaces, {
        foreignKey: 'workspace_id',
        as: 'workspace'
      });

      // Project belongs to User (leader)
      Project.belongsTo(models.Users, {
        foreignKey: 'leader_id',
        as: 'leader'
      });

      // Project belongs to User (creator)
      Project.belongsTo(models.Users, {
        foreignKey: 'created_by',
        as: 'creator'
      });

      // Project has many Project_Members
      Project.hasMany(models.Project_Member, {
        foreignKey: 'project_id',
        as: 'members'
      });

      // Project has many Tasks
      Project.hasMany(models.Task, {
        foreignKey: 'project_id',
        as: 'tasks'
      });

      // Project has many Progress
      Project.hasMany(models.Progress, {
        foreignKey: 'project_id',
        as: 'progress'
      });

      // Project has one Project_Prediction
      Project.hasOne(models.Project_Prediction, {
        foreignKey: 'project_id',
        as: 'prediction'
      });
    }
  }
  Project.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    
    leader_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    workspace_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Workspaces',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Pending', 'In Progress', 'Completed'),
      defaultValue: 'Pending'
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Project',
    timestamps: true,
    // = true thì tự động thêm 2 cột createdAt và updatedAt vào bảng mặc dù migration không có 2 trường này
    // => file all sẽ tự select trong khi db ko có các table này  
    underscored: false
    //true => Sequelize sẽ tự động chuyển tên các trường mặc định (như createdAt, updatedAt)
    //và các field bạn định nghĩa từ dạng camelCase sang snake_case
  });
  
  return Project;
};
