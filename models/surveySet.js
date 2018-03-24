let mongoose = require('mongoose')
let ObjectId = mongoose.Schema.Types.ObjectId

const shared = require('./shared.js')

let surveySetSchema = mongoose.Schema({
  cohort: {
    type: ObjectId,
    required: true,
    lowercase: true
  },
  owner: shared.requiredTrimmedString,
  name: shared.requiredTrimmedString,
  surveyURL: {
    type: String,
    lowercase: true,
    trim: true
  },
  sendDates: [Date],
  questions: [shared.question]
})

let SurveySet = mongoose.model('SurveySet', surveySetSchema)

module.exports = SurveySet
