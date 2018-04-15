// Load Express
let express = require('express')
let router = express.Router()
let bodyParser = require('body-parser')

let Cohort = require.main.require('./models/cohort.js')

const emailRE = /\S+@\S+\.\S+/

// Handle creating and updating a cohort
router.post('/update', bodyParser.urlencoded({ extended: true }), function (req, res) {
  // Validate cohort name
  if (!req.body.name || typeof (req.body.name) !== 'string' || req.body.name.length === 0) {
    req.body.name = 'Unnamed Cohort'
  }

  // Validate members
  if (!req.body.members) {
    req.body.members = []
  }

  // Filter members for non-email addresses
  req.body.members = Array.from(new Set(req.body['members'].filter(member => emailRE.test(member)))).sort()

  if (!Array.isArray(req.body.demographicQuestions)) {
    req.body.demographicQuestions = []
  }

  // Perform the database commands
  Cohort.update({ // Find the cohort to update, if it exists
    _id: req.body.id || {$exists: false},
    owner: req.user.username
  }, { // Set the values on the cohort
    owner: req.user.username,
    name: req.body.name,
    members: req.body.members,
    demographicQuestions: req.body.demographicQuestions
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

router.use(bodyParser.urlencoded({ extended: true }))

router.put('/:cohortID/owners/:owner', async function (req, res) {
  console.log(req.params)

  try {
    var numberOfMatchingCohorts = await Cohort.count({
      owners: req.user.username,
      _id: req.params.cohortID
    })
  } catch (e) {
    return res.sendStatus(500)
  }

  if (numberOfMatchingCohorts !== 1) {
    return res.sendStatus(404)
  }

  Cohort.update({
    _id: req.params.cohortID,
    owners: req.user.username
  }, {
    $addToSet: {
      pendingOwners: req.params.owner
    }
  }).then(() => {
    console.log('saved ', req.params.owner)
    return res.sendStatus(200)
  }).catch(err => {
    console.error(err)
    return res.sendStatus(500)
  })
})

router.delete('/:cohortID/owners/:owner', async function (req, res) {
  console.log(req.params)

  try {
    var numberOfMatchingCohorts = await Cohort.count({
      owners: req.user.username,
      _id: req.params.cohortID
    })
  } catch (e) {
    return res.sendStatus(500)
  }

  if (numberOfMatchingCohorts !== 1) {
    return res.sendStatus(404)
  }

  Cohort.update({
    _id: req.params.cohortID,
    owners: req.user.username
  }, {
    $pull: {
      pendingOwners: req.params.owner,
      owners: req.params.owner
    }
  }).then(() => {
    console.log('removed ', req.params.owner)
    return res.sendStatus(200)
  }).catch(err => {
    console.error(err)
    return res.sendStatus(500)
  })
})

// Handle archiving and unarchiving a cohort
router.get('/:id/archive', bodyParser.urlencoded({ extended: false }), function (req, res) {
  if (!(req.params && req.params.id)) {
    return res.sendStatus(400)
  }

  Cohort.update({
    _id: req.params.id,
    owner: req.user.username
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
