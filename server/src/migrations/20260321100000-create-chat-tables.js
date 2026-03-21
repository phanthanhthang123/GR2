'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Conversations', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      type: {
        type: Sequelize.ENUM('direct', 'group'),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      workspace_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Workspaces',
          key: 'id',
        },
      },
      created_by: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('Conversation_Members', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      conversation_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Conversations',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('owner', 'member'),
        defaultValue: 'member',
      },
      joined_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      last_read_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addConstraint('Conversation_Members', {
      fields: ['conversation_id', 'user_id'],
      type: 'unique',
      name: 'conversation_member_unique',
    });

    await queryInterface.createTable('Messages', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      conversation_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Conversations',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      sender_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('text', 'image', 'file', 'system'),
        defaultValue: 'text',
      },
      attachment_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      reply_to_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Messages',
          key: 'id',
        },
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('Call_Sessions', {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      conversation_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Conversations',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      caller_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      callee_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      mode: {
        type: Sequelize.ENUM('audio', 'video'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('ringing', 'accepted', 'rejected', 'ended', 'missed'),
        defaultValue: 'ringing',
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Call_Sessions');
    await queryInterface.dropTable('Messages');
    await queryInterface.removeConstraint('Conversation_Members', 'conversation_member_unique');
    await queryInterface.dropTable('Conversation_Members');
    await queryInterface.dropTable('Conversations');
  },
};
