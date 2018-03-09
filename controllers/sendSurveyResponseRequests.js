const nodemailer = require('nodemailer')
const sparkPostTransport = require('nodemailer-sparkpost-transport')
const fs = require('fs')
const heml = require('heml')

require('dotenv').config()
require('./config.js')
require('./database.js')

const Survey = require('./../models/survey.js')
const emailHEML = fs.readFileSync('./email.heml', 'utf8')

const mailer = nodemailer.createTransport(sparkPostTransport())

Survey.find({
  sendDate: {
    $lte: new Date()
  },
  sent: false
}).populate('cohort').then(function (surveysToSend) {
  // Process each survey
  for (let surveyIndex in surveysToSend) {
    let thisSurvey = surveysToSend[surveyIndex]

    // Ensure the survey has cohort details
    if (!thisSurvey.cohort) {
      console.error('Survey with _id %s does not have cohort details', thisSurvey._id)
      continue
    }

    thisSurvey.cohort.members.forEach(async (member) => {
      console.log(member)

      const HEMLoutput = await heml(emailHEML)

      mailer.sendMail({
        from: {
          name: 'Fast Feedback',
          address: 'survey@ffmail.sebthedev.com'
        },
        to: member,
        subject: 'Testing Nodemailer with Sparkpost',
        text: 'Hello, this is a plain-text message for cohort' + thisSurvey.cohort.name,
        html: HEMLoutput.html
      }).then(info => {
        console.log('Send successfully to', member, info)
      }).catch(err => {
        console.error('Send unsuccessfully to', member, err)
      })
    })
  }
  // process.exit()
}).catch(function (err) {
  console.error(err)
})
