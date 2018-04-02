let mongoose = require('mongoose')
let ObjectId = mongoose.Schema.Types.ObjectId

// Require SurveySet for getting Cohort Members
const SurveySet = require('./surveySet.js')

let surveySchema = mongoose.Schema({
  surveySet: {
    type: ObjectId,
    ref: 'SurveySet',
    required: true
  },
  cohort: {
    type: ObjectId,
    ref: 'Cohort',
    required: true
  },
  owner: {
    type: String,
    ref: 'User',
    required: true
  },
  sendDate: {
    type: Date,
    required: true
  },
  sent: {
    type: Boolean,
    required: true,
    default: false
  }
})

const Survey = mongoose.model('Survey', surveySchema)

module.exports = Survey
