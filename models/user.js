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

userSchema.method('getCohorts', function (includeArchivedCohorts, callback) {
  if (typeof (includeArchivedCohorts) === 'function' && !callback) {
    callback = includeArchivedCohorts
  }

  let matchConditions = {owner: this.username}
  if (includeArchivedCohorts !== true) {
    matchConditions.archived = {$not: {$eq: true}}
  }

  Cohort.aggregate([{$match: matchConditions}, {$project: {name: 1, membersCount: {$size: '$members'}}}, {$sort: {name: 1}}], function (err, cohorts) {
    callback(err, cohorts)
  })
})

let User = mongoose.model('User', userSchema)

module.exports = User
