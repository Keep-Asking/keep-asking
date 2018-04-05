const nodemailer = require('nodemailer')
const sparkPostTransport = require('nodemailer-sparkpost-transport')
const fs = require('fs')
const heml = require('heml')
const ejs = require('ejs')

require('dotenv').config()
const config = require('./config.js')
require('./database.js')

const Survey = require('./../models/survey.js')
const emailTemplateHEML = fs.readFileSync('./emails/surveyRequest.ejs', 'utf-8')
const emailTemplatePlaintext = fs.readFileSync('./emails/surveyRequestPlaintext.ejs', 'utf-8')

// Determine whether this is a dry run (skip sending emails)
const dryRun = (process.argv[2] === '--dry-run')
if (dryRun) {
  console.log('Running a dry-run. No emails will actually be sent.')
}

const mailer = nodemailer.createTransport(sparkPostTransport())

// Workaround for HEML bug (see https://github.com/SparkPost/heml/issues/44)
let HEMLrunning = false
const renderHEML = function (emailHEML) {
  return new Promise((resolve, reject) => {
    return setTimeout(function () {
      if (!HEMLrunning) {
        HEMLrunning = true
        const emailHTML = heml(emailHEML)
        HEMLrunning = false
        return resolve(emailHTML)
      } else {
        return setTimeout(function () {
          return resolve(renderHEML(emailHEML))
        }, Math.random() * 1000)
      }
    }, Math.random() * 200)
  })
}

Survey.find({ // Find all the survey requests that should have been sent that have not yet been sent
  sendDate: {
    $lte: new Date()
  },
  sent: false
}).populate('cohort').populate('surveySet').then(function (surveysToSend) {
  console.log('Found %d surveys needing sending.', surveysToSend.length)

  // Calculate the number of emails to send
  const totalEmailsToSend = surveysToSend.reduce((accumulator, currentValue) => accumulator + currentValue.cohort.members.length, 0)
  console.log('We need to send %d total emails', totalEmailsToSend)

  let allSurveyEmailSendingPromises = []

  // Process each survey
  for (let surveyIndex in surveysToSend) {
    let thisSurvey = surveysToSend[surveyIndex]
    console.log('\tProcessing survey in surveySet %s', thisSurvey.surveySet.name)

    // Ensure the survey has cohort details
    if (!thisSurvey.cohort) {
      console.error('Survey with _id %s does not have cohort details', thisSurvey._id)
      continue
    }

    const thisSurveyEmailSendingPromises = thisSurvey.cohort.members.map(member => {
      // Prepare the email data
      const emailData = {
        survey: thisSurvey,
        member: member,
        host: config.host
      }

      // Render the HTML email
      const emailHEML = ejs.render(emailTemplateHEML, emailData)

      // Render the plaintext email
      const emailPlaintext = ejs.render(emailTemplatePlaintext, emailData)

      return renderHEML(emailHEML).then(emailHTML => {
        const emailConfiguration = {
          from: {
            name: 'Keep Asking',
            address: config.OUTBOUND_EMAIL_ADDRESS
          },
          to: member,
          subject: [thisSurvey.cohort.name, thisSurvey.name, 'Feedback'].join(' '),
          text: emailPlaintext,
          html: emailHTML.html
        }

        if (dryRun) {
          return member
        }

        return mailer.sendMail(emailConfiguration)
      }).then(info => {
        return member
      })
    })

    // Append the promises for sending the emails for this survey to all of the other promises
    allSurveyEmailSendingPromises = allSurveyEmailSendingPromises.concat(thisSurveyEmailSendingPromises)
  }
  return Promise.all(allSurveyEmailSendingPromises)
}).then(results => {
  console.log(`Successfully sent emails to ${results.length} recipients.`)
  console.log('Recipients:', results.join(', '))
  process.exit(0)
}).catch(function (err) {
  console.error('Fatal error caught:', err)
  process.exit(1)
})
