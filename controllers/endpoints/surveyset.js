// Load Express
let express = require('express')
let router = express.Router()
let bodyParser = require('body-parser')
const SurveySet = require('./../../models/surveySet.js')
const Cohort = require('./../../models/cohort.js')
const Survey = require('./../../models/survey.js')

const millisecondsPerDay = 60 * 60 * 24 * 1000

// Handle creating and updating a surveySet
router.post('/update', bodyParser.urlencoded({ extended: true }), async function (req, res) {
  // Verify that a cohort owned by this user exists if cohort is provided
  if (!req.body.cohort) {
    return res.status(400).json({
      message: 'No cohort ID provided in the request'
    })
  }

  if (req.body.cohort) {
    const cohortCount = await Cohort.count({
      _id: req.body.cohort,
      owner: req.user.username
    })
    if (cohortCount === 0) {
      return res.status(404).json({
        message: 'No cohort with the provided id exists for this user'
      })
    }
  }

  // Create the owners surveySetDocument
  let surveySetDocument = {
    owner: req.user.username
  }

  // Map keys and values from req.body to surveySetDocument
  const keysToMap = ['name', 'sendDates', 'cohort', 'questions', 'responseAcceptancePeriod']
  keysToMap.forEach(function (key) {
    if (req.body[key]) {
      surveySetDocument[key] = req.body[key]
    }
  })

  // If no change to sendDates, we're done!
  if (!req.body.sendDates) {
    return res.sendStatus(200)
  }

  let surveySetID
  SurveySet.update({
    _id: req.body.survey || {$exists: false},
    owner: req.user.username
  }, surveySetDocument, {
    upsert: true
  }).then(function (query) {
    // Determine the ID of the surveySet we are saving / updating
    surveySetID = req.body.survey || query.upserted[0]._id

    // Remove any existing unsent surveys in this surveySet
    return Survey.remove({
      surveySet: surveySetID,
      sent: false
    })
  }).then(function () { // Create new Surveys for each of the sendDates
    // Determine whether we should be reminding for this survey
    if (req.body.responseAcceptancePeriod) {
      const responseAcceptancePeriod = Number.parseFloat(req.body.responseAcceptancePeriod)
      if (!Number.isNaN(responseAcceptancePeriod)) {
        const responseAcceptancePeriodMilliseconds = responseAcceptancePeriod * millisecondsPerDay
        var remindAfterMilliseconds = responseAcceptancePeriodMilliseconds * 0.5
      }
    }
    const surveyDates = req.body.sendDates.map(date => new Date(date))
    const surveyDocuments = surveyDates.filter(function (date) {
      return (date >= new Date())
    }).map(function (date) {
      const surveyDocument = {
        surveySet: surveySetID,
        cohort: req.body.cohort,
        owner: req.user.username,
        sendDate: date,
        sent: false
      }
      if (remindAfterMilliseconds) {
        surveyDocument.remindDate = new Date(date.getTime() + remindAfterMilliseconds)
      }
      return surveyDocument
    })
    return Survey.insertMany(surveyDocuments)
  }).then(function () {
    res.sendStatus(200)
  }).catch(function (err) {
    console.error(err)
    return res.sendStatus(500)
  })
})

router.get('/results', function (req, res) {
  if (!req.isAuthenticated()) {
    return res.sendStatus(403)
  }

  return SurveySet.count({ // Find the specified surveySet
    owner: req.user.username,
    cohort: req.query.cohortID,
    _id: req.query.surveySetID
  }).then(surveySetCount => {
    if (surveySetCount === 0) {
      return res.sendStatus(404)
    }

    // Constuct requested filter, if any
    try {
      if (req.query.filterQuestionID && req.query.filterQuestionValues) {
        const filterQuestionValues = JSON.parse(req.query.filterQuestionValues)
        if (filterQuestionValues.length > 0) {
          var filter = {
            questionID: req.query.filterQuestionID,
            questionValues: filterQuestionValues
          }
        }
      }
    } catch (error) {
      // Silently ignore this error. The JSON was malformed
    }

    return SurveySet.fetchSurveyResultData(req.query.cohortID, req.query.surveySetID, filter).then(surveySet => {
      return res.render('partials/resultsQuestionAnswers.ejs', {
        surveySet: surveySet
      })
    }).catch(err => {
      console.error(err)
      return res.sendStatus(500)
    })
  }).catch(err => {
    console.error(err)
    return res.sendStatus(500)
  })
})

module.exports = router
