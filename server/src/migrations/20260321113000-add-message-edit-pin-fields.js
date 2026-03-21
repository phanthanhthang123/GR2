'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Messages');

    if (!table.edited_at) {
      await queryInterface.addColumn('Messages', 'edited_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!table.is_pinned) {
      await queryInterface.addColumn('Messages', 'is_pinned', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    if (!table.pinned_by) {
      await queryInterface.addColumn('Messages', 'pinned_by', {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('Messages');
    if (table.pinned_by) {
      await queryInterface.removeColumn('Messages', 'pinned_by');
    }
    if (table.is_pinned) {
      await queryInterface.removeColumn('Messages', 'is_pinned');
    }
    if (table.edited_at) {
      await queryInterface.removeColumn('Messages', 'edited_at');
    }
  },
};
