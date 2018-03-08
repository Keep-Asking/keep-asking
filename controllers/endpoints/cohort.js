// Load Express
let express = require('express')
let router = express.Router()
let bodyParser = require('body-parser')

let Cohort = require.main.require('./models/cohort.js')

const emailRE = /\S+@\S+\.\S+/

// Handle creating and updating a cohort
router.post('/update', bodyParser.urlencoded({ extended: false }), function (req, res) {
  // Validate cohort name
  if (!req.body.name || typeof (req.body.name) !== 'string' || req.body.name.length === 0) {
    return res.status(400).json({
      message: 'A cohort name is required.',
      invalidField: 'name'
    })
  }

  // Validate members
  if (!req.body['members[]']) {
    return res.status(400).json({
      message: 'A members array is required.',
      invalidField: 'members'
    })
  }

  // Coerce members to array
  if (typeof (req.body['members[]']) === 'string') {
    req.body['members[]'] = [req.body['members[]']]
  }

  // Filter members for non-email addresses
  req.body.members = Array.from(new Set(req.body['members[]'].filter(member => emailRE.test(member)))).sort()

  // Perform the database commands
  Cohort.update({ // Find the cohort to update, if it exists
    _id: req.body.id || {$exists: false},
    owner: res.locals.user.username
  }, { // Set the values on the cohort
    owner: res.locals.user.username,
    name: req.body.name,
    members: req.body.members
  }, {
    upsert: true
  }).then(function () {
    return res.sendStatus(200)
  }).catch(function () {
    return res.status(500).json({
      message: 'An error occured while updating the existing cohort.'
    })
  })
})

// Handle archiving and unarchiving a cohort
router.get('/:id/archive', bodyParser.urlencoded({ extended: false }), function (req, res) {
  if (!(req.params && req.params.id)) {
    return res.sendStatus(400)
  }

  Cohort.update({
    _id: req.params.id,
    owner: res.locals.user.username
  }, {
    archived: (req.query.status === 'true')
  }).then(function () {
    return res.redirect('/')
  }).catch(function (err) {
    console.error(err)
    return res.sendStatus(500)
  })
})

module.exports = router
