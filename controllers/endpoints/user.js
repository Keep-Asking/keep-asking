// Load Express
const express = require('express')
const router = express.Router()
const User = mongoose.model('User')
const uuid = require('uuid/v4')

// Handle creating and updating a surveySet
router.post('/new_api_key', async function (req, res) {
  // TODO: Make this route work!
})

module.exports = router
