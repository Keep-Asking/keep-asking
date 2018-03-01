let mongoose = require('mongoose')
let ObjectId = mongoose.Schema.Types.ObjectId

let surveySchema = mongoose.Schema({
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

let Survey = mongoose.model('Survey', surveySchema)

let newSurvey = Survey({
  cohort: '5a98495d42c721f1b7841c68',
  name: 'Seminar Survey 2',
  active: true
})

newSurvey.save(function (err) {
  console.log(err)
})

module.exports = Survey
