'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Workspace_Members extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Workspace_Member belongs to Workspace
      Workspace_Members.belongsTo(models.Workspaces, {
        foreignKey: 'workspace_id',
        as: 'workspace'
      });

      // Workspace_Member belongs to User
      Workspace_Members.belongsTo(models.Users, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }
  Workspace_Members.init({
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    workspace_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Workspaces',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('Leader', 'Manager', 'Developer'),
      defaultValue: 'Developer'
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
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
    modelName: 'Workspace_Members',
    timestamps: true,
    underscored: false
  });
  
  return Workspace_Members;
};