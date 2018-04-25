// Load Express
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

const Cohort = mongoose.model('Cohort')
const SurveySet = mongoose.model('SurveySet')
const Survey = mongoose.model('Survey')
const Response = mongoose.model('Response')
const sendCohortCoOwnerInvitationEmail = require('../emailCohortInvitations.js').sendCohortCoOwnerInvitationEmail

const emailRE = /\S+@\S+\.\S+/

// Middleware to ensure that the authenticated user is an owner of the cohort
const ensureCohortOwnership = async function (req, res, next) {
  if (!req.params.cohortID) {
    return res.status(400).json({
      message: 'No cohort ID provided in the request'
    })
  }
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

// Middleware to ensure that the authenticated user is an owner of the surveySet
const ensureSurveySetOwnership = async function (req, res, next) {
  if (!req.params.cohortID) {
    return res.status(400).json({
      message: 'No cohort ID provided in the request'
    })
  }
  if (!req.params.surveySetID) {
    return res.status(400).json({
      message: 'No survey set ID provided in the request'
    })
  }
  try {
    const surveySetCount = await SurveySet.count({
      _id: req.params.surveySetID,
      cohort: req.params.cohortID
    })
    if (surveySetCount !== 1) {
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

// List cohorts
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

// Get an existing cohort
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

// Update some or all of an existing cohort
router.patch('/:cohortID', ensureCohortOwnership, async (req, res) => {
  const updateDocument = {}

  if (typeof req.body.archived === 'string') {
    req.body.archived = req.body.archived === 'true'
  }

  for (let key of ['name', 'members', 'demographicQuestions', 'archived']) {
    if (req.body.hasOwnProperty(key)) {
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

// Add a new co-owner of a cohort
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

// Delete a co-owner of a cohort
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
    return res.sendStatus(200)
  }).catch(err => {
    console.error(err)
    return res.sendStatus(500)
  })
})

const millisecondsPerDay = 60 * 60 * 24 * 1000
const updateSurveys = async function (req, res, surveySet, callback) {
  try {
    // Remove any existing unsent surveys in this surveySet
    await Survey.remove({
      surveySet: surveySet._id,
      sent: false
    })
  } catch (err) {
    return callback(err)
  }

  // Determine the delay between the survey send date and the reminder email
  const remindAfterMilliseconds = surveySet.responseAcceptancePeriod * millisecondsPerDay * 0.5

  // Construct the new surveys to create
  const surveyDocuments = surveySet.surveys.filter(survey => survey.date >= new Date()).map(survey => {
    return {
      surveySet: surveySet._id,
      cohort: surveySet.cohort,
      sendDate: survey.date,
      name: survey.name,
      sent: false,
      remindDate: new Date(survey.date.getTime() + remindAfterMilliseconds)
    }
  })

  // Insert the new surveys
  try {
    await Survey.insertMany(surveyDocuments)
  } catch (err) {
    return callback(err)
  }

  for (let survey of surveySet.surveys) {
    try {
      await Survey.update({
        sendDate: survey.date,
        cohort: surveySet.cohort,
        surveySet: surveySet._id
      }, {
        name: survey.name
      })
    } catch (err) {
      return callback(err)
    }
  }
  return callback(null)
}

// List the surveySets within a given cohort
router.get('/:cohortID/surveySets', ensureCohortOwnership, async (req, res) => {
  try {
    const surveySets = await SurveySet.find({
      cohort: req.params.cohortID
    })
    return res.json(surveySets)
  } catch (err) {
    console.error(err)
    return res.sendStatus(500)
  }
})

// Create a new surveySet
router.post('/:cohortID/surveySets', ensureCohortOwnership, async (req, res) => {
  // Map keys and values from req.body to surveySetDocument
  const surveySetDocument = {}
  const keysToMap = ['name', 'surveys', 'questions', 'responseAcceptancePeriod']
  keysToMap.forEach(function (key) {
    if (req.body[key]) {
      surveySetDocument[key] = req.body[key]
    }
  })
  surveySetDocument.cohort = req.params.cohortID

  try {
    var surveySet = await SurveySet.create(surveySetDocument)
  } catch (err) {
    console.error(err)
    return res.sendStatus(500)
  }

  return updateSurveys(req, res, surveySet, (err) => {
    if (err) {
      console.error(err)
      return res.sendStatus(500)
    }
    return res.sendStatus(200)
  })
})

// Modify an existing surveySet
router.patch('/:cohortID/surveySets/:surveySetID', ensureCohortOwnership, ensureSurveySetOwnership, async (req, res) => {
  try {
    var surveySet = await SurveySet.findOne({
      _id: req.params.surveySetID,
      cohort: req.params.cohortID
    })
  } catch (err) {
    console.error(err)
    return res.sendStatus(500)
  }

  // Check the surveySet exists
  if (!surveySet) {
    return res.sendStatus(404)
  }

  // Map keys and values from req.body to the surveySet
  const keysToMap = ['name', 'surveys', 'cohort', 'questions', 'responseAcceptancePeriod']
  keysToMap.forEach(function (key) {
    if (req.body[key]) {
      surveySet[key] = req.body[key]
    }
  })

  try {
    await surveySet.save()
  } catch (err) {
    console.error(err)
    return res.sendStatus(500)
  }

  return updateSurveys(req, res, surveySet, (err) => {
    if (err) {
      console.error(err)
      return res.sendStatus(500)
    }
    return res.sendStatus(200)
  })
})

router.get('/:cohortID/surveySets/:surveySetID', ensureCohortOwnership, ensureSurveySetOwnership, async function (req, res) {
  try {
    let surveySet = await SurveySet.findOne({
      _id: req.params.surveySetID,
      cohort: req.params.cohortID
    }, {
      cohort: true,
      name: true,
      surveys: true,
      responseAcceptancePeriod: true,
      questions: true
    }).populate('cohort')

    if (!surveySet) {
      return res.sendStatus(404)
    }

    surveySet = surveySet.toObject()

    // Insert responses
    surveySet.responses = await Response.find({
      cohort: req.params.cohortID,
      surveySet: req.params.surveySetID
    }, {
      respondent: true,
      questionAnswers: true,
      responseTime: true,
      _id: false
    }).populate({
      path: 'respondent',
      select: {
        cohort: false,
        __v: false
      }
    })

    if (req.query.download === 'true') {
      res.attachment(`${surveySet.name}.json`)
    }

    return res.json(surveySet)
  } catch (err) {
    console.error(err)
    return res.sendStatus(500)
  }
})

module.exports = router
