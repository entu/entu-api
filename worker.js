if(process.env.NEW_RELIC_LICENSE_KEY) require('newrelic')

var express  = require('express')
var passport = require('passport')
var bparser  = require('body-parser')
var bugsnag  = require('bugsnag')



// global variables (and list of all used environment variables)
APP_VERSION = require('./package').version
APP_STARTED = new Date().toISOString()
APP_PORT    = process.env.PORT || 3000
APP_BUGSNAG = process.env.BUGSNAG_KEY

GOOGLE_ID = process.env.GOOGLE_ID
GOOGLE_SECRET = process.env.GOOGLE_SECRET

FACEBOOK_ID = process.env.FACEBOOK_ID
FACEBOOK_SECRET = process.env.FACEBOOK_SECRET

TAAT_ENTRYPOINT = process.env.TAAT_ENTRYPOINT
TAAT_ISSUER = process.env.TAAT_ISSUER
TAAT_CERT = process.env.TAAT_CERT
TAAT_PRIVATECERT = process.env.TAAT_PRIVATECERT



// logs to bugsnag.com
if(APP_BUGSNAG) bugsnag.register(APP_BUGSNAG)



// passport (de)serialize
passport.serializeUser(function(user, done) {
    done(null, user)
})

passport.deserializeUser(function(user, done) {
    done(null, user)
})



var app = express()

// logs to bugsnag.com
if(APP_BUGSNAG) app.use(bugsnag.requestHandler)

// Initialize Passport
app.use(passport.initialize())

// parse POST requests
app.use(bparser.json())
app.use(bparser.urlencoded({extended: true}))

// routes mapping
.use('/user', require('./routes/user'))

// provider mapping (only if configured)
if(GOOGLE_ID && GOOGLE_SECRET) app.use('/google', require('./routes/google'))
if(FACEBOOK_ID && FACEBOOK_SECRET) app.use('/facebook', require('./routes/facebook'))
if(TAAT_ENTRYPOINT && TAAT_CERT && TAAT_PRIVATECERT) app.use('/taat', require('./routes/taat'))

// logs to bugsnag.com
if(APP_BUGSNAG) app.use(bugsnag.errorHandler)

// show error
app.use(function(err, req, res, next) {
        var status = parseInt(err.status) || 500

        res.status(status)
        res.send({
            error: err.message,
            version: APP_VERSION,
            started: APP_STARTED
        })

        if(err.status !== 404) console.log(err)
    })



// start server
app.listen(APP_PORT)



console.log(new Date().toString() + ' started listening port ' + APP_PORT)
