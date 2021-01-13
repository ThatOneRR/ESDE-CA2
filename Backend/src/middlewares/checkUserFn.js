const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { createJSONResponse, Status } = require('../helpers/jsonFormatter');

module.exports.getClientUserId = (req, res, next) => {
    console.log('http header - user ', req.headers['user']);
    jwt.verify(req.headers['user'], config.JWTKey, (error, result) => {
        if (!error) {
            req.body.userId = result.id;
            next()
        } else {
            res.status(403).send(createJSONResponse('Invalid token', Status.FAIL, null));
        }
    });
} //End of getClientUserId