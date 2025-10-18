'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Users.init({
    id: {
      type : DataTypes.STRING,
      primaryKey : true,
      allowNull : false,
      unique : true
    },
    username: {
      type : DataTypes.STRING,
      allowNull : false
    },
    email: {
      type : DataTypes.STRING,
      allowNull : false,
      unique : true
    },
    password: { 
      type : DataTypes.STRING,
      allowNull : false
    },
    role: {
      type : DataTypes.ENUM('Admin', 'Leader', 'Member'),
      allowNull : false
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt : {
      type : DataTypes.DATE,
      allowNull : false
    },
    updatedAt : {
      type : DataTypes.DATE,
      allowNull : false
    }
  }, {
    sequelize,
    modelName: 'Users',
    timestamps: true,
    underscored: false
  });
  
  return Users;
};