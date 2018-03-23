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
const emailTemplatePlaintext = fs.readFileSync('./emails/surveyRequest.ejs', 'utf-8')

const mailer = nodemailer.createTransport(sparkPostTransport())

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
  let emailsSendingAttempts = 0

  // Process each survey
  for (let surveyIndex in surveysToSend) {
    let thisSurvey = surveysToSend[surveyIndex]
    console.log('\tProcessing survey in surveySet %s', thisSurvey.surveySet.name)

    // Ensure the survey has cohort details
    if (!thisSurvey.cohort) {
      console.error('Survey with _id %s does not have cohort details', thisSurvey._id)
      continue
    }

    thisSurvey.cohort.members.forEach(async (member) => {
      console.log('\t\tProcessing survey request for member', member)

      // Prepare the email data
      const emailData = {
        survey: thisSurvey,
        member: member,
        host: config.host
      }

      // Render the HTML email
      const emailHEML = ejs.render(emailTemplateHEML, emailData)
      const emailHTML = await heml(emailHEML)

      // Render the plaintext email
      const emailPlaintext = ejs.render(emailTemplatePlaintext, emailData)

      mailer.sendMail({
        from: {
          name: 'Keep Asking',
          address: config.OUTBOUND_EMAIL_ADDRESS
        },
        to: member,
        subject: [thisSurvey.cohort.name, thisSurvey.name, 'Feedback'].join(' '),
        text: emailPlaintext,
        html: emailHTML.html
      }).then(info => {
        console.log('\t\tSent successfully to', member, info)
        emailsSendingAttempts++
        if (emailsSendingAttempts >= totalEmailsToSend) {
          console.log('Attempted to send all the emails! Quitting.')
          process.exit(0)
        }
      }).catch(err => {
        console.error('\t\tSend unsuccessfully to', member, err)
        emailsSendingAttempts++
        if (emailsSendingAttempts >= totalEmailsToSend) {
          console.log('Attempted to send all the emails! Quitting.')
          process.exit(0)
        }
      })
    })
  }
}).catch(function (err) {
  console.error(err)
})
