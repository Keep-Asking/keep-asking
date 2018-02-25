let express = require('express')
let app = express()
let session = require('cookie-session')

require('dotenv').config()
var config = require('./controllers/config.js')
let auth = require('./controllers/authentication.js')

require('./controllers/database.js')

// Configure session cookies
app.use(session({
  secret: config.sessionSecret,
  maxAge: 24 * 60 * 60 * 1000 * 365 // 365 days
}))

// Attempt to load the currently logged-in user
app.use('*', auth.loadUser)

app.use('/auth', auth.router)

// Route a request for the homepage
app.get('/', function (req, res) {
  // Check whether the user sending this request is authenticated
  if (auth.userIsAuthenticated(req)) {
    res.render('dashboard', req.session)
    return
  }
  res.render('splash', req.session)
})

// Configure the EJS templating system (http://www.ejs.co)
app.set('view engine', 'ejs')

// Configure routing to the public folder
app.use(express.static('public'))

app.listen(config.port, function () {
  console.log('Listening for reqs on port %d.', config.port)
})
