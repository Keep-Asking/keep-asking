let mongoose = require('mongoose')
let ObjectId = mongoose.Schema.Types.ObjectId

let surveySetSchema = mongoose.Schema({
  cohort: {
    type: ObjectId,
    required: true,
    lowercase: true
  },
  owner: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  surveyURL: {
    type: String,
    lowercase: true,
    trim: true
  },
  sendDates: [Date]
})

let SurveySet = mongoose.model('SurveySet', surveySetSchema)

module.exports = SurveySet
