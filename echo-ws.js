/**
 * Imports
 */
var express = require('express'),
    http = require('http'),
    https = require('https'),
    path = require('path'),
    passport = require('passport'),
    bodyParser = require('body-parser'),
    serveStatic = require('serve-static'),
    swagger = require('swagger-node-express'),
    fs = require('fs'),
    jwt = require('jsonwebtoken'),
    BearerStrategy = require('passport-http-bearer').Strategy,
    schedule = require('node-schedule');

var ctrl_utils =				require('./health-api-middlewares');

/**
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

var tokensecret = config.tokensecret;

var port = config.port;
var host = config.host;
var url_port = config.url_port;


app.set('port', port);
app.use(passport.initialize());

/*
 *  This Functions checks whether a token is valid
 *  If the token is valid, user data will be stored in req.user
 *
 *  to use this strategy apply passport.authenticate(['bearer'], { session: false }) to the stack
 */
passport.use(new BearerStrategy({"realm" : "ECHO REST-API"}, function(accessToken, done) {
    // check validity of given token using the secret
    jwt.verify(accessToken, tokensecret, function(err, decoded) {
        if (err) { return done(null, false); }

        // token was valid, data from retval will be stored in req.user
        var retval = {
            'accountId' : decoded.accountId,
            'role' : decoded.role
        };
        done(null, retval);

    });
}));


/**
 * REST API
 */
app.get('/', function(req, res){res.redirect('/docs');});

//setup login-Endpoint
app.use('/login', bodyParser.json(), bodyParser.urlencoded({ extended: false }));
swagger.addPost({'spec':oauth2.loginSpec,'action':oauth2.endpoint})

//setup protected ECHO Endpoints
var echo_endpoints = ['/accounts', '/patients', '/questions','/notifications','/createPatientAndAccount','/changeDoctor', '/devices'];
var echo_middlewares = [passport.authenticate(['bearer'], { session: false }), bodyParser.json(),bodyParser.urlencoded({ extended: false }), ctrl_utils.databaseHandler];

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
 * Swagger UI
 */
//Serve up swagger ui at /docs via static route
var docs_handler = serveStatic(__dirname + '/docs/');
app.get(/^\/docs(\/.*)?$/, function(req, res, next) {
    if (req.url === '/docs') { // express static barfs on root url w/o trailing slash
        res.writeHead(302, { 'Location' : req.url + '/' });
        res.end();
        return;
    }
    // take off leading /docs so that connect locates file correctly
    req.url = req.url.substr('/docs'.length);
    return docs_handler(req, res, next);
});

/**
 * Final Swagger Settings
 */
swagger.configureDeclaration("patients", {
    description : "CRUD Ops for Patients and Ops to answer Questions",
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

var j = schedule.scheduleJob('*/30 * * * *', function() {
    var analyzer = require('./controller/notify.js');
    var notify = new analyzer();
    notify.emit('oneDayInactiveAnalyzes');
});

/**
 * Main
 */
if (ssl.useSsl) {
    swagger.configure("https://" + host + ":" + url_port, "0.1");

    var options = {
        key: fs.readFileSync(__dirname + ssl.privateKey),
        cert: fs.readFileSync(__dirname + ssl.certificate),
        password: ssl.password
    };

    var server = https.createServer(options, app);
    server.on('error', function (err){
        if (err.message.indexOf('EADDRINUSE')>1) console.error('Port in use. Server already running?');
        else console.error(err.stack);
        process.exit(1);
    });
    server.listen(app.get('port'), function () {
        console.log('ECHO REST API listening on host ' + host + ' on port ' + app.get('port'));
        console.log('Server uses SSL');
        console.log('Swagger Base: https://' + host + ':' + url_port + api_docs);
    });

    var redirectApp = express(),
        redirectServer = http.createServer(redirectApp);

    redirectApp.use(function requireHTTPS(req, res, next) {
        if (!req.secure) {
            return res.redirect('https://' + req.headers.host + req.url);
        }
        next();
    })

    redirectServer.listen(8080);

}
else {
    swagger.configure("http://" + host + ":" + url_port, "0.1");

    var server = http.createServer(app);
    server.on('error', function (err){
        if (err.message.indexOf('EADDRINUSE')>1) console.error('Port in use. Server already running?');
        else console.error(err.stack);
        process.exit(1);
    });
    server.listen(app.get('port'), function () {
        console.log('ECHO REST API listening on host ' + host + ' on port ' + app.get('port'));
        console.log('Swagger Base: http://' + host + ':' + url_port + api_docs);
    });
}

