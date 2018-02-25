var express = require('express')
var router = express.Router()

// Load external dependencies
// require('cookie-session')
var CentralAuthenticationService = require('cas')

// Load internal modules
var config = require('./config.js')
let User = require.main.require('./models/user.js')

// Configure CAS authentication
var casURL = 'https://fed.princeton.edu/cas/'
var cas = new CentralAuthenticationService({
  base_url: casURL,
  service: config.host + '/auth/verify'
})

router.use('*', function (req, res, next) {
  next()
})

// Redirect the user to Princeton's CAS server
router.get('/login', function (req, res) {
  // Save the user's redirection destination to a cookie
  if (typeof (req.query.redirect) === 'string') {
    req.session.redirect = req.query.redirect
  }

  // Redirect the user to the CAS server
  res.redirect(casURL + 'login?service=' + config.host + '/auth/verify')
})

// Handle replies from Princeton's CAS server about authentication
router.get('/verify', function (req, res) {
  // Check if the user has a redirection destination
  let redirectDestination = req.session.redirect || '/'

  // If the user already has a valid CAS session then send them to their destination
  if (req.session.cas) {
    return res.redirect(redirectDestination)
  }

  let ticket = req.query.ticket

  // If the user does not have a ticket then send them to the homepage
  if (typeof (ticket) === 'undefined') {
    return res.redirect('/')
  }

  // Check if the user's ticket is valid
  cas.validate(ticket, function (err, status, username) {
    if (err) {
      console.error(err)
      return res.sendStatus(500)
    }

    // Save the user's session data
    req.session.username = username

    User.findById(username, function (err, user) {
      if (err) {
        console.error(err)
        return res.sendStatus(500)
      }

      // Carry on to the destination if the user already exists
      if (user) {
        return res.redirect(redirectDestination)
      }

      let newUser = new User({
        username: username
      })
      newUser.save((err, user) => {
        if (err) {
          console.error('New user could not be saved.', err)
          return res.sendStatus(500)
        }
        return res.redirect(redirectDestination)
      })
    })
  })
})

// Log the user out
router.get('/logout', function (req, res) {
  req.session = null
  res.redirect('/')
})

// Export the routes on this router (/login, /verify, and /logout)
module.exports.router = router

// Determine whether the user sending this request is authenticated
let userIsAuthenticated = function (req) {
  return (typeof (req.session.username) !== 'undefined')
}
module.exports.userIsAuthenticated = userIsAuthenticated

// Find the details of the currently logged in user
var loadUser = function (req, res, next) {
  if (!req.session.username) {
    next()
  }

  User.findById(req.session.username, function (err, user) {
    if (err) {
      console.log(err)
      return res.sendStatus(500)
    }

    // Save the user for the duration of the request
    if (user) {
      res.locals.user = user
    }
    next()
  })
}
module.exports.loadUser = loadUser
