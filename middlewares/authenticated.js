'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var key = 'TWITTERKINAL123';

exports.ensureAuth = (req, res, next)=>{
    if(req.headers.authorization){
        var token = req.headers.authorization.replace(/['"]+/g, '');
        try{
            var payload = jwt.decode(token, key);
            if(payload.exp <= moment().unix()){
                return res.status(401).send({message: 'Token expirado'});
            }
        }catch(ex){
            return res.status(404).send({message: 'Token no valido'});
        }
        req.user = payload;
    }
    next();
}