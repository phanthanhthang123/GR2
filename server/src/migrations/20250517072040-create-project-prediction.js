'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Project_Prediction', {
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
      estimated_completion_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      actual_completion_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      progress_percentage: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      delay_risk_level: {
        type: Sequelize.ENUM('Low', 'Medium', 'High'),
        defaultValue: 'Low'
      },
      delay_reason: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('Project_Prediction');
  }
}; 