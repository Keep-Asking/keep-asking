const express = require('express')
const router = express.Router()
const passport = require('passport')

// Allow submission without authenticating
router.use('/survey', require('./endpoints/survey.js'))

// Authenticate using API Key, if present
router.use(passport.authenticate('apikey', { session: false }))

// Check that the user is authenticated
router.use(function (req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.sendStatus(401)
})

// Handle requests to all the API endpoints
router.use('/cohorts', require('./apiEndpoints/cohorts.js'))
router.use('/surveysets', require('./endpoints/surveyset.js'))

router.use(function (req, res, next) {
  return res.sendStatus(404)
})

// Export the routes on this router
module.exports.router = router
