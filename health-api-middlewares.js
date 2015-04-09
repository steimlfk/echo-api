/**
 * Health API Middlewares
 *
 */

var url = require("url");

var utils = require('./utils.js');
var db = utils.db;
var config = require('./config.js');


var exam_commons = {
    methods: {
        get: ['doctor'],
        post: ['doctor']

    },
    instance: {
        methods: {
            get: ['doctor'],
            put: ['doctor'],
            delete: ['doctor']
        }
    }
};

var questions_commons = {
    methods: {
        get: ['admin', 'doctor', 'patient']
    }
}

// notifications dont appear in this structure because the resource /notifications can be accessed by everyone who has
// an account. (Opposed to /accounts where some functions are only allowed to be used by an admin. Because of this
// fact, accounts has to be specified in this structure)
var permissions= {
    patients : {
        methods: {
            get: ['doctor', 'admin'],
            post: ['doctor', 'admin']

        },
        instance: {
            methods: {
                get: ['doctor', 'admin'],
                put: ['doctor', 'admin'],
                delete: ['doctor', 'admin']
            },
            daily_reports: {
                methods: {
                    get: ['patient', 'doctor'],
                    post: ['patient','doctor']

                },
                instance: {
                    methods: {
                        get: ['patient','doctor'],
                        put: ['patient','doctor'],
                        delete: ['patient','doctor']
                    }
                }
            },
            death : {
                post: ['doctor'],
                get: ['doctor'],
                put: ['doctor'],
                delete: ['doctor']
            },
            cats : exam_commons,
            ccqs : exam_commons,
            charlsons : exam_commons,
            readings : exam_commons,
            severity : exam_commons,
            treatments : exam_commons
        }
    },
    accounts : {
        methods: {
            get: ['doctor', 'admin', 'patient'],
            post: ['doctor', 'admin']

        },
        instance: {
            methods: {
                get: ['doctor', 'admin', 'patient'],
                put: ['doctor', 'admin', 'patient'],
                delete: ['admin']
            }
        }
    },
    createPatientAndAccount: {
        methods: {
            post : ['doctor','admin']
        }
    },
    changeDoctor: {
        methods: {
            post: ['admin']
        }
    },
    questions: {
        methods: {
            get: ['doctor', 'admin', 'patient'],
            post: ['admin']
        },
        instance: {
            methods: {
                delete: ['admin']
            }
        },
        ccq : questions_commons,
        cat : questions_commons,
        charlson : questions_commons,
        daily: questions_commons
    }

};

exports.accessControl = function (req, res, next){
    var url_parts = url.parse(req.originalUrl);
    var path = url_parts.pathname.split("/");
    var role = (req.user)? req.user.role : 'none';
    var err = new Error('Invalid Role');
    err.name = 'RoleError';
    var meth = req.method.toLowerCase();

    if (permissions[path[1]]){
        var perm = permissions;
        var not_finished = true;
        var i = 1;
        while (not_finished){
            var next_step ='';

            if (perm.hasOwnProperty(path[i])) {
                next_step = path[i];
            }
            else next_step = 'instance';

            perm = perm[next_step];
            //TODO Null Check!

            if (i < path.length-1) i++;
            else not_finished = false;
        }

        if (perm.methods[meth].indexOf(role) != -1) next();
        else next(err);

    }
    else next();

};


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
         *  Access Control: Invalid Role!
         */
        if (err.name == 'RoleError'){
            res.statusCode = '403';
            res.send ({error: 'You dont have the permission to do this.'})
        }

        /*
         *  DB ERRORS
         */
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
            res.statusCode = 500;
            res.send({err: 'Internal Server Error'});
        }
    }
    // shouldnt happen!
    else {
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
                for (k in res.result)
                    if (k.isArray && res.result.hasOwnProperty(k)) {
                        arr = true;
                        if (res.result.k.length > 0) empty = false;
                    }
            }
            if (arr && empty) res.sendStatus(204)
            else {
                res.statusCode = 200;
                res.send(res.result);
            }
        }
    }
    else next(new Error('ResultProcessor: no result found'))
};

