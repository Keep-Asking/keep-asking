let express = require('express')
let router = express.Router()

// Load internal modules
let auth = require('./authentication.js')

router.use('/survey', require('./endpoints/survey.js'))
// Check that the user is authenticated
router.all('*', function (req, res, next) {
  if (auth.userIsAuthenticated(req)) {
    return next()
  }
  res.sendStatus(401)
})

// Prevent caching of PUT requests
router.put('*', function (req, res, next) {
  res.set('Cache-Control', 'no-cache')
  next()
})

// Prevent caching of DELETE requests
router.delete('*', function (req, res, next) {
  res.set('Cache-Control', 'no-cache')
  next()
})

// Handle requests to all the API endpoints
router.use('/cohorts', require('./endpoints/cohort.js'))
router.use('/surveysets', require('./endpoints/surveyset.js'))

// Export the routes on this router
module.exports.router = router
