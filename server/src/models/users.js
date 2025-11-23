'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // User has many Workspaces (as owner)
      Users.hasMany(models.Workspaces, {
        foreignKey: 'owner_id',
        as: 'ownedWorkspaces'
      });

      // User has many Workspace_Members
      Users.hasMany(models.Workspace_Members, {
        foreignKey: 'user_id',
        as: 'workspaceMemberships'
      });

      // User has many Project_Members
      Users.hasMany(models.Project_Member, {
        foreignKey: 'user_id',
        as: 'projectMemberships'
      });

      // User has many Projects (as leader)
      Users.hasMany(models.Project, {
        foreignKey: 'leader_id',
        as: 'ledProjects'
      });

      // User has many Projects (as creator)
      Users.hasMany(models.Project, {
        foreignKey: 'created_by',
        as: 'createdProjects'
      });

      // User has many Tasks (as assigned)
      Users.hasMany(models.Task, {
        foreignKey: 'assigned_to',
        as: 'assignedTasks'
      });

      // User has many Notifications
      Users.hasMany(models.Notification, {
        foreignKey: 'user_id',
        as: 'notifications'
      });
    }
  }
  Users.init({
    id: {
      type : DataTypes.STRING,
      primaryKey : true,
      allowNull : false,
      unique : true
    },
    username: {
      type : DataTypes.STRING,
      allowNull : false
    },
    email: {
      type : DataTypes.STRING,
      allowNull : false,
      unique : true
    },
    password: { 
      type : DataTypes.STRING,
      allowNull : false
    },
    role: {
      type : DataTypes.ENUM('Admin', 'Leader', 'Member'),
      allowNull : false
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt : {
      type : DataTypes.DATE,
      allowNull : false
    },
    updatedAt : {
      type : DataTypes.DATE,
      allowNull : false
    }
  }, {
    sequelize,
    modelName: 'Users',
    timestamps: true,
    underscored: false
  });
  
  return Users;
};