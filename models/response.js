const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const questionResponse = require('./shared.js').questionResponse

let responseSchema = mongoose.Schema({
  respondent: {
    type: String,
    ref: 'Respondent',
    required: true
  },
  survey: {
    type: ObjectId,
    ref: 'Survey',
    required: true
  },
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
  responseTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  questionAnswers: [questionResponse]
})

responseSchema.index({respondent: 1, survey: 1, surveySet: 1, cohort: 1}, {unique: true, name: 'Unique Responses'})

const Response = mongoose.model('Response', responseSchema)

module.exports = Response
