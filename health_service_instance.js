/**
 * Imports
 */
var express = require('express'),
    http = require('http'),
    https = require('https'),
    swagger = require('swagger-node-express'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    APIKeyStrategy = require('./APIKeyStrategy.js'),
    passport = require('passport'),
    cluster = require('cluster');

var ctrl_utils = require('./health-api-middlewares');

if (cluster.isMaster) {
    var cpuCount = require('os').cpus().length;
    var amount = require('./config.js').workers;
    for (var i = 0; i < cpuCount && (i < amount || amount == -1); i++) {
        cluster.fork();
    }

    cluster.on('listening', function(worker, address) {
        var timestamp = new Date().toUTCString();

        console.log(timestamp + ": Worker "+ worker.process.pid + " is now listening on " + address.port);
    });

} else {
    /**
     *
     * Config & Vars
     */
    var app = express();
    var oauth2 = require('./oauth2.js'),
        utils = require('./utils.js'),
        config = require('./config.js'),
        ssl = config.ssl;
    var api_docs = "/api-docs";
    swagger.setAppHandler(app);
    swagger.configureSwaggerPaths("", api_docs, "");
    swagger.setHeaders = function setHeaders(res) {
        res.header("Content-Type", "application/json; charset=utf-8");
    };

    var tmp = parseInt(process.argv[2]);
    var port = tmp || -1;

    /**
     * REST API
     */
    //app.use(function(req,res,next){console.log(req); next();});

    app.use(passport.initialize());

    /*
     *  This Functions checks whether a token is valid
     *  If the token is valid, user data will be stored in req.user
     *
     *  to use this strategy apply passport.authenticate(['bearer'], { session: false }) to the stack
     */
    passport.use(new APIKeyStrategy(function(apikey, user, done) {
        if (apikey == '1234') done(null, {accountId : user});
        else done(null, false);
    }));

    //setup login-Endpoint
    app.use('/login',  bodyParser.json({}));
    swagger.addPost({'spec':oauth2.loginSpec,'action':oauth2.endpoint})

    //setup protected ECHO Endpoints
    var echo_endpoints = ['/accounts', '/patients', '/questions','/notifications','/createPatientAndAccount','/changeDoctor', '/devices'];
    var echo_middlewares = [passport.authenticate(['apikey'], { session: false }), bodyParser.json({}),  ctrl_utils.databaseHandler];

    for (var i = 0; i< echo_endpoints.length; i++){
        app.use(echo_endpoints[i], echo_middlewares);
    };


    var models = {
        CollectionLinks : {
            id : "CollectionLinks",
            required : ["self", "first"],
            properties: {
                self : {"type":"string", "description": "Link to this Collection"},
                first : {"type":"string", "description": "Link to first Page of this Collection"},
                next : {"type":"string", "description": "Link to next Page of this Collection"},
                back : {"type":"string", "description": "Link to previous Page of this Collection"}
            }
        },
        ErrorMsg : {
            id : "ErrorMsg",
            required: ["error"],
            properties: {
                error : {"type":"string", "description": "Error Message"}
            }
        }

    };
    swagger.addModels({models:models});

    // Loading Controllers
    var files = utils.getFilesFromDir('./controller');

    for (var i = 0; i < files.length; i++){
        //var res_name = files[i].split('/').pop().split('.')[0];
        if (fs.statSync(files[i]).isFile()){
            var ctrl = require (files[i]);
            // Load File only if there is a property called models (which is supposed to contain swagger models)
            if (ctrl.models){
                swagger.addModels(ctrl);

                for (var fkt in ctrl){
                    // iterate over all properties with 'Spec' in name
                    // and load the corresponding functions into swagger
                    if (ctrl.hasOwnProperty(fkt) && fkt.indexOf("Spec") > -1) {
                        swagger.addHandlers(ctrl[fkt].method , { '0': {spec: ctrl[fkt], action: ctrl[fkt.split("Spec")[0]]}});

                    }
                }
            }
        };
    };

    for (var i = 0; i< echo_endpoints.length; i++){
        app.use(echo_endpoints[i], ctrl_utils.resultProcessor);
    };
    app.use(ctrl_utils.errorHandler);

    /**
     * Final Swagger Settings
     */
    swagger.configureDeclaration("patients", {
        description : "CRUD Ops for Patients and Medical Records",
        produces: ["application/json"]
    });

    swagger.configureDeclaration("accounts", {
        description : "Account Operations",
        produces: ["application/json"]
    });

    swagger.configureDeclaration("questions", {
        description : "Ops about Creating/Getting Questions with Answers",
        produces: ["application/json"]
    });

    swagger.configureDeclaration("notifications", {
        description : "Ops about Notifications",
        produces: ["application/json"]
    });

    /**
     * Main
     */

    swagger.configure("http://localhost:80", "0.1");

    var server = http.createServer(app);
    server.on('error', function (err) {
        if (err.message.indexOf('EADDRINUSE') > 1) console.error('Port in use. Server already running?');
        else console.error(err.stack);
        process.exit(1);
    });
    server.listen(port, function () {
        var timestamp = new Date().toUTCString();
        console.log(timestamp + ': ECHO Health Services listening on port ' + port);
    });
}

