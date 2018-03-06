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

  let getCohortsPromises = []

  getCohortsPromises.push(Cohort.aggregate([
    {
      $match: {owner: 'smclarke'}
    }, {
      $project: {archived: 1, name: 1, membersCount: {$size: '$members'}}
    }, {
      $sort: {name: 1}
    }, {
      $lookup: {
        from: 'surveysets', localField: '_id', foreignField: 'cohort', as: 'surveySets'
      }
    }
  ]).exec())

  getCohortsPromises.push(Cohort.count({owner: this.username, archived: true}).exec())

  Promise.all(getCohortsPromises).then(function (results) {
    callback(null, results[0], results[1])
  }).catch(function (error) {
    callback(error)
  })
})

let User = mongoose.model('User', userSchema)

module.exports = User
