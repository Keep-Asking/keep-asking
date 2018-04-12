const email = require('./email.js')

const promises = []

if (process.argv.length === 3 && process.argv[2] === 'remind') {
  promises.push(email.sendUnsentSurveyResponseReminderEmails())
} else if (process.argv.length === 3 && process.argv[2] === 'request') {
  promises.push(email.sendUnsentSurveyResponseRequestEmails())
} else {
  promises.push(email.sendUnsentSurveyResponseReminderEmails())
  promises.push(email.sendUnsentSurveyResponseRequestEmails())
}

Promise.all(promises).then(result => {
  console.log(`Done (${result.length}). Quitting`)
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})
