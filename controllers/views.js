const express = require('express')
const router = express.Router()

// Helpers
const auth = require('./authentication.js')
const hash = require('./hash.js')

// Required models
const Cohort = require('./../models/cohort.js')
const SurveySet = require('./../models/surveySet.js')
const Survey = require('./../models/survey.js')
const Respondent = require('./../models/respondent.js')
const Response = require('./../models/response.js')

// Homepage
router.get('/', function (req, res, next) {
  if (!auth.userIsAuthenticated(req)) {
    return res.render('splash', req.session)
  }

  const showArchived = typeof (req.query.archived) !== 'undefined'

  // Check whether the user sending this request is authenticated
  res.locals.user.getCohorts(showArchived, function (err, cohorts, archivedCount) {
    if (err) {
      console.error(err)
      return res.sendStatus(500)
    }
    return res.render('dashboard', {
      username: req.session.username,
      cohorts: cohorts,
      archivedCount: archivedCount,
      pageTitle: 'Home'
    })
  })
})

// Edit cohort page
router.get('/cohorts/:id/edit', function (req, res, next) {
  if (!auth.userIsAuthenticated(req)) {
    return res.sendStatus(403)
  }
  Cohort.findOne({
    owner: res.locals.user.username,
    _id: req.params.id
  }, function (err, cohort) {
    if (err) {
      console.error(err)
      return res.sendStatus(500)
    }
    if (!cohort) {
      return res.sendStatus(404)
    }
    return res.render('edit', {
      username: req.session.username,
      cohort: cohort,
      formName: 'Cohort',
      pageTitle: 'Edit Cohort ' + cohort.name
    })
  })
})

// Edit survey page
router.get('/cohorts/:cohortID/surveys/:surveyID/edit', function (req, res, next) {
  if (!auth.userIsAuthenticated(req)) {
    return res.sendStatus(403)
  }
  SurveySet.findOne({
    owner: res.locals.user.username,
    cohort: req.params.cohortID,
    _id: req.params.surveyID
  }, function (err, survey) {
    if (err) {
      console.error(err)
      return res.sendStatus(500)
    }
    if (!survey) {
      return res.sendStatus(404)
    }

    return res.render('edit', {
      username: req.session.username,
      survey: survey,
      formName: 'Survey',
      pageTitle: 'Edit Survey ' + survey.name
    })
  })
})

router.get('/cohorts/:cohortID/surveys/:surveyID/preview', function (req, res, next) {
  if (!auth.userIsAuthenticated(req)) {
    return res.sendStatus(403)
  }
  Survey.findOne({
    owner: req.session.username,
    cohort: req.params.cohortID,
    surveySet: req.params.surveyID
  }).populate('cohort').then(function (survey) {
    if (survey.cohort && survey.cohort.members.length === 0) {
      return res.status(400).send('You can only preview surveys that have at least one cohort member. This cohort has no members.')
    }
    const previewEmail = survey.cohort.members[0]
    const previewEmailHash = hash.generateSurveyAccessHash(survey.cohort._id, survey.surveySet, survey._id, previewEmail)
    const redirectURL = '/cohorts/' + survey.cohort._id + '/surveys/' + survey.surveySet + '/respond/' + survey._id + '?' + 'email=' + previewEmail + '&hash=' + previewEmailHash + '&preview'
    return res.redirect(redirectURL)
  })
})

// Respond to survey
router.get('/cohorts/:cohortID/surveys/:surveySetID/respond/:surveyID', function (req, res, next) {
  if (!req.query.email) {
    return res.status(400).send('Email URL parameter is required but not present.')
  }
  if (!req.query.hash) {
    return res.status(400).send('Hash URL parameter is required but not present.')
  }

  const promises = [
    // Search for the requested survey
    Survey.findOne({
      cohort: req.params.cohortID,
      surveySet: req.params.surveySetID,
      _id: req.params.surveyID
    }).populate('surveySet').populate('cohort'),
    // Search for the requested respondent
    Respondent.findOne({
      _id: req.query.email,
      cohort: req.params.cohortID
    }).exec()
  ]

  Promise.all(promises).then(async function (result) {
    const thisSurvey = result[0]
    const thisRespondent = result[1]
    console.log('thisSurvey', thisSurvey)

    if (!thisSurvey) {
      return res.sendStatus(404)
    }

    const hashValid = hash.verifySurveyAccessHash(req.query.hash, thisSurvey.cohort._id, thisSurvey.surveySet._id, thisSurvey._id, req.query.email)
    if (!hashValid) {
      console.log('Hash Should be:', hash.generateSurveyAccessHash(thisSurvey.cohort._id, thisSurvey.surveySet._id, thisSurvey._id, req.query.email))
      return res.status(403).send('Invalid email and hash pair')
    }

    if (!thisSurvey.cohort.members.includes(req.query.email)) {
      return res.status(403).send('The email ' + req.query.email + ' is not in the given cohort.')
    }

    // Prevent survey from being accessed if the sendDate is in the future and this user is not the survey owner
    if (req.session.username !== thisSurvey.owner && (!thisSurvey.sendDate || thisSurvey.sendDate > new Date())) {
      return res.status(403).send(`This survey's send date (${thisSurvey.sendDate.toString()}) is in the future.`)
    }

    const responseCount = await Response.count({
      respondent: req.query.email,
      cohort: thisSurvey.cohort._id,
      surveySet: thisSurvey.surveySet._id,
      survey: thisSurvey._id
    })

    if (responseCount !== 0) {
      return res.status(400).send('You have already responded to this survey. You can only respond to each survey once.')
    }

    // Determine whether to ask the demographic questions
    let demographicQuestionsToAsk = []
    const cohortDemographicQuestionIDs = thisSurvey.cohort.demographicQuestions.map(question => question.id).sort()
    let thisRespondentDemographicQuestionIDs = []
    if (thisRespondent && thisRespondent.demographicQuestionResponses) {
      thisRespondentDemographicQuestionIDs = thisRespondent.demographicQuestionResponses.map(question => question.id).sort()
    }
    if (JSON.stringify(cohortDemographicQuestionIDs) !== JSON.stringify(thisRespondentDemographicQuestionIDs)) {
      demographicQuestionsToAsk = thisSurvey.cohort.demographicQuestions
    }

    return res.render('survey', {
      username: req.session.username,
      survey: thisSurvey,
      respondentEmail: req.query.email,
      responseHash: req.query.hash,
      demographicQuestionsToAsk,
      preview: (typeof req.query.preview !== 'undefined')
    })
  }).catch(error => {
    console.error(error)
    return res.sendStatus(500)
  })
})

// Export the routes on this router
module.exports.router = router
