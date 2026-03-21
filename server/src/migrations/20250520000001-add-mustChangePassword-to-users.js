'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Users');
    if (!table.mustChangePassword) {
      await queryInterface.addColumn('Users', 'mustChangePassword', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Users');
    if (table.mustChangePassword) {
      await queryInterface.removeColumn('Users', 'mustChangePassword');
    }
  },
};


