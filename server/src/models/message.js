'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.Conversation, {
        foreignKey: 'conversation_id',
        as: 'conversation',
      });

      Message.belongsTo(models.Users, {
        foreignKey: 'sender_id',
        as: 'sender',
      });

      Message.belongsTo(models.Message, {
        foreignKey: 'reply_to_id',
        as: 'replyTo',
      });
    }
  }

  Message.init(
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
      sender_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('text', 'image', 'file', 'system'),
        defaultValue: 'text',
      },
      attachment_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      reply_to_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Messages',
          key: 'id',
        },
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      edited_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_pinned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pinned_by: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'Message',
      tableName: 'Messages',
      timestamps: true,
      underscored: false,
    }
  );

  return Message;
};
