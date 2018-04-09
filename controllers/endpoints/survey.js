// Load Express
const express = require('express')
const router = express.Router()

const hash = require('./../hash.js')

const Response = require('./../../models/response.js')
const Respondent = require('./../../models/respondent.js')
const Survey = require('./../../models/survey.js')

const email = require('../email.js')

// Handle creating and updating a surveySet
router.post('/submit', express.urlencoded({extended: true}), async function (req, res) {
  // Validate the hash
  const hashValid = hash.verifySurveyAccessHash(req.body.responseHash, req.body.cohortID, req.body.surveySetID, req.body.surveyID, req.body.respondentEmail)
  if (!hashValid) {
    return res.status(403).send('The response hash is invalid for the specified cohortID, surveySetID, surveyID, and email combination.')
  }

  const promises = []

  if (req.body.demographicQuestionResponses && req.body.demographicQuestionResponses.length > 0) {
    promises.push(Respondent.create({
      _id: req.body.respondentEmail,
      cohort: req.body.cohortID,
      demographicQuestionResponses: req.body.demographicQuestionResponses
    }))
  }

  console.log('req.body.surveyQuestionResponses', req.body.surveyQuestionResponses)

  promises.push(Response.create({
    respondent: req.body.respondentEmail,
    cohort: req.body.cohortID,
    surveySet: req.body.surveySetID,
    survey: req.body.surveyID,
    responseTime: Date.now(),
    questionAnswers: req.body.surveyQuestionResponses
  }))

  Promise.all(promises).then(result => {
    return res.sendStatus(200)
  }).catch(err => {
    console.log('err!', err)
    return res.status(500).send(err)
  })
})

router.post('/resend', express.urlencoded({extended: true}), function (req, res) {
  if (!req.isAuthenticated()) {
    return res.sendStatus(403)
  }

  return Survey.count({_id: req.body.surveyID, owner: req.user.username}).then(surveyCount => {
    if (surveyCount !== 1) {
      res.sendStatus(404)
    }

    return email.resendSurveyResponseRequestEmails(req.body.cohortID, req.body.surveySetID, req.body.surveyID)
  }).then(sentEmailPromises => {
    console.log('Re-sending emails complete')
    return res.status(200).json({emailsSent: sentEmailPromises.length})
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
})

module.exports = router
