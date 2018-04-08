const email = require('./email.js')

email.sendUnsentSurveyResponseRequestEmails().then(result => {
  console.log(`Successfully sent ${result.emailsSent} emails from ${result.surveysSent} surveys.`)
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})
