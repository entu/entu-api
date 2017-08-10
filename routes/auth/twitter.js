var _        = require('lodash')
var passport = require('passport')
var router   = require('express').Router()
var twitter  = require('passport-twitter').Strategy

var entu   = require('../../helpers/entu')



passport.use(new twitter({
        consumerKey: TWITTER_KEY,
        consumerSecret: TWITTER_SECRET,
        callbackURL: '/auth/twitter/callback',
        proxy: true
    },
    function (token, tokenSecret, profile, done) {
        process.nextTick(function () {
            return done(null, profile)
        })
  }
))



router.get('/', function (req, res) {
    res.clearCookie('redirect')
    res.clearCookie('session')

    if(req.query.next) {
        res.cookie('redirect', req.query.next, {
            maxAge: 10 * 60 * 1000
        })
    }

    res.redirect('/auth/twitter/auth')
})



router.get('/auth', passport.authenticate('twitter'), function () {

})



router.get('/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), function (req, res, next) {
    var user = {}
    var name = _.compact([
        _.get(req, ['user', 'name', 'givenName']),
        _.get(req, ['user', 'name', 'middleName']),
        _.get(req, ['user', 'name', 'familyName'])
    ]).join(' ')

    _.set(user, 'provider', 'twitter')
    _.set(user, 'id', _.get(req, ['user', 'id']))
    _.set(user, 'name', name)
    _.set(user, 'email', _.get(req, ['user', 'emails', 0, 'value']))
    _.set(user, 'picture', _.get(req, ['user', 'photos', 0, 'value']))

    entu.addUserSession({
        request: req,
        user: user
    }, function (err, sessionId) {
        if(err) { return next(err) }

        var redirectUrl = req.cookies.redirect
        if(redirectUrl) {
            res.clearCookie('redirect')
            res.redirect(redirectUrl + '?session=' + sessionId)
        } else {
            res.redirect('/auth/session/' + sessionId)
        }
    })
})



module.exports = router
