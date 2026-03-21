'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Conversation_Member extends Model {
    static associate(models) {
      Conversation_Member.belongsTo(models.Conversation, {
        foreignKey: 'conversation_id',
        as: 'conversation',
      });

      Conversation_Member.belongsTo(models.Users, {
        foreignKey: 'user_id',
        as: 'user',
      });
    }
  }

  Conversation_Member.init(
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      conversation_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Conversations',
          key: 'id',
        },
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      role: {
        type: DataTypes.ENUM('owner', 'member'),
        defaultValue: 'member',
      },
      joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      last_read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Conversation_Member',
      tableName: 'Conversation_Members',
      timestamps: true,
      underscored: false,
    }
  );

  return Conversation_Member;
};
