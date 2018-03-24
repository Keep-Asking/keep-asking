let mongoose = require('mongoose')

const shared = require('./shared.js')

let cohortSchema = mongoose.Schema({
  name: shared.requiredTrimmedString,
  owner: shared.requiredTrimmedString,
  members: [String],
  archived: Boolean,
  demographicQuestions: [shared.question]
})

let Cohort = mongoose.model('Cohort', cohortSchema)

module.exports = Cohort
