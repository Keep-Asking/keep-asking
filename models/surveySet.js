let mongoose = require('mongoose')
let ObjectId = mongoose.Schema.Types.ObjectId

const shared = require('./shared.js')
const Survey = require('./survey.js')

const surveySetSchema = mongoose.Schema({
  cohort: {
    type: ObjectId,
    required: true,
    lowercase: true,
    ref: 'Cohort'
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

surveySetSchema.method('getSurveys', async function () {
  await Survey.find({
    surveySet: this._id
  })
})

let SurveySet = mongoose.model('SurveySet', surveySetSchema)

module.exports = SurveySet
