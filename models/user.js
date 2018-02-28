let mongoose = require('mongoose')
let Cohort = require('./cohort.js')

let userSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
    lowercase: true,
    alias: 'username'
  }
})

userSchema.method('getCohorts', function (callback) {
  Cohort.find({owner: this.username}, function (err, cohorts) {
    callback(err, cohorts)
  })
})

let User = mongoose.model('User', userSchema)

module.exports = User
