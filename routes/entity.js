var _      = require('lodash')
var async  = require('async')
var op     = require('object-path')
var router = require('express').Router()

var entu   = require('../helpers/entu')



router.get('/', function(req, res, next) {
    if (!req.customer) { return next([400, new Error('No customer parameter')]) }

    async.waterfall([
        function(callback) {
            entu.dbConnection(req.customer, callback)
        },
        function(connection, callback) {
            let props = _.compact(op.get(req, 'query.props', '').split(','))
            let filter = {}
            let fields = {}
            let limit = req.query.limit || 100

            if(req.query.def) { 'filter.definition.string' = req.query.def }
            filter._access = entu.objectId(req.user)

            if (props.length > 0) {
                _.forEach(props, function(f) {
                    op.set(fields, f, true)
                })
                op.set(fields, '_access', true)
            }
            fields._mid = false

            connection.collection('entity').find(filter, fields).limit(limit).toArray(callback)
        },
    ], function(err, entities) {
        if (err) { return next(err) }

        res.respond(_.map(entities, function (entity) {
            delete entity._access
            return entity
        }))

    })
})



router.get('/:entityId', function(req, res, next) {
    var entityId = entu.objectId(req.params.entityId)

    if (!entityId) { return next([422, new Error('Invalid Entity ID')]) }
    if (!req.customer) { return next([400, new Error('No customer parameter')]) }

    async.waterfall([
        function(callback) {
            entu.dbConnection(req.customer, callback)
        },
        function(connection, callback) {
            let props = _.compact(op.get(req, 'query.props', '').split(','))
            let config = {}

            if (props.length > 0) {
                _.forEach(props, function(f) {
                    op.set(config, ['fields', f], true)
                })
                op.set(config, 'fields._access', true)
            }

            connection.collection('entity').findOne({ _id: entityId }, config, callback)
        },
    ], function(err, entity) {
        if (err) { return next(err) }

        if (!entity) { return next([404, new Error('Entity not found')]) }

        let access = _.map(op.get(entity, '_access', []), function (s) {
            return s.toString()
        })

        if (access.indexOf(req.user) !== -1 || op.get(entity, '_sharing.0.string', '') === 'public access is disabled for now') {
            delete entity._mid
            delete entity._access
            res.respond(entity)
        } else {
            return next([403, new Error('Forbidden')])
        }
    })
})



module.exports = router
