let mongoose = require('mongoose')
let ObjectId = mongoose.Schema.Types.ObjectId

const requiredTrimmedString = {
  type: String,
  required: true,
  trim: true
}

let surveySetSchema = mongoose.Schema({
  cohort: {
    type: ObjectId,
    required: true,
    lowercase: true
  },
  owner: requiredTrimmedString,
  name: requiredTrimmedString,
  surveyURL: {
    type: String,
    lowercase: true,
    trim: true
  },
  sendDates: [Date],
  surveyQuestions: [
    {
      title: requiredTrimmedString,
      id: requiredTrimmedString,
      kind: {
        type: String,
        enum: ['text', 'scale', 'choice']
      },
      options: [String]
    }
  ]
})

let SurveySet = mongoose.model('SurveySet', surveySetSchema)

module.exports = SurveySet
