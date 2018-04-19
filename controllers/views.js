const express = require('express')
const router = express.Router()

const moment = require('moment')

// Helpers
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

  if (!req.isAuthenticated()) {
    return res.render('splash', req.session)
  }

  // Redirect to requested ultimate destination
  if (req.session.loginDestinationURL) {
    const loginDestinationURL = req.session.loginDestinationURL
    delete req.session.loginDestinationURL
    return res.redirect(loginDestinationURL)
  }

  // Set profile if name is missing
  if (!req.user.name || !req.user.name.givenName || req.user.name.givenName.length === 0 || !req.user.name.familyName || req.user.name.familyName.length === 0) {
    return res.redirect('/profile?setupProfile=true')
  }

  const showArchived = typeof (req.query.archived) !== 'undefined'

  const promises = [
    req.user.getCohorts(showArchived),
    req.user.getCohortCount({archived: true})
  ]

  Promise.all(promises).then(results => {
    return res.render('dashboard', {
      username: req.user.username,
      cohorts: results[0],
      archivedCount: results[1],
      pageTitle: 'Home'
    })
  }).catch(err => {
    console.error(err)
    return displayError(req, res, 500)
  })
})

router.get('/login', async function (req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }

  return res.render('login', {
    pageTitle: 'Login'
  })
})

router.get('/cohorts/:cohortID/invitation/:email/accept', async function (req, res, next) {
  if (!req.query.hash || !req.query.invitationExpirationTime) {
    return displayError(req, res, 400, 'The query parameters in your URL are malformed.')
  }

  const expirationTime = Number.parseInt(req.query.invitationExpirationTime)
  if (Number.isNaN(expirationTime)) {
    return displayError(req, res, 400, 'The expirationTime URL query parameter must be a number.')
  }

  if (expirationTime < Date.now()) {
    return displayError(req, res, 400, 'This invitation has expired.')
  }

  try {
    var hashIsValid = hash.verifyCohortInvitationHash(req.query.hash, req.params.cohortID, req.params.email, expirationTime)
  } catch (err) {
    console.error(err)
    return displayError(req, res, 500, 'An error occured while evaluating the request hash.')
  }
  if (!hashIsValid) {
    return displayError(req, res, 400, 'The hash on this request is invalid.')
  }

  try {
    var cohort = await Cohort.findById(req.params.cohortID)
  } catch (e) {
    console.error(e)
    return displayError(req, res, 500, 'An error occured while retrieving the requested cohort.')
  }

  if (!cohort) {
    return displayError(req, res, 404, 'The cohort you requested could not be found.')
  }

  if (!(cohort.pendingOwners && cohort.pendingOwners.includes(req.params.email))) {
    return displayError(req, res, 400, `The email address ${req.params.email} does not currently have a pending invitation to join the cohort ${cohort.name}.`)
  }

  // Enforce login
  if (!req.isAuthenticated()) {
    req.session.loginDestinationURL = req.originalUrl
    return res.redirect('/login')
  }

  Cohort.findByIdAndUpdate(req.params.cohortID, {
    $addToSet: {
      owners: req.user.username
    },
    $pull: {
      pendingOwners: req.params.email
    }
  }).then(() => {
    return res.redirect('/')
  })
})

// Edit cohort page
router.get('/cohorts/:id/edit', function (req, res, next) {
  if (!req.isAuthenticated()) {
    return displayError(req, res, 403)
  }
  Cohort.findOne({
    owners: req.user.username,
    _id: req.params.id
  }).populate('owners').then(cohort => {
    if (!cohort) {
      return displayError(req, res, 404)
    }
    return res.render('edit', {
      username: req.user.username,
      cohort: cohort,
      formName: 'Cohort',
      formDescription: 'A cohort is a group of people who you want to survey. A cohort could be the students in a class, the members of a sports club, or a team in a company.',
      pageTitle: 'Edit Cohort ' + cohort.name
    })
  }).catch(err => {
    console.error(err)
    return displayError(req, res, 500)
  })
})

// Edit survey page
router.get('/cohorts/:cohortID/surveys/:surveyID/edit', async function (req, res, next) {
  if (!req.isAuthenticated()) {
    return displayError(req, res, 403)
  }

  const cohortCount = await Cohort.count({
    _id: req.params.cohortID,
    owners: req.user.username
  })
  if (cohortCount === 0) {
    return displayError(req, res, 403, 'No cohort with the provided id exists for this user')
  }

  SurveySet.findOne({
    cohort: req.params.cohortID,
    _id: req.params.surveyID
  }).then(surveySet => {
    if (!surveySet) {
      return displayError(req, res, 404)
    }

    // Format Date strings
    if (surveySet.surveys) {
      surveySet.surveys = surveySet.surveys.map(survey => {
        survey.displayDate = moment(survey.date).format('D MMM Y')
        return survey
      })
    }

    return res.render('edit', {
      username: req.user.username,
      survey: surveySet,
      formName: 'Survey',
      formDescription: 'A survey is what you use to ask questions to your respondents. At the date(s) and time you specify, your cohort members will be emailed asking them to complete your survey. You can create multiple surveys to ask your cohort members about different topics at different times.',
      pageTitle: 'Edit Survey ' + surveySet.name
    })
  }).catch(err => {
    console.error(err)
    return displayError(req, res, 500)
  })
})

// Survey Results Page
router.get('/cohorts/:cohortID/surveys/:surveyID/results', async function (req, res, next) {
  if (!req.isAuthenticated()) {
    return displayError(req, res, 403)
  }

  const cohortCount = await Cohort.count({
    _id: req.params.cohortID,
    owners: req.user.username
  })
  if (cohortCount === 0) {
    return displayError(req, res, 403, 'No cohort with the provided id exists for this user')
  }

  return SurveySet.count({ // Find the specified surveySet
    cohort: req.params.cohortID,
    _id: req.params.surveyID
  }).then(surveySetCount => {
    if (surveySetCount === 0) {
      return displayError(req, res, 404)
    }

    return SurveySet.fetchSurveyResultData(req.params.cohortID, req.params.surveyID).then(surveySet => {
      return res.render('results', {
        username: req.user.username,
        surveySet: surveySet,
        pageTitle: surveySet.name + ' Results'
      })
    }).catch(err => {
      console.error(err)
      return displayError(req, res, 500)
    })
  }).catch(err => {
    console.error(err)
    return displayError(req, res, 500)
  })
})

router.get('/cohorts/:cohortID/surveys/:surveyID/preview', async function (req, res, next) {
  if (!req.isAuthenticated()) {
    return displayError(req, res, 403)
  }

  const cohortCount = await Cohort.count({
    _id: req.params.cohortID,
    owners: req.user.username
  })
  if (cohortCount === 0) {
    return displayError(req, res, 403, 'No cohort with the provided id exists for this user')
  }

  Survey.findOne({
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

const millisecondsPerDay = 60 * 60 * 24 * 1000

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
    if (req.user && !thisSurvey.cohort.owners.includes(req.user.username) && (!thisSurvey.sendDate || thisSurvey.sendDate > new Date())) {
      return displayError(req, res, 403, `You do not have permission to access this survey because the survey's send date (${thisSurvey.sendDate.toString()}) is in the future.`)
    }

    if (!preview && thisSurvey.surveySet.responseAcceptancePeriod) {
      const surveyCloseDate = new Date(thisSurvey.sendDate.getTime() + millisecondsPerDay * thisSurvey.surveySet.responseAcceptancePeriod)
      if (Date.now() > surveyCloseDate) {
        return displayError(req, res, 410, `Responses to this survey are no longer being accepted.`)
      }
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

// Manage the profile page
const showProfilePage = function (req, res, next) {
  if (!req.isAuthenticated()) {
    return displayError(req, res, 403)
  }

  return res.render('profile', {
    user: req.user,
    username: req.user.username,
    profileSaved: res.locals.profileSaved,
    setupProfile: req.query.setupProfile === 'true'
  })
}

router.get('/profile', showProfilePage)

router.post('/profile', express.urlencoded({extended: true}), function (req, res, next) {
  if (!req.isAuthenticated() || !req.user._id === req.body._id) {
    return displayError(req, res, 403)
  }
  req.user.email = req.body.email
  if (!req.user.name) {
    req.user.name = {}
  }
  req.user.name.givenName = req.body.name.givenName
  req.user.name.familyName = req.body.name.familyName

  return req.user.save().then(user => {
    res.locals.profileSaved = true

    if (req.body.destination) {
      return res.redirect(req.body.destination)
    }
    return showProfilePage(req, res, next)
  }).catch(err => {
    console.error(err)
    return displayError(req, res, 500)
  })
})

// Export the routes on this router
module.exports.router = router
module.exports.displayError = displayError
