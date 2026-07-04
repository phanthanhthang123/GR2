'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      Comment.belongsTo(models.Task, {
        foreignKey: 'task_id',
        as: 'task'
      });
      Comment.belongsTo(models.Users, {
        foreignKey: 'user_id',
        as: 'user'
      });
      Comment.hasMany(models.Comment, {
        foreignKey: 'parent_id',
        as: 'replies'
      });
      Comment.belongsTo(models.Comment, {
        foreignKey: 'parent_id',
        as: 'parent'
      });
    }
  }
  Comment.init({
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    task_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'Tasks',
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
    parent_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'Comments',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Comment',
    tableName: 'Comments',
    timestamps: true,
    underscored: false
  });
  return Comment;
};

