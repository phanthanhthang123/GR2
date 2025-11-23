'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project_Member extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Project_Member belongs to Project
      Project_Member.belongsTo(models.Project, {
        foreignKey: 'project_id',
        as: 'project'
      });

      // Project_Member belongs to User
      Project_Member.belongsTo(models.Users, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }
  Project_Member.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    project_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Projects',
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
  }, {
    sequelize,
    modelName: 'Project_Member',
    timestamps: true,
    underscored: false
  });
  
  return Project_Member;
};

