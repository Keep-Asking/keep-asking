let mongoose = require('mongoose')
let ObjectId = mongoose.Schema.Types.ObjectId

let surveySetSchema = mongoose.Schema({
  cohort: {
    type: ObjectId,
    required: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    required: true
  }
})

let SurveySet = mongoose.model('SurveySet', surveySetSchema)

module.exports = SurveySet
