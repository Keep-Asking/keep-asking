const mongoose = require('mongoose')

const shared = require('./shared.js')

const cohortSchema = mongoose.Schema({
  name: shared.requiredTrimmedString,
  owner: shared.requiredTrimmedString,
  members: [String],
  archived: Boolean,
  demographicQuestions: [shared.question]
})

const Cohort = mongoose.model('Cohort', cohortSchema)

module.exports = Cohort
