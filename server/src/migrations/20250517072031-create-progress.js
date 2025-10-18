'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Progress', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      project_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      progress: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate:{
            min: 0,
            max: 100
        }
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Progress');
  }
}; 