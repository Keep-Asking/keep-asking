var express = require('express')
var router = express.Router()

// Load external dependencies
// require('cookie-session')
var CentralAuthenticationService = require('cas')

// Load internal modules
var config = require('./config.js')
// var UserModel = require.main.require('./models/user.js')

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
    res.redirect(redirectDestination)
    return
  }

  var ticket = req.query.ticket

  // If the user does not have a ticket then send them to the homepage
  if (typeof (ticket) === 'undefined') {
    res.redirect('/')
    return
  }

  // Check if the user's ticket is valid
  cas.validate(ticket, function (err, status, netid) {
    if (err) {
      console.log(err)
      res.sendStatus(500)
      return
    }

    // Save the user's session data
    req.session.username = netid

    // // Find the user in the database with this netid
    // UserModel.findById(netid, function (err, user) {
    //   if (err) {
    //     console.log(err)
    //     res.sendStatus(500)
    //     return
    //   }
    //
    //   // If the user doesn't exist, create a new user
    //   if (user == null) {
    //     var newUser = new UserModel({
    //       _id: netid
    //     })
    //     newUser.save(function (error) {
    //       if (error) {
    //         console.log(error)
    //         res.sendStatus(500)
    //         return
    //       }
    //       res.redirect(redirectDestination)
    //     })
    //   } else {
    //     res.redirect(redirectDestination)
    //   }
    // })
    res.redirect(redirectDestination)
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
var userIsAuthenticated = function (req) {
  return (typeof (req.session.username) !== 'undefined')
}
module.exports.userIsAuthenticated = userIsAuthenticated

// Find the details of the currently logged in user
var loadUser = function (req, res, next) {
  next()
  // if (req.session.cas) {
  //   UserModel.findOne({_id: req.session.cas.netid}, function (err, user) {
  //     if (err) {
  //       console.log(err)
  //     }
  //     if (user != null) {
  //       // Save the user for the duration of the request
  //       res.locals.user = user
  //     }
  //     next()
  //   })
  // } else {
  //   next()
  // }
}
module.exports.loadUser = loadUser
