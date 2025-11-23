'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Projects', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      leader_id: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      workspace_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Workspaces',
          key: 'id'
        }
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('Pending', 'In Progress', 'Completed'),
        defaultValue: 'Pending'
      },
      created_by: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Projects');
  }
}; 