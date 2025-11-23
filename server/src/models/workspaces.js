'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Workspaces extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Workspace belongs to User (owner)
      Workspaces.belongsTo(models.Users, {
        foreignKey: 'owner_id',
        as: 'owner'
      });

      // Workspace has many Workspace_Members
      Workspaces.hasMany(models.Workspace_Members, {
        foreignKey: 'workspace_id',
        as: 'members'
      });

      // Workspace has many Projects
      Workspaces.hasMany(models.Project, {
        foreignKey: 'workspace_id',
        as: 'projects'
      });
    }
  }
  Workspaces.init({
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    owner_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Archived'),
      defaultValue: 'Active'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Workspaces',
    timestamps: true,
    underscored: false
  });
  
  return Workspaces;
};