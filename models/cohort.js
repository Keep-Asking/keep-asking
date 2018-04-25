const mongoose = require('mongoose')

const shared = require('./shared.js')

const cohortSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Unnamed Cohort'
  },
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
  members: [{
    type: String,
    trim: true,
    lowercase: true,
    ref: 'Respondent'
  }],
  archived: Boolean,
  demographicQuestions: [shared.question]
})

const Cohort = mongoose.model('Cohort', cohortSchema)

module.exports = Cohort
