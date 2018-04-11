const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const surveySchema = mongoose.Schema({
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
