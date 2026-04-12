'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'kpiScore', {
      type: Sequelize.DECIMAL(10, 6),
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'kpiModelAtSignup', {
      type: Sequelize.STRING(1),
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'gpa', {
      type: Sequelize.DECIMAL(4, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'interviewScore', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'cvScore', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'yearsExperience', {
      type: Sequelize.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('Users', 'numProjectsPrior', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'kpiScore');
    await queryInterface.removeColumn('Users', 'kpiModelAtSignup');
    await queryInterface.removeColumn('Users', 'gpa');
    await queryInterface.removeColumn('Users', 'interviewScore');
    await queryInterface.removeColumn('Users', 'cvScore');
    await queryInterface.removeColumn('Users', 'yearsExperience');
    await queryInterface.removeColumn('Users', 'numProjectsPrior');
  },
};
