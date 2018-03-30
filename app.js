let express = require('express')
let app = express()
let session = require('cookie-session')
// let bodyParser = require('body-parser')

require('dotenv').config()
var config = require('./controllers/config.js')
let auth = require('./controllers/authentication.js')

require('./controllers/database.js')

// Configure session cookies
app.use(session({
  secret: config.sessionSecret,
  maxAge: 24 * 60 * 60 * 1000 * 365 // 365 days
}))

// Attempt to load the currently logged-in user
app.use('*', auth.loadUser)

let api = require('./controllers/api.js')
app.use('/api', api.router)
app.use('/auth', auth.router)

// Route a request for the homepage
app.get('/', function (req, res, next) {
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

let Cohort = require('./models/cohort.js')

app.get('/cohorts/:id/edit', function (req, res, next) {
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

let SurveySet = require('./models/surveySet.js')
app.get('/cohorts/:cohortID/surveys/:surveyID/edit', function (req, res, next) {
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

app.get('/cohorts/:cohortID/surveys/:surveyID/preview', function (req, res, next) {
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

const Survey = require('./models/survey.js')
const hash = require('./controllers/hash.js')
app.get('/cohorts/:cohortID/surveys/:surveySetID/respond/:surveyID', function (req, res, next) {
  if (!req.query.email) {
    return res.status(400).send('Email URL parameter is required but not present.')
  }
  if (!req.query.hash) {
    return res.status(400).send('Hash URL parameter is required but not present.')
  }

  Survey.findOne({
    cohort: req.params.cohortID,
    surveySet: req.params.surveySetID,
    _id: req.params.surveyID
  }).populate('surveySet').populate('cohort').then(function (survey) {
    console.log('result', survey)
    if (!survey) {
      return res.sendStatus(404)
    }

    const hashValid = hash.verifySurveyAccessHash(req.query.hash, survey.cohort._id, survey.surveySet._id, survey._id, req.query.email)
    if (!hashValid) {
      console.log('Hash Should be:', hash.generateSurveyAccessHash(survey.cohort._id, survey.surveySet._id, survey._id, req.query.email))
      return res.status(403).send('Invalid email and hash pair')
    }

    if (!survey.cohort.members.includes(req.query.email)) {
      return res.status(403).send('The email ' + req.query.email + ' is not in the given cohort.')
    }

    // Prevent survey from being accessed if the sendDate is in the future and this user is not the survey owner
    if (req.session.username !== survey.owner && (!survey.sendDate || survey.sendDate > new Date())) {
      return res.status(403).send('Survey send date (' + survey.sendDate.toString() + ') is in the future.')
    }

    return res.render('survey', {
      survey,
      preview: (typeof req.query.preview !== 'undefined')
    })
  }).catch(error => {
    console.error(error)
    return res.sendStatus(500)
  })
})

// Configure the EJS templating system (http://www.ejs.co)
app.set('view engine', 'ejs')

// Configure routing to the public folder
app.use(express.static('public'))

app.listen(config.port, function () {
  console.log('Listening for reqs on %s.', config.host)
})
