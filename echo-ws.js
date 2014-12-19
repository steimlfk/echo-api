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

/**
 * Controller
 */
var patients =         	require('./controller/patients'),
accounts =             	require('./controller/accounts'),
catscale =             	require('./controller/cats'),
questions =            	require('./controller/questions'),
daily_answers =        	require('./controller/daily_reports'),
death =        			require('./controller/death'),
charlson =             	require('./controller/charlsons'),
readings =           	require('./controller/readings'),
treatments =           	require('./controller/treatments'),
notifications =         require('./controller/notifications'),
commands =        		require('./controller/commands'),
ccqweek =              	require('./controller/ccqs');

var utils =				require('./controller/utils');

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
app.use(bodyParser());					
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


app.use('/accounts',  		passport.authenticate(['bearer'], { session: false }));
app.use('/logout',    		passport.authenticate(['bearer'], { session: false }));
app.use('/patients',  		passport.authenticate(['bearer'], { session: false }));
app.use('/questions', 		passport.authenticate(['bearer'], { session: false }));
app.use('/notifications', 	passport.authenticate(['bearer'], { session: false }));
app.use('/createPatientAndAccount', passport.authenticate(['bearer'], { session: false }));
app.use('/changeDoctor',	 passport.authenticate(['bearer'], { session: false }));

app.use(utils.accessControl);

swagger.addPost({'spec': oauth2.loginSpec, 'action': oauth2.endpoint});

swagger.addModels(accounts);
swagger.addGet(		{'spec': accounts.listSpec,'action': accounts.list});
swagger.addPost(	{'spec': accounts.addSpec,'action': accounts.add});
swagger.addGet(		{'spec': accounts.listOneSpec,'action': accounts.listOne});
swagger.addPut(		{'spec': accounts.updateSpec,'action': accounts.update});
swagger.addDelete(	{'spec': accounts.delSpec,'action': accounts.del});


swagger.addModels(patients);
swagger.addGet(		{'spec': patients.listSpec,'action': patients.list});
swagger.addPost(	{'spec': patients.addSpec,'action': patients.add}); 
swagger.addGet(		{'spec': patients.listOneSpec,'action': patients.listOne});
swagger.addPut(		{'spec': patients.updateSpec,'action': patients.update});
swagger.addDelete(	{'spec': patients.delSpec,'action': patients.del});


swagger.addModels(catscale);
swagger.addGet(		{'spec': catscale.listSpec,'action': catscale.list});
swagger.addPost(	{'spec': catscale.addSpec,'action': catscale.add});
swagger.addGet(		{'spec': catscale.listOneSpec,'action': catscale.listOne});
swagger.addPut(		{'spec': catscale.updateSpec,'action': catscale.update});
swagger.addDelete(	{'spec': catscale.delSpec,'action': catscale.del});


swagger.addModels(ccqweek);
swagger.addGet(		{'spec': ccqweek.listSpec,'action': ccqweek.list});
swagger.addPost(	{'spec': ccqweek.addSpec,'action': ccqweek.add});
swagger.addGet(		{'spec': ccqweek.listOneSpec,'action': ccqweek.listOne});
swagger.addPut(		{'spec': ccqweek.updateSpec,'action': ccqweek.update});
swagger.addDelete(	{'spec': ccqweek.delSpec,'action': ccqweek.del});


swagger.addModels(charlson);
swagger.addGet(		{'spec': charlson.listSpec,'action': charlson.list});
swagger.addPost(	{'spec': charlson.addSpec,'action': charlson.add});
swagger.addGet(		{'spec': charlson.listOneSpec,'action': charlson.listOne});
swagger.addPut(		{'spec': charlson.updateSpec,'action': charlson.update});
swagger.addDelete(	{'spec': charlson.delSpec,'action': charlson.del});

swagger.addModels(daily_answers);
swagger.addGet(		{'spec': daily_answers.listSpec,'action': daily_answers.list});
swagger.addPost(	{'spec': daily_answers.addSpec,'action': daily_answers.add});
swagger.addGet(		{'spec': daily_answers.listOneSpec,'action': daily_answers.listOne});
swagger.addPut(		{'spec': daily_answers.updateSpec,'action': daily_answers.update});
swagger.addDelete(	{'spec': daily_answers.delSpec,'action': daily_answers.del});

swagger.addModels(death);
swagger.addGet(		{'spec': death.listSpec,'action': death.list});
swagger.addPost(	{'spec': death.addSpec,'action': death.add});
swagger.addPut(		{'spec': death.updateSpec,'action': death.update});
swagger.addDelete(	{'spec': death.delSpec,'action': death.del});

swagger.addModels(readings);
swagger.addGet(		{'spec': readings.listSpec,'action': readings.list});
swagger.addPost(	{'spec': readings.addSpec,'action': readings.add});
swagger.addGet(		{'spec': readings.listOneSpec,'action': readings.listOne});
swagger.addPut(		{'spec': readings.updateSpec,'action': readings.update});
swagger.addDelete(	{'spec': readings.delSpec,'action': readings.del});

swagger.addModels(treatments);
swagger.addGet(		{'spec': treatments.listSpec,'action': treatments.list});
swagger.addPost(	{'spec': treatments.addSpec,'action': treatments.add});
swagger.addGet(		{'spec': treatments.listOneSpec,'action': treatments.listOne});
swagger.addPut(		{'spec': treatments.updateSpec,'action': treatments.update});
swagger.addDelete(	{'spec': treatments.delSpec,'action': treatments.del});

swagger.addModels(questions);
swagger.addGet(		{'spec': questions.listSpec,'action': questions.list});
swagger.addPost(	{'spec': questions.addSpec,'action': questions.add});
swagger.addGet(		{'spec': questions.listCatscaleSpec,'action': questions.listCatscale});
swagger.addGet(		{'spec': questions.listCCQSpec,'action': questions.listCCQ});
swagger.addGet(		{'spec': questions.listCharlsonSpec,'action': questions.listCharlson});
swagger.addGet(		{'spec': questions.listDailySpec,'action': questions.listDaily});

swagger.addModels(notifications);
swagger.addGet(		{'spec': notifications.listSpec,'action': notifications.list});
swagger.addGet(		{'spec': notifications.addSpec,'action': notifications.add});

swagger.addModels(commands);
swagger.addPost({'spec': commands.createSpec, 'action': commands.createPatientAndAccount});
swagger.addPost({'spec': commands.changeSpec, 'action': commands.changeDoctor});

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
