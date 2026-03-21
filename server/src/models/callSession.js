'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Call_Session extends Model {
    static associate(models) {
      Call_Session.belongsTo(models.Conversation, {
        foreignKey: 'conversation_id',
        as: 'conversation',
      });

      Call_Session.belongsTo(models.Users, {
        foreignKey: 'caller_id',
        as: 'caller',
      });

      Call_Session.belongsTo(models.Users, {
        foreignKey: 'callee_id',
        as: 'callee',
      });
    }
  }

  Call_Session.init(
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
      caller_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      callee_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      mode: {
        type: DataTypes.ENUM('audio', 'video'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('ringing', 'accepted', 'rejected', 'ended', 'missed'),
        defaultValue: 'ringing',
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ended_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Call_Session',
      tableName: 'Call_Sessions',
      timestamps: true,
      underscored: false,
    }
  );

  return Call_Session;
};
