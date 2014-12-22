var url = require("url");

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
            post : ['doctor']
        }
    },
    changeDoctor: {
        methods: {
            post: ['admin']
        }
    }

};

exports.accessControl = function (req, res, next){
    var url_parts = url.parse(req.url);
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
            var next_step ="";
            //next part of url is a number
            if (!isNaN(parseInt(path[i]))){
                next_step = 'instance';
            }
            // next part is a term (hopefully referenced in permissions...TODO Check)
            else next_step = path[i];
            perm = perm[next_step];

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
        // Error Handling
        var msg = err.message;
        var user = req.body.user || 'none';
        console.error('Error on ' + req.method + ' ' + req.url + ': ', msg);
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