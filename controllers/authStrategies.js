const config = require('./config.js')

const User = require.main.require('./models/user.js')

// Load Strategies
const CasStrategy = require('passport-cas2').Strategy
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const CustomStrategy = require('passport-custom').Strategy

// Prepare Princeton CAS Strategy
const princetonCASURL = 'https://fed.princeton.edu/cas/'
const preparedPrincetonStrategy = new CasStrategy({
  casURL: princetonCASURL
}, function verify (username, profile, done) {
  User.findOrCreate({
    _id: username + '@princeton',
    provider: 'princeton',
    email: username + '@princeton.edu'
  }, done)
})

// Prepare Google Strategy
const preparedGoogleStrategy = new GoogleStrategy({
  clientID: config.GOOGLE_API.clientID,
  clientSecret: config.GOOGLE_API.clientSecret,
  callbackURL: config.host + '/auth/login/google/callback'
}, function (token, tokenSecret, profile, done) {
  User.findOrCreate({
    _id: profile.id + '@google',
    provider: 'google',
    email: profile.emails[0].value
  }, (err, user) => {
    // Update user's name and email if changes have been made
    user.name = profile.name
    if (user.isModified()) {
      user.save()
    }

    // Return the user to the callback
    return done(err, user)
  })
})

// Authenticate using an API key
const preparedAPIKeyStrategy = new CustomStrategy(
  function (req, done) {
    if (req.isAuthenticated()) {
      return done(null, req.user)
    }
    const apikey = req.query.apikey || req.body.apikey
    if (!apikey) {
      return done(null, false)
    }
    User.findOne({
      apikey: apikey
    }, function (err, user) {
      done(err, user)
    })
  }
)

module.exports = {
  princeton: preparedPrincetonStrategy,
  google: preparedGoogleStrategy,
  apikey: preparedAPIKeyStrategy
}
