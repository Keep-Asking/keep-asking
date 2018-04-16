const mongoose = require('mongoose')

const shared = require('./shared.js')

const cohortSchema = mongoose.Schema({
  name: shared.requiredTrimmedString,
  owners: [{
    type: String,
    trim: true,
    lowercase: true,
    ref: 'User'
  }],
  pendingOwners: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  members: [String],
  archived: Boolean,
  demographicQuestions: [shared.question]
})

const Cohort = mongoose.model('Cohort', cohortSchema)

module.exports = Cohort
