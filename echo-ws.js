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
swagger = require("swagger-node-express"),
session = require('cookie-session'),
fs = require('fs');

var utils =				require('./controller/controller_utils');

/**
 * Config & Vars
 */
var app = express();
var oauth2 = require('./config/oauth2'),
	config = require('./config/config.js'),
	ssl = require('./config/ssl.js');
var api_docs = "/api-docs";
swagger.setAppHandler(app);
swagger.configureSwaggerPaths("", api_docs, "");
swagger.setHeaders = function setHeaders(res) {
	res.header("Content-Type", "application/json; charset=utf-8");
};
var mysql = require('./config/mysql');
var state = mysql.state;

var port = config.port;
var host = config.host;
var url_port = config.url_port;


app.set('port', port);									
app.set('views', __dirname + '/demoapp/views');				//required for webdemo
app.set('view engine', 'jade');								//required for webdemo
app.use(session({ secret: 'echo_secret' }));				//required for webdemo
app.use(passport.initialize());	
app.use(passport.session());								//required for webdemo
app.use(serveStatic(path.join(__dirname, 'public')));		//required for webdemo

var auth = require('./config/auth');

/**
 * REST API
 */
var webdemo_path = '/demoapp';
//app.get('/', function(req, res){res.redirect(webdemo_path+'/login');});	//required for webdemo
app.get('/', function(req, res){res.redirect('/docs');});

//setup login-Endpoint
app.use('/login', bodyParser.json());
swagger.addPost({'spec':oauth2.loginSpec,'action':oauth2.endpoint})

//setup protected ECHO Endpoints
var echo_endpoints = ['/accounts', '/patients', '/questions','/notifications','/createPatientAndAccount','/changeDoctor', '/devices'];
var echo_middlewares = [bodyParser.json(), passport.authenticate(['bearer'], { session: false }), utils.accessControl, utils.databaseHandler];

for (var i = 0; i< echo_endpoints.length; i++){
        app.use(echo_endpoints[i], echo_middlewares);
};


var models = {CollectionLinks : {
    id : "CollectionLinks",
    required : ["self", "first"],
    properties: {
        self : {"type":"string", "description": "Link to this Collection"},
        first : {"type":"string", "description": "Link to first Page of this Collection"},
        next : {"type":"string", "description": "Link to next Page of this Collection"},
        back : {"type":"string", "description": "Link to previous Page of this Collection"}
    }
}};
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

app.use(utils.errorHandler);

/**
 * Demo Web-App
 */

app.use(webdemo_path, require('./demoapp')(host, url_port, webdemo_path, ssl));

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


/**
 * Main
 */

if (ssl.useSsl){
	swagger.configure("https://"+host+":"+url_port, "0.1");

	var options = {
			key: fs.readFileSync(__dirname + ssl.privateKey),
			cert: fs.readFileSync(__dirname + ssl.certificate),
			password: ssl.password
	};

	https.createServer(options, app).listen(app.get('port'), function(){
		console.log('ECHO REST API listening on host ' +host + ' on port ' + app.get('port'));
		console.log('Server running in State: ' + state);
		console.log('Server uses SSL');
		console.log('Swagger Base: https://'+host+':'+url_port + api_docs);
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
	swagger.configure("http://"+host+":"+url_port, "0.1");

	http.createServer(app).listen(app.get('port'), function(){
		console.log('ECHO REST API listening on host ' +host + ' on port ' + app.get('port'));
		console.log('Server running in State: ' + state);
		console.log('Swagger Base: http://'+host+':'+url_port + api_docs);
	});
}

