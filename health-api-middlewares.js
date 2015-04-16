/**
 * Health API Middlewares
 *
 */

var url = require("url");

var utils = require('./utils.js');
var db = utils.db;
var config = require('./config.js');

exports.errorHandler = function (err, req, res, next) {
    if (err) {
        var timestamp = new Date().toUTCString()
        // Error Handling
        var msg = err.message;
        var user = req.user || 'none';
        console.error(timestamp+': Error on ' + req.method + ' ' + req.url + ': ', msg);
        console.error('User: ');
        console.error(user);
        console.error('Body: ');
        console.error(req.body);

        /*
         *  DB ERRORS
         */
        //  Access Control: Invalid Role!
        if (err.code == 'ER_PROCACCESS_DENIED_ERROR' || err.code == 'ER_TABLEACCESS_DENIED_ERROR'){
            res.statusCode = '403';
            res.send ({error: 'You dont have the permission to use this function.'})
        }
        // Error Handling for duplicate values
        else if (err.code === 'ER_DUP_ENTRY') {
            res.statusCode = 400;
            res.send({error: msg});
        }
        // Error handling for values which must not be null
        else if (err.code == 'ER_BAD_NULL_ERROR'){
            res.statusCode = 400;
            res.send({error: msg});
        }
        // Error handling for ENUMs
        else if (err.code == 'WARN_DATA_TRUNCATED'){
            var me = 'Invalid value!'
            if (msg.indexOf('role') > -1)  me = 'Invalid value! Please check values for role (valid are: admin,doctor,patient)';
            if (msg.indexOf('notificationMode') > -1)  me = 'Invalid value! Please check values for notificationMode (valid are: email,sms,push)';
            if (msg.indexOf('status') > -1)  me = 'Invalid value! Please check values for status (valid are: baseline,exacerbation)';
            if (msg.indexOf('ltotDevice') > -1)  me = 'Invalid value! Please check values for ltotDevice (valid are: concetrator,cylinder,liquid)';
            if (msg.indexOf('ventilationDevice') > -1)  me = 'Invalid value! Please check values for ventilationDevice (valid are: cpap,bipap)';
            res.statusCode = 400;
            res.send({error: me});
        }        // Error handling for ENUMs
        else if (err.code == 'ER_TRUNCATED_WRONG_VALUE'){
            var me = 'Invalid date!'
            if (msg.indexOf('date') > -1)  me = 'Invalid Format of Date! Please use YYYY-MM-DD';
            res.statusCode = 400;
            res.send({error: me});
        }

        // Error Handling for sql signal statements for the triggers
        else if (err.code === 'ER_SIGNAL_EXCEPTION') {
            // 22403 is equiv. to HTTP Error Code 403: Forbidden
            if (err.sqlState == '22403'){
                res.statusCode = 403;
                res.send({error: msg});
            }
            // If Code is 22400 or something else
            // 22400 is equiv. to HTTP Error Code 400: Bad Request (has errors, should be altered and resend)
            else {
                res.statusCode = 400;
                res.send({error: msg});
            }
        }
        // Error Handling Account Deletion
        else if (err.code == 'ER_ROW_IS_REFERENCED'){
            var me = 'Reference Error. Please Contact Admin!';
            if (msg.indexOf('fkDoctor') >1)   me = 'The doctor you are trying to delete has still some patients assigned to him. Reassign the patients first!';
            if (msg.indexOf('fkPatient') >1)  me = 'The patient you are trying to delete has still medical records. Delete patients data first!';

            res.statusCode = 400;
            res.send({error: me});
        }

        /*
         *  LOGIN ERROR
         */
        else if (err.name == 'TokenError'){
            res.statusCode = 401;
            res.send({error: 'Invalid Credentials'});
        }


        /*
         *  INVALID JSON ERROR
         */
        else if (err.name == 'SyntaxError'){
            res.statusCode = 400;
            res.send({error: 'Invalid JSON'});
        }

        /*
         *  ANY OTHER ERRORS
         */
        else {
            console.log(err.stack);
            res.statusCode = 500;
            res.send({err: 'Internal Server Error'});
        }
    }
    // shouldnt happen!
    else {
        console.log(err.stack);
        res.statusCode = 500;
        res.send({err: 'Internal Server Error. Please Contact the Admin!'});
    }
};


exports.databaseHandler = function(req,res,next){
    db.getConnection(function(err, connection) {
        if (err) {
            next(err);
        } else {
            //2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
            //   Password is "calculated" by function defined in config.js - currently its a concatenation of a given prefix and user id
            connection.changeUser({
                user: req.user.accountId,
                password: utils.calculatePW(req.user.accountId)
            }, function (err) {
                if (err) {
                    next(err);
                }
                req.con = connection;
                next();
            });
        }
    });
};

exports.resultProcessor = function (req, res, next){
    /*
     Naming Conventions:
     GET -> res contains result
     (GET /ressources: result has at most 2 members: array of ressource and _links)
     (GET /ressources/id: result is final result )
     POST -> res contains loc
     PUT/DELETE -> res contains affected_rows
     */
    if (res.loc){
        if (res.modified) res.setHeader('Last-Modified' , res.modified);
        res.location(res.loc);
        res.sendStatus (201);
    }
    else if (res.affectedRows){
        if (res.affectedRows > 0) res.sendStatus(204);
        else res.sendStatus(404);
    }
    else if (res.result){
        var count = Object.keys(res.result).length;
        if (count == 0) res.sendStatus (404)
        else {
            var arr = false;
            var empty = true;
            if (count <= 2) {
                for (var k in res.result)
                    if (Array.isArray(res.result[k]) && res.result.hasOwnProperty(k)) {
                        arr = true;
                        if (res.result[k].length > 0) {
                            empty = false;
                            var curdate = "";
                            for (var i in res.result[k]){
                                var max_timestamp = 0;
                                if (res.result[k][i].modified) {
                                    var d = Date.parse(res.result[k][i].modified);
                                    if (d>max_timestamp) {
                                        max_timestamp = d;
                                        curdate = res.result[k][i].modified;
                                    }
                                    delete res.result[k][i].modified;
                                }
                            }
                            res.setHeader('Last-Modified' , curdate);
                        }
                    }
            }
            if (arr && empty) res.sendStatus(204)
            else {
                if (res.result.modified){
                    res.setHeader('Last-Modified' , res.result.modified);
                    delete res.result.modified;
                }
                res.statusCode = 200;
                res.send(res.result);
            }
        }
    }
    else next(new Error('ResultProcessor: no result found'))
};

