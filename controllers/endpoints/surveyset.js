// Load Express
let express = require('express')
let router = express.Router()
let bodyParser = require('body-parser')
const SurveySet = require('./../../models/surveySet.js')
const Cohort = require('./../../models/cohort.js')

// Handle creating and updating a surveySet
router.post('/update', bodyParser.urlencoded({ extended: true }), async function (req, res) {
  console.log('Request arrived at /update')
  // Verify that a cohort owned by this user exists if cohort is provided
  console.log('req.body:', req.body)
  if (req.body.cohort) {
    let cohortCount = await Cohort.count({
      _id: req.body.cohort,
      owner: res.locals.user.username
    })
    if (cohortCount === 0) {
      console.log('cohortCount', cohortCount)
      return res.status(404).json({
        message: 'No cohort with the provided id exists for this user'
      })
    }
  }

  let surveySetDocument = {
    owner: res.locals.user.username
  }
  if (req.body.name) surveySetDocument.name = req.body.name
  if (req.body.surveyURL) surveySetDocument.surveyURL = req.body.surveyURL
  if (req.body.sendDates) surveySetDocument.sendDates = req.body.sendDates

  SurveySet.update({
    _id: req.body.id || {$exists: false},
    owner: res.locals.user.username
  }, surveySetDocument, {
    upsert: true
  }).then(function () {
    return res.sendStatus(200)
  }).catch(function (err) {
    console.error(err)
    return res.sendStatus(500)
  })
})

module.exports = router
