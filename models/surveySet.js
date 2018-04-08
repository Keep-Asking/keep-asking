const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const moment = require('moment')

const shared = require('./shared.js')
const Survey = mongoose.model('Survey')
const Respondent = mongoose.model('Respondent')
const Response = mongoose.model('Response')

const surveySetSchema = mongoose.Schema({
  cohort: {
    type: ObjectId,
    required: true,
    ref: 'Cohort'
  },
  owner: shared.requiredTrimmedString,
  name: shared.requiredTrimmedString,
  sendDates: [Date],
  questions: [shared.question]
})

surveySetSchema.method('getSurveys', function (callback) {
  let thisSurveySet = this.toObject()
  const cohortID = this.cohort._id || this.cohort
  const surveySetID = this._id

  const initialPromises = [
    Survey.find({ // Find all of the surveys in this surveySet
      cohort: cohortID,
      surveySet: surveySetID
    }).sort({
      sendDate: 1
    }).exec(),
    Respondent.find({ // Find all of the respondents in this cohort
      cohort: cohortID
    }).exec()
  ]

  return new Promise((resolve, reject) => {
    Promise.all(initialPromises).then(results => {
      // Convert the surveys into regular JavaScript obejcts
      thisSurveySet.surveys = results[0].map(survey => {
        const thisSurvey = survey.toObject()
        thisSurvey.sendDateText = moment(thisSurvey.sendDate).format('D MMM Y')
        return thisSurvey
      })

      // Convert the respondents into regular JavaScript obejcts
      thisSurveySet.respondents = results[1].map(respondent => respondent.toObject())

      // Find all of the responses for each of the surveys
      const responsePromises = []
      for (let thisSurvey of thisSurveySet.surveys) {
        responsePromises.push(Response.find({
          cohort: cohortID,
          surveySet: surveySetID,
          survey: thisSurvey._id
        }).exec())
      }
      return Promise.all(responsePromises)
    }).then(responses => {
      for (let thisSurveyIndex in thisSurveySet.surveys) {
        thisSurveySet.surveys[thisSurveyIndex].responses = responses[thisSurveyIndex]
      }

      if (!callback) {
        return resolve(thisSurveySet)
      } else {
        return callback(null, thisSurveySet)
      }
    }).catch(err => {
      if (!callback) {
        return reject(err)
      } else {
        return callback(err)
      }
    })
  })
})

let SurveySet = mongoose.model('SurveySet', surveySetSchema)

module.exports = SurveySet
