const express = require('express')
const router = express.Router()
const moment = require('moment')

// Helpers
const auth = require('./authentication.js')
const hash = require('./hash.js')

// Required models
const Cohort = require('./../models/cohort.js')
const SurveySet = require('./../models/surveySet.js')
const Survey = require('./../models/survey.js')
const Respondent = require('./../models/respondent.js')
const Response = require('./../models/response.js')

const errorMessages = {
  403: 'You do not have permission to access the requested item. Ensure you are logged in to the correct account.',
  404: 'The requested resource could not be found.',
  500: 'An internal server error occured.'
}

const displayError = function (req, res, errorNumber, errorMessage) {
  if (!errorNumber) {
    errorNumber = 500
  }
  if (!errorMessage && errorMessages[errorNumber]) {
    errorMessage = errorMessages[errorNumber]
  }
  return res.status(errorNumber).render('error', {
    errorMessage,
    errorNumber,
    path: req.originalUrl,
    pageTitle: 'Error'
  })
}

// Homepage
router.get('/', async function (req, res, next) {
  // Check whether the user sending this request is authenticated
  if (!auth.userIsAuthenticated(req)) {
    return res.render('splash', req.session)
  }

  const showArchived = typeof (req.query.archived) !== 'undefined'

  // Cohort.find({
  //   owner: req.session.username
  // }).then(cohorts => {
  //   for (let cohort of cohorts) {
  //     SurveySet.find({
  //       owner: req.session.username,
  //       cohort: cohort.id
  //     })
  //   }
  // })

  // const promises = [
  //   Cohort.find({
  //     owner: req.session.username
  //   }).exec(),
  //   SurveySet.find({
  //     owner: req.session.username
  //   }),
  //   Survey.find({
  //     owner: req.session.username
  //   })
  // ]

  // Promise.all(promises).then(results => {
  //   const cohorts = results[0]
  //   const surveySet = results[1]
  //   const surveys = results[2]
  // })

  // console.log('alt:', await res.locals.user.getCohortsAlt())
  //
  // let matchConditions = {owner: req.session.username}
  // if (showArchived !== true) {
  //   matchConditions.archived = {$not: {$eq: true}}
  // }
  //
  // Cohort.aggregate([
  //   {
  //     $match: matchConditions
  //   }, {
  //     $project: {archived: 1, name: 1, membersCount: {$size: '$members'}, demographicQuestionsCount: {$size: '$demographicQuestions'}}
  //   }, {
  //     $sort: {name: 1}
  //   }, {
  //     $lookup: {
  //       from: 'surveysets', localField: '_id', foreignField: 'cohort', as: 'surveySets'
  //     }
  //   }, {
  //     $lookup: {
  //       from: 'surveys', localField: '_id', foreignField: 'cohort', as: 'surveys'
  //     }
  //   }
  // ]).then(cohorts => {
  //   // const findElementOfArrayWithKey = function() {
  //   //
  //   // }
  //   // for (let cohortIndex in cohorts) {
  //   //   const cohort = cohorts[cohortIndex]
  //   //   for (let responseIndex in cohort.responses) {
  //   //     const response = cohort.responses[responseIndex]
  //   //     cohorts[cohortIndex].responses[responseIndex] = Response.hydrate(response)
  //   //   }
  //   // }
  //   console.dir(cohorts, {depth: 6, colors: true})
  // })

  // ///////

  res.locals.user.getCohorts(showArchived, function (err, cohorts, archivedCount) {
    if (err) {
      console.error(err)
      return displayError(req, res, 500)
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
    return displayError(req, res, 403)
  }
  Cohort.findOne({
    owner: res.locals.user.username,
    _id: req.params.id
  }, function (err, cohort) {
    if (err) {
      console.error(err)
      return displayError(req, res, 500)
    }
    if (!cohort) {
      return displayError(req, res, 404)
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
    return displayError(req, res, 403)
  }
  SurveySet.findOne({
    owner: res.locals.user.username,
    cohort: req.params.cohortID,
    _id: req.params.surveyID
  }).then(survey => {
    if (!survey) {
      return displayError(req, res, 404)
    }

    return res.render('edit', {
      username: req.session.username,
      survey: survey,
      formName: 'Survey',
      pageTitle: 'Edit Survey ' + survey.name
    })
  }).catch(err => {
    console.error(err)
    return displayError(req, res, 500)
  })
})

// Survey Results Page
router.get('/cohorts/:cohortID/surveys/:surveyID/results', function (req, res, next) {
  if (!auth.userIsAuthenticated(req)) {
    return displayError(req, res, 403)
  }

  let thisSurveySet

  const initialPromises = [
    SurveySet.findOne({ // Find the specified surveySet
      owner: res.locals.user.username,
      cohort: req.params.cohortID,
      _id: req.params.surveyID
    }).populate('cohort').exec(),
    Survey.find({ // Find all of the surveys in this surveySet
      owner: res.locals.user.username,
      cohort: req.params.cohortID,
      surveySet: req.params.surveyID
    }).sort({
      sendDate: 1
    }),
    Respondent.find({
      cohort: req.params.cohortID
    })
  ]

  Promise.all(initialPromises).then(results => {
    // Convert the surveySet into a regular JavaScript obejct
    thisSurveySet = results[0].toObject()

    // Convert the surveys into regular JavaScript obejcts
    thisSurveySet.surveys = results[1].map(survey => {
      const thisSurvey = survey.toObject()
      thisSurvey.sendDateText = moment(thisSurvey.sendDate).format('D MMM Y')
      return thisSurvey
    })

    // Convert the respondents into regular JavaScript obejcts
    thisSurveySet.respondents = results[2].map(respondent => respondent.toObject())

    // Find all of the responses for each of the surveys
    const responsePromises = []
    for (let thisSurvey of thisSurveySet.surveys) {
      responsePromises.push(Response.find({
        cohort: req.params.cohortID,
        surveySet: req.params.surveyID,
        survey: thisSurvey._id
      }))
    }
    return Promise.all(responsePromises)
  }).then(responses => {
    for (let thisSurveyIndex in thisSurveySet.surveys) {
      thisSurveySet.surveys[thisSurveyIndex].responses = responses[thisSurveyIndex]
    }

    console.log(thisSurveySet)
    return res.render('results', {
      username: req.session.username,
      surveyResults: thisSurveySet,
      pageTitle: 'Survey Results'
    })
  }).catch(err => {
    console.error(err)
    return displayError(req, res, 500)
  })
})

router.get('/cohorts/:cohortID/surveys/:surveyID/preview', function (req, res, next) {
  if (!auth.userIsAuthenticated(req)) {
    return displayError(req, res, 403)
  }
  Survey.findOne({
    owner: req.session.username,
    cohort: req.params.cohortID,
    surveySet: req.params.surveyID
  }).populate('cohort').then(function (survey) {
    if (survey.cohort && survey.cohort.members.length === 0) {
      return displayError(req, res, 400, 'You can only preview surveys that have at least one cohort member. This cohort has no members.')
    }
    const previewEmail = survey.cohort.members[0]
    const previewEmailHash = hash.generateSurveyAccessHash(survey.cohort._id, survey.surveySet, survey._id, previewEmail)
    const redirectURL = '/cohorts/' + survey.cohort._id + '/surveys/' + survey.surveySet + '/respond/' + survey._id + '?' + 'email=' + previewEmail + '&hash=' + previewEmailHash + '&preview'
    return res.redirect(redirectURL)
  }).catch(err => {
    console.error(err)
    return displayError(req, res, 500)
  })
})

// Respond to survey
router.get('/cohorts/:cohortID/surveys/:surveySetID/respond/:surveyID', function (req, res, next) {
  if (!req.query.email) {
    return displayError(req, res, 400, 'An email URL parameter is required was not present in the request URL.')
  }
  if (!req.query.hash) {
    return displayError(req, res, 400, 'A hash URL parameter is required was not present in the request URL.')
  }

  // Are we viewing a survey owner preview?
  const preview = (typeof req.query.preview !== 'undefined')

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
      return displayError(req, res, 404)
    }

    const hashValid = hash.verifySurveyAccessHash(req.query.hash, thisSurvey.cohort._id, thisSurvey.surveySet._id, thisSurvey._id, req.query.email)
    if (!hashValid) {
      console.log('Hash Should be:', hash.generateSurveyAccessHash(thisSurvey.cohort._id, thisSurvey.surveySet._id, thisSurvey._id, req.query.email))
      return displayError(req, res, 403, 'You do not have permission to access this survey because the email and hash pair provided in the request URL do not match.')
    }

    if (!thisSurvey.cohort.members.includes(req.query.email)) {
      return displayError(req, res, 403, `You do not have permission to access this survey because the email address <code>${req.query.email}</code> is not in the cohort ${thisSurvey.cohort.name}.`)
    }

    // Prevent survey from being accessed if the sendDate is in the future and this user is not the survey owner
    if (req.session.username !== thisSurvey.owner && (!thisSurvey.sendDate || thisSurvey.sendDate > new Date())) {
      return displayError(req, res, 403, `You do not have permission to access this survey because the survey's send date (${thisSurvey.sendDate.toString()}) is in the future.`)
    }

    const responseCount = await Response.count({
      respondent: req.query.email,
      cohort: thisSurvey.cohort._id,
      surveySet: thisSurvey.surveySet._id,
      survey: thisSurvey._id
    })

    if (responseCount !== 0 && !preview) {
      return displayError(req, res, 400, 'You have already responded to this survey. You can only respond to each survey once.')
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
      preview: preview
    })
  }).catch(error => {
    console.error(error)
    return displayError(req, res, 500)
  })
})

// Export the routes on this router
module.exports.router = router
module.exports.displayError = displayError
