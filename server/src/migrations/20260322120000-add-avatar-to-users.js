'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'avatarUrl', {
      type: Sequelize.STRING(1024),
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'avatarPublicId', {
      type: Sequelize.STRING(512),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'avatarUrl');
    await queryInterface.removeColumn('Users', 'avatarPublicId');
  },
};
