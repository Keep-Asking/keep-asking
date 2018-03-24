const crypto = require('crypto')
const assert = require('assert').strict
const config = require('./config.js')

const generateSurveyAccessHash = function (cohortID, surveySetID, surveyID, email) {
  assert.ok(cohortID)
  assert.ok(surveySetID)
  assert.ok(surveyID)
  assert.ok(email)
  const plaintextToHash = [cohortID, surveySetID, surveyID, email].join()
  const hmac = crypto.createHmac('sha256', config.HASH_SECRET)
  hmac.update(plaintextToHash)
  return hmac.digest('hex')
}

const verifySurveyAccessHash = function (hash, cohortID, surveySetID, surveyID, email) {
  assert.ok(hash)
  assert.ok(cohortID)
  assert.ok(surveySetID)
  assert.ok(surveyID)
  assert.ok(email)
  return hash === generateSurveyAccessHash(cohortID, surveySetID, surveyID, email)
}

module.exports = {
  generateSurveyAccessHash,
  verifySurveyAccessHash
}
