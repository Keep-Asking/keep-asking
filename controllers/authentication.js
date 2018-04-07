const express = require('express')
const router = express.Router()
const passport = require('passport')
const preparedStrategies = require('./authStrategies.js')

// Load internal modules
const User = require.main.require('./models/user.js')

// Initialize Passport
router.use(passport.initialize())
router.use(passport.session())

// Load Authentication Strategies
passport.use('princeton', preparedStrategies.princeton)
passport.use(preparedStrategies.google)

// Define methods for serializing and deserializing users from the session cookie
passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findById(id, function (err, user) {
    done(err, user)
  })
})

// Bind authentication strategies to routes
router.get('/login/princeton', passport.authenticate('princeton', { successRedirect: '/', failureRedirect: '/' }))

router.get('/login/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/login/google/callback', passport.authenticate('google', {
  successRedirect: '/',
  failureRedirect: '/login'
}))

// Log the user out
router.get('/logout', function (req, res) {
  req.logout()
  res.redirect('/')
})

// Export the routes on this router (/login, /verify, and /logout)
module.exports.router = router
