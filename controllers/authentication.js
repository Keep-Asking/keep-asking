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

// Allow administrator to change login
router.get('/login/master', (req, res) => {
  if (!req.user.admin) {
    return res.status(401).send(`You are ${req.user.id}. <a href="/">Go home</a>`)
  }
  return User.findById(req.query.userID).then(user => {
    if (!user) {
      return res.sendStatus(404)
    }
    return req.login(user, function (err) {
      if (err) {
        console.error(err)
        return res.sendStatus(500)
      }
      res.status(200).send(`User login complete. You are now ${req.user._id}. <a href="/">Go home</a>`)
    })
  })
})

// Log the user out
router.get('/logout', function (req, res) {
  req.logout()
  res.redirect('/')
})

// Export the routes on this router (/login, /verify, and /logout)
module.exports.router = router
