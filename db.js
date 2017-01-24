const knex = require('knex')

const db = knex({
  client: "mysql",
  connection: {
    host: "127.0.0.1",
    user: "node",
    password: "node" ,
    database: "Goodside"
  }
})

module.exports = db
