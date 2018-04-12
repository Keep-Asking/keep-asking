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

surveySetSchema.statics.fetchSurveyResultData = function (cohortID, surveySetID, filter) {
  return SurveySet.findOne({ // Find the specified surveySet
    cohort: cohortID,
    _id: surveySetID
  }).populate('cohort').then(surveySet => {
    if (!surveySet) {
      return null
    }
    return surveySet.getSurveys()
  }).then(surveySet => {
    if (!surveySet) {
      return Promise.reject(new Error(404))
    }

    let respondentsIncludedByFilter
    if (filter) {
      respondentsIncludedByFilter = surveySet.respondents.filter(respondent => {
        if (!respondent.demographicQuestionResponses) {
          return false
        }

        const responseToFilteredQuestion = respondent.demographicQuestionResponses.find(questionResponse => questionResponse.id === filter.questionID)

        if (responseToFilteredQuestion && responseToFilteredQuestion.answer) {
          if (Array.isArray(responseToFilteredQuestion.answer)) {
            const responseToFilteredQuestionIncludesOneOfFilteredAnswers = responseToFilteredQuestion.answer.some(answer => filter.questionValues.includes(answer))
            if (responseToFilteredQuestionIncludesOneOfFilteredAnswers) {
              return true
            }
          } else if (typeof responseToFilteredQuestion.answer === 'string') {
            if (filter.questionValues.includes(responseToFilteredQuestion.answer)) {
              return true
            }
          }
        }
        return false
      }).map(respondent => respondent._id)
    }

    for (let question of surveySet.questions) {
      if (!question.responses) {
        question.responses = {}
      }
      for (let survey of surveySet.surveys) {
        let responsesToProcess
        if (respondentsIncludedByFilter) {
          responsesToProcess = survey.responses.filter(response => respondentsIncludedByFilter.includes(response.respondent))
        } else {
          responsesToProcess = survey.responses
        }
        for (let response of responsesToProcess) {
          const questionAnswer = response.questionAnswers.find(questionAnswer => questionAnswer.id === question.id)
          switch (question.kind) {
            case 'text':
              if (!question.responses[survey.sendDateText]) {
                question.responses[survey.sendDateText] = []
              }
              question.responses[survey.sendDateText].push(questionAnswer.answer)
              break
            case 'scale':
              if (!question.responses[survey.sendDateText]) {
                question.responses[survey.sendDateText] = new Array(5).fill(0)
              }
              question.responses[survey.sendDateText][parseInt(questionAnswer.answer) - 1]++
              break
            case 'choice':
              if (!question.responses[survey.sendDateText]) {
                question.responses[survey.sendDateText] = {}
                for (let option of question.options) {
                  question.responses[survey.sendDateText][option] = 0
                }
              }
              for (let answerOption of questionAnswer.answer) {
                question.responses[survey.sendDateText][answerOption]++
              }
              break
            case 'rank':
              if (!question.responses[survey.sendDateText]) {
                question.responses[survey.sendDateText] = {}
                for (let option of question.options) {
                  question.responses[survey.sendDateText][option] = []
                }
              }
              questionAnswer.answer.forEach((item, index) => {
                question.responses[survey.sendDateText][item].push(index + 1)
              })
              break
          }
        }
      }
    }

    return Promise.resolve(surveySet)
  })
}

let SurveySet = mongoose.model('SurveySet', surveySetSchema)

module.exports = SurveySet
