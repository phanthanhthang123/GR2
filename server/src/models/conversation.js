'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    static associate(models) {
      Conversation.belongsTo(models.Workspaces, {
        foreignKey: 'workspace_id',
        as: 'workspace',
      });

      Conversation.belongsTo(models.Users, {
        foreignKey: 'created_by',
        as: 'creator',
      });

      Conversation.hasMany(models.Conversation_Member, {
        foreignKey: 'conversation_id',
        as: 'members',
      });

      Conversation.hasMany(models.Message, {
        foreignKey: 'conversation_id',
        as: 'messages',
      });

      Conversation.hasMany(models.Call_Session, {
        foreignKey: 'conversation_id',
        as: 'calls',
      });
    }
  }

  Conversation.init(
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM('direct', 'group'),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      workspace_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Workspaces',
          key: 'id',
        },
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'Conversation',
      tableName: 'Conversations',
      timestamps: true,
      underscored: false,
    }
  );

  return Conversation;
};
