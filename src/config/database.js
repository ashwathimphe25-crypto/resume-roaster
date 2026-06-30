const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'demo',
  'root',
  'Ra:09tmm@69',
  {
    host: '127.0.0.1',
    dialect: 'mysql'
  }
);

module.exports = sequelize;