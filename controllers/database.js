let mongoose = require('mongoose')

let config = require('./config.js')
mongoose.connect(config.MongoDBURI)

var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  console.log('Connection to database established.')

  // let User = require('./../models/user.js')
  //
  // let newUser = new User({
  //   username: 'bob'
  // })
  // newUser.save(function (error) {
  //   if (error) {
  //     console.log(error)
  //   }
  //   console.log('end of save')
  // })
})
