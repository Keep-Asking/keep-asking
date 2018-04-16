const mailer = require('./emailManager.js').mailer
const fs = require('fs')
const ejs = require('ejs')
const mongoose = require('mongoose')

const Cohort = mongoose.model('Cohort')
const config = require('./config.js')
const generateCohortInvitationHash = require('./hash.js').generateCohortInvitationHash

const joinCohortRequestHTMLTemplate = fs.readFileSync('./emails/joinCohortRequestHTML.ejs', 'utf-8')
const joinCohortRequestPlaintextTemplate = fs.readFileSync('./emails/joinCohortRequestPlaintext.ejs', 'utf-8')

const joinCohortRequestHTMLGenerator = ejs.compile(joinCohortRequestHTMLTemplate)
const joinCohortRequestPlaintextGenerator = ejs.compile(joinCohortRequestPlaintextTemplate)

const millisecondsPerDay = 24 * 60 * 60 * 1000

const sendCohortCoOwnerInvitationEmail = function (cohortID, sendingUser, newCoownerEmail) {
  return Cohort.findById(cohortID).then(cohort => {
    const invitationExpirationTime = Date.now() + 7 * millisecondsPerDay
    const invitationHash = generateCohortInvitationHash(cohortID, newCoownerEmail, invitationExpirationTime)
    const acceptInvitationURL = config.host + '/cohorts/' + cohortID + '/invitation/' + encodeURIComponent(newCoownerEmail) + '/accept' + '?hash=' + invitationHash + '&invitationExpirationTime=' + invitationExpirationTime

    const emailData = {
      cohortName: cohort.name,
      user: sendingUser,
      acceptInvitationURL: acceptInvitationURL
    }

    // Generate the HTML and Plaintext messages using the templates
    const joinCohortRequestHTML = joinCohortRequestHTMLGenerator(emailData)
    const joinCohortRequestPlaintext = joinCohortRequestPlaintextGenerator(emailData)

    const emailConfiguration = {
      from: {
        name: sendingUser.fullName,
        address: sendingUser.fullName.split(' ').join('.').toLowerCase() + '@' + config.OUTBOUND_EMAIL_DOMAIN
      },
      replyTo: {
        name: sendingUser.fullName,
        address: sendingUser.email
      },
      to: newCoownerEmail,
      subject: `Invitation to Manage ${cohort.name} on Keep Asking`,
      text: joinCohortRequestPlaintext,
      html: joinCohortRequestHTML
    }
    console.log('Sending email with configuration:', emailConfiguration)
    return mailer.sendMail(emailConfiguration)
  })
}

module.exports = {
  sendCohortCoOwnerInvitationEmail
}
