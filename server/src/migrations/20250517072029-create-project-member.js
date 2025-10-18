'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Project_Members', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      project_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Projects',
          key: 'id'
        }
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      role: {
        type: Sequelize.ENUM('Leader', 'Manager', 'Developer'),
        defaultValue: 'Developer'
      },
      joined_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
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
    await queryInterface.dropTable('Project_Members');
  }
}; 