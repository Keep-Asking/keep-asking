require('dotenv').config()
require('./config.js')
require('./database.js')

const Survey = require('./../models/survey.js')

Survey.aggregate([
  {
    $find: {
      sendDate: {
        $lte: new Date()
      },
      sent: false
    },
    $
  }
]).exec().then(function (surveys) {
  console.log(surveys)
}).catch(function (err) {
  console.error(err)
})
