'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Tasks', 'difficulty', {
      type: Sequelize.ENUM('Easy', 'Medium', 'Hard'),
      allowNull: false,
      defaultValue: 'Medium'
    });

    await queryInterface.addColumn('Tasks', 'pullRequestUrl', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Tasks', 'difficulty');
    await queryInterface.removeColumn('Tasks', 'pullRequestUrl');
  }
};

