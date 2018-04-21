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
  sendDate: {
    type: Date,
    required: true
  },
  sent: {
    type: Boolean,
    required: true,
    default: false
  },
  name: {
    type: String,
    trim: true
  },
  remindDate: Date,
  reminded: Boolean
})

const Survey = mongoose.model('Survey', surveySchema)

module.exports = Survey
