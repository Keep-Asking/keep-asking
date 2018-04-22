// Load Express
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const Cohort = mongoose.model('Cohort')
const SurveySet = mongoose.model('SurveySet')
const sendCohortCoOwnerInvitationEmail = require('../emailCohortInvitations.js').sendCohortCoOwnerInvitationEmail

const emailRE = /\S+@\S+\.\S+/

// Middleware to ensure that the authenticated user is an owner of the cohort
const ensureCohortOwnership = async function (req, res, next) {
  try {
    const cohortCount = await Cohort.count({
      _id: req.params.cohortID,
      owners: req.user.username
    })
    if (cohortCount !== 1) {
      return res.sendStatus(404)
    }
  } catch (err) {
    console.error(err)
    return res.sendStatus(500)
  }
  next()
}

// Create a new cohort
router.post('/', async (req, res) => {
  // Validate cohort members
  if (!req.body.members) {
    req.body.members = []
  }

  // Filter members for non-email addresses and duplicates
  req.body.members = Array.from(new Set(req.body['members'].filter(member => emailRE.test(member)))).sort()

  if (!Array.isArray(req.body.demographicQuestions)) {
    req.body.demographicQuestions = []
  }

  try {
    var cohort = await Cohort.create({
      name: req.body.name,
      members: req.body.members,
      demographicQuestions: req.body.demographicQuestions,
      owners: [req.user.username]
    })
  } catch (err) {
    console.error(err)
    return res.sendStatus(500)
  }

  return res.status(201).send(`/api/cohorts/${cohort._id}`)
})

router.get('/', async (req, res) => {
  try {
    var cohorts = await Cohort.find({
      owners: req.user.username
    }, {
      name: true
    })
  } catch (err) {
    console.error(err)
    return res.sendStatus(500)
  }
  return res.json(cohorts)
})

router.get('/:cohortID', ensureCohortOwnership, async (req, res) => {
  try {
    var cohort = await Cohort.findOne({
      _id: req.params.cohortID,
      owners: req.user.username
    })
  } catch (err) {
    console.error(err)
    return res.sendStatus(500)
  }

  cohort = cohort.toObject()

  try {
    cohort.surveySets = await SurveySet.find({
      cohort: req.params.cohortID
    }, {
      name: true
    })
  } catch (err) {
    console.error(err)
    return res.sendStatus(500)
  }
  return res.json(cohort)
})

router.patch('/:cohortID', ensureCohortOwnership, async (req, res) => {
  const updateDocument = {}

  if (typeof req.body.archive === 'string') {
    req.body.archive = req.body.archive === 'true'
  }

  for (let key of ['name', 'members', 'demographicQuestions', 'archive']) {
    if (req.body[key]) {
      updateDocument[key] = req.body[key]
    }
  }

  Cohort.findOneAndUpdate({
    _id: req.params.cohortID,
    owners: req.user.username
  }, updateDocument).then(() => {
    return res.sendStatus(200)
  }).catch(err => {
    console.error(err)
    return res.sendStatus(500)
  })
})

// Handle creating and updating a cohort
router.post('/update', function (req, res) {
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
    owners: req.user.username
  }, { // Set the values on the cohort
    $set: {
      name: req.body.name,
      members: req.body.members,
      demographicQuestions: req.body.demographicQuestions
    },
    $addToSet: {
      owners: req.user.username
    }
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

// router.get('/:cohortID/owners', ensureCohortOwnership, async function (req, res) {
//   try {
//     const cohort = await Cohort.findOneById(req.params.cohortID, {
//       owners: true
//     })
//     res.json(cohort.owners)
//   } catch (err) {
//     res.sendStatus(500)
//   }
// })

router.post('/:cohortID/owners/:owner', ensureCohortOwnership, async function (req, res) {
  Cohort.update({
    _id: req.params.cohortID,
    owners: req.user.username
  }, {
    $addToSet: {
      pendingOwners: req.params.owner
    }
  }).then(() => {
    console.log('Sending cohort co-owner invitation email to ' + req.params.owner)
    return sendCohortCoOwnerInvitationEmail(req.params.cohortID, req.user, req.params.owner)
  }).then(() => {
    return res.sendStatus(201)
  }).catch(err => {
    console.error(err)
    return res.sendStatus(500)
  })
})

router.delete('/:cohortID/owners/:owner', ensureCohortOwnership, async function (req, res) {
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

module.exports = router
