const express = require('express')
const cluster = require('cluster')
const app = express()
const session = require('cookie-session')

require('dotenv').config()
const config = require('./controllers/config.js')
const auth = require('./controllers/authentication.js')

require('./controllers/database.js')

// Configure session cookies
app.use(session({
  secret: config.sessionSecret,
  maxAge: 24 * 60 * 60 * 1000 * 365 // 365 days
}))

// Attempt to load the currently logged-in user
app.use(auth.loadUser)

const api = require('./controllers/api.js')
const views = require('./controllers/views.js')
app.use('/api', api.router)
app.use('/auth', auth.router)
app.use(views.router)

// Configure the EJS templating system (http://www.ejs.co)
app.set('view engine', 'ejs')

// Configure routing to the public folder
app.use(express.static('public'))

// Start our group of clusters to handle requests
if (cluster.isMaster) {
  const os = require('os')
  const workers = process.env.WEB_CONCURRENCY || os.cpus().length || 1

  console.log(`Forking for ${workers} workers`)
  for (let i = 0; i < workers; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log(`Worker ${worker.id} crashed. ` + 'Starting a new worker...')
      cluster.fork()
    }
  })
} else {
  // Start listening for requests
  app.listen(config.port, function () {
    console.log(`Listening for requests on ${config.host}`)
  })
}
