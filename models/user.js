let mongoose = require('mongoose')
let Cohort = require('./cohort.js')

let userSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
    lowercase: true,
    alias: 'username',
    trim: true
  }
})

userSchema.method('getCohortCount', function (query) {
  if (!query) {
    query = {}
  }
  query.owner = this.username
  return Cohort.count(query).exec()
})

userSchema.method('getCohorts', function (includeArchivedCohorts) {
  let matchConditions = {owner: this.username}
  if (includeArchivedCohorts !== true) {
    matchConditions.archived = {$not: {$eq: true}}
  }

  return Cohort.aggregate([
    {
      $match: matchConditions
    }, {
      $project: {archived: 1, name: 1, membersCount: {$size: '$members'}, demographicQuestionsCount: {$size: '$demographicQuestions'}}
    }, {
      $sort: {name: 1}
    }, {
      $lookup: {
        from: 'surveysets', localField: '_id', foreignField: 'cohort', as: 'surveySets'
      }
    }
  ]).exec()
})

let User = mongoose.model('User', userSchema)

module.exports = User
