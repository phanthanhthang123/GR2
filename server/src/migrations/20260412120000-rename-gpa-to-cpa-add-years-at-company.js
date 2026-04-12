'use strict';

/** @param {import('sequelize').QueryInterface} queryInterface */
module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;
    const table = 'Users';
    const desc = await qi.describeTable(table).catch(() => null);
    if (!desc) return;

    if (desc.gpa && !desc.cpa) {
      await qi.renameColumn(table, 'gpa', 'cpa');
    } else if (!desc.cpa && !desc.gpa) {
      await qi.addColumn(table, 'cpa', {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: true,
      });
    }

    const after = await qi.describeTable(table);
    if (!after.yearsAtCompany) {
      await qi.addColumn(table, 'yearsAtCompany', {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const qi = queryInterface;
    const table = 'Users';
    const desc = await qi.describeTable(table).catch(() => null);
    if (!desc) return;

    if (desc.yearsAtCompany) {
      await qi.removeColumn(table, 'yearsAtCompany');
    }
    if (desc.cpa && !desc.gpa) {
      await qi.renameColumn(table, 'cpa', 'gpa');
    }
  },
};
