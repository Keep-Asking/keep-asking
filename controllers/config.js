// This script loads configuration information
// Other scripts import it to gain access to important configuration details

// The domain and port on which the app is running
var host = process.env.HOST || 'http://localhost:5000'
module.exports.host = host

// The domain and port on which the app is running
var port = process.env.PORT || 5000
module.exports.port = port

// The secret used to sign session cookies
module.exports.sessionSecret = process.env.SESSION_SECRET || 'abcdefghijklmnop'

// The database URI
if (typeof (process.env.MONGODB_URI) === 'undefined') {
  console.log("No database URI has been set in this app's config file. You must set the config variable 'MONGODB_URI' to point to a MongoDB database.")
  process.exit(1)
}
module.exports.MongoDBURI = process.env.MONGODB_URI
