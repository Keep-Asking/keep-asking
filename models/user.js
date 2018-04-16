const mongoose = require('mongoose')
const findOrCreate = require('mongoose-findorcreate')
const Cohort = mongoose.model('Cohort')
const requiredTrimmedString = require('./shared.js').requiredTrimmedString

const userSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true,
    lowercase: true,
    alias: 'username',
    trim: true
  },
  provider: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: {
    familyName: {
      type: String,
      trim: true
    },
    givenName: {
      type: String,
      trim: true
    }
  },
  email: requiredTrimmedString,
  admin: Boolean
})

userSchema.plugin(findOrCreate)

userSchema.virtual('fullName').get(function () {
  if (this.name && this.name.givenName && this.name.familyName) {
    return this.name.givenName + ' ' + this.name.familyName
  }
  return this.email
})

userSchema.method('getCohortCount', function (query) {
  if (!query) {
    query = {}
  }
  query.owners = this.username
  return Cohort.count(query).exec()
})

userSchema.method('getCohorts', function (includeArchivedCohorts) {
  let matchConditions = {owners: this.username}
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
