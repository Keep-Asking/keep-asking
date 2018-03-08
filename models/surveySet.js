let mongoose = require('mongoose')
let ObjectId = mongoose.Schema.Types.ObjectId
const Survey = require('./survey.js')

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

// Manage creation of Survey objects when the surveySet is updated
let updateSurveysHandler = function (updateResult) {
  const surveySetID = updateResult.result.upserted[0]._id

  let thisSurveySet

  SurveySet.findById(surveySetID).then(function (foundSurveySet) {
    thisSurveySet = foundSurveySet

    // Remove any existing unsent surveys in this surveySet
    return Survey.remove({
      surveySet: thisSurveySet._id,
      sent: false
    })
  }).then(function () { // Create new Surveys for each of the sendDates
    let surveyDates = thisSurveySet.sendDates
    let surveyDocuments = surveyDates.filter(function (date) {
      return (date instanceof Date && date >= new Date())
    }).map(function (date) {
      return {
        surveySet: thisSurveySet._id,
        cohort: thisSurveySet.cohort,
        sendDate: date,
        sent: false
      }
    })
    return Survey.insertMany(surveyDocuments)
  }).catch(function (err) {
    console.error('An error occured while automatically creating new surveys for an updated surveySet', err)
  })
}

// Bind the updateSurveysHandler to the update events
surveySetSchema.post('findOneAndUpdate', updateSurveysHandler)
surveySetSchema.post('update', updateSurveysHandler)

let SurveySet = mongoose.model('SurveySet', surveySetSchema)

module.exports = SurveySet
