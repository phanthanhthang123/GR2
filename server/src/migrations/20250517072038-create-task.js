'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Tasks', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      project_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Projects',
          key: 'id'
        }
      },
      priority: {
        type: Sequelize.ENUM('Low', 'Medium', 'High'),
        allowNull: true
      },
      assigned_to: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('To Do', 'In Progress', 'Done'),
        allowNull: true
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.dropTable('Tasks');
  }
}; 