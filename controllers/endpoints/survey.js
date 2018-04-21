// Load Express
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const hash = require('./../hash.js')

const Response = require('./../../models/response.js')
const Respondent = require('./../../models/respondent.js')
const Survey = require('./../../models/survey.js')
const Cohort = mongoose.model('Cohort')
const SurveySubmittedEvent = mongoose.model('SurveySubmittedEvent')

const email = require('../email.js')

// Handle creating and updating a surveySet
router.post('/submit', express.urlencoded({extended: true}), async function (req, res) {
  // Validate the hash
  const hashValid = hash.verifySurveyAccessHash(req.body.responseHash, req.body.cohortID, req.body.surveySetID, req.body.surveyID, req.body.respondentEmail)
  if (!hashValid) {
    return res.status(403).send('The response hash is invalid for the specified cohortID, surveySetID, surveyID, and email combination.')
  }

  if (req.body.demographicQuestionResponses && req.body.demographicQuestionResponses.length > 0) {
    try {
      await Respondent.create({
        _id: req.body.respondentEmail,
        cohort: req.body.cohortID,
        demographicQuestionResponses: req.body.demographicQuestionResponses
      })
    } catch (err) {
      console.error(err)
      return res.sendStatus(500)
    }
  }

  try {
    var response = await Response.create({
      respondent: req.body.respondentEmail,
      cohort: req.body.cohortID,
      surveySet: req.body.surveySetID,
      survey: req.body.surveyID,
      responseTime: Date.now(),
      questionAnswers: req.body.surveyQuestionResponses
    })
  } catch (err) {
    console.error(err)
    return res.sendStatus(500)
  }

  res.sendStatus(200)

  try {
    SurveySubmittedEvent.create({
      response: response._id,
      respondent: req.body.respondentEmail,
      cohort: req.body.cohortID,
      surveySet: req.body.surveySetID,
      survey: req.body.surveyID
    })
  } catch (err) {
    console.error('Error while creating survey submitted event:', err)
  }
  //
  // console.log('req.body.surveyQuestionResponses', req.body.surveyQuestionResponses)
  //
  // promises.push(Response.create({
  //   respondent: req.body.respondentEmail,
  //   cohort: req.body.cohortID,
  //   surveySet: req.body.surveySetID,
  //   survey: req.body.surveyID,
  //   responseTime: Date.now(),
  //   questionAnswers: req.body.surveyQuestionResponses
  // }))
  //
  // Promise.all(promises).then(result => {
  //   res.sendStatus(200)
  //
  // }).catch(err => {
  //   console.log('err!', err)
  //   return res.status(500).send(err)
  // })
})

router.post('/resend', express.urlencoded({extended: true}), async function (req, res) {
  if (!req.isAuthenticated()) {
    return res.sendStatus(403)
  }

  // Ensure the user is an owner of this cohort
  const cohortCount = await Cohort.count({
    _id: req.body.cohortID,
    owners: req.user.username
  })
  if (cohortCount === 0) {
    return res.status(404).json({
      message: 'No cohort with the provided id exists for this user'
    })
  }

  // Ensure the survey is within the cohort
  try {
    const surveyCount = await Survey.count({
      _id: req.body.surveyID,
      cohort: req.body.cohortID
    })
    if (surveyCount !== 1) {
      return res.sendStatus(404)
    }
  } catch (e) {
    return res.sendStatus(500)
  }

  // Send the emails
  email.resendSurveyResponseRequestEmails(req.body.cohortID, req.body.surveySetID, req.body.surveyID).then(sentEmailPromises => {
    console.log('Re-sending emails complete')
    return res.status(200).json({emailsSent: sentEmailPromises.length})
  }).catch(err => {
    console.error(err)
    res.sendStatus(500)
  })
})

module.exports = router
