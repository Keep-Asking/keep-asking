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

// app.use(bodyParser.json())

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
      archivedCount: archivedCount
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
    return res.render('cohort/edit', {
      username: req.session.username,
      cohort: cohort
    })
  })
})

let SurveySet = require('./models/surveySet.js')
app.get('/cohorts/:cohortID/surveys/:surveyID', function (req, res, next) {
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
    console.log('dates being sent to renderer', survey)

    // if (survey.sendDates && survey.sendDates.length > 0 && survey.sendDates[0] instanceof Date) {
    //   survey.surveyTime = moment(survey.sendDates[0][0]).format('HH:mm')
    // }
    return res.render('survey/edit', {
      username: req.session.username,
      survey: survey
    })
  })
})

// Configure the EJS templating system (http://www.ejs.co)
app.set('view engine', 'ejs')

// Configure routing to the public folder
app.use(express.static('public'))

app.listen(config.port, function () {
  console.log('Listening for reqs on %s.', config.host)
})
