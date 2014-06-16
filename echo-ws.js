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
var patients =         require('./controller/patients'),
accounts =             require('./controller/accounts'),
catscale =             require('./controller/catscale'),
fagerstrom =           require('./controller/fagerstrom'),
cessation =            require('./controller/cessation'),
questions =            require('./controller/questions'),
daily_m =              require('./controller/daily_measurements'),
daily_answers =        require('./controller/daily_answers'),
charlson =             require('./controller/charlson'),
ccqweek =              require('./controller/ccq_week'),
dys =        	       require('./controller/dyn_scale');

/**
 * Config & Vars
 */
var app = express();
var oauth2 = require('./config/oauth2');
var api_docs = "/api-docs";
swagger.setAppHandler(app);
swagger.configureSwaggerPaths("", api_docs, "");
swagger.setHeaders = function setHeaders(res) {
	res.header("Content-Type", "application/json; charset=utf-8");
};
var mysql = require('./config/mysql');
var state = mysql.state;

var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');
var url_port = 80;
if (state == 'openstack') host = "echo.informatik.uni-stuttgart.de";
if (state == 'bluemix') host = "echo-rest-api.ng.bluemix.net";
if (state == 'dev') url_port = 3000;

app.set('port', port);									
app.set('views', __dirname + '/views');						//required for webdemo
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

app.get('/', function(req, res){res.redirect('/demoapp/login');});	//required for webdemo

app.use('/accounts',  passport.authenticate(['bearer'], { session: false }));
app.use('/logout',    passport.authenticate(['bearer'], { session: false }));
app.use('/patients',  passport.authenticate(['bearer'], { session: false }));
app.use('/questions', passport.authenticate(['bearer'], { session: false }));

swagger.addPost({'spec': oauth2.loginSpec, 'action': oauth2.endpoint});

app.use('/login', function(err,req,res,next){
	res.status(401);
	res.send();
});
swagger.addModels(accounts);
swagger.addGet(		{'spec': accounts.listSpec,'action': accounts.list});
swagger.addPost(	{'spec': accounts.addSpec,'action': accounts.add});
app.get('/accounts/doctors', accounts.listDoctors);
swagger.addGet(		{'spec': accounts.listOneSpec,'action': accounts.listOne});
swagger.addPut(		{'spec': accounts.updateSpec,'action': accounts.update});
swagger.addDelete(	{'spec': accounts.delSpec,'action': accounts.del});


swagger.addModels(patients);
swagger.addGet(		{'spec': patients.listSpec,'action': patients.list});
swagger.addPost(	{'spec': patients.addSpec,'action': patients.add}); 
swagger.addGet(		{'spec': patients.listOneSpec,'action': patients.listOne});
swagger.addPut(		{'spec': patients.updateSpec,'action': patients.update});
swagger.addDelete(	{'spec': patients.delSpec,'action': patients.del});


app.post(   '/patients/:id/daily-measurements',               function(req, res){    daily_m.add(req,res,db,fs) });
app.get(    '/patients/:id/daily-measurements',               function(req, res){    daily_m.list(req,res) });    
app.get(    '/patients/:id/daily-measurements/:mid',          function(req, res){    daily_m.getMetaData(req,res) });
app.get(    '/patients/:id/daily-measurements/:mid/data',     function(req, res){    daily_m.getFile(req,res) });    

swagger.addModels(catscale);
swagger.addGet(		{'spec': catscale.listSpec,'action': catscale.list});
swagger.addPost(	{'spec': catscale.addSpec,'action': catscale.add});

swagger.addModels(ccqweek);
swagger.addGet(		{'spec': ccqweek.listSpec,'action': ccqweek.list});
swagger.addPost(	{'spec': ccqweek.addSpec,'action': ccqweek.add});


swagger.addModels(charlson);
swagger.addGet(		{'spec': charlson.listSpec,'action': charlson.list});
swagger.addPost(	{'spec': charlson.addSpec,'action': charlson.add});

swagger.addModels(daily_answers);
swagger.addGet(		{'spec': daily_answers.listSpec,'action': daily_answers.list});
swagger.addPost(	{'spec': daily_answers.addSpec,'action': daily_answers.add});

////Doenst appear in API Doc
//swagger.addModels(dys);
//swagger.addGet(		{'spec': dys.listSpec,'action': dys.list});
//swagger.addPost(	{'spec': dys.addSpec,'action': dys.add});

// Doenst appear in API Doc
//swagger.addModels(fagerstrom);
//swagger.addGet(		{'spec': fagerstrom.listSpec,'action': fagerstrom.list});
//swagger.addPost(	{'spec': fagerstrom.addSpec,'action': fagerstrom.add});

//Doesnt appear in API Doc
//swagger.addModels(cessation);
//swagger.addGet(		{'spec': cessation.listSpec,'action': cessation.list});
//swagger.addPost(	{'spec': cessation.addSpec,'action': cessation.add});

swagger.addModels(questions);
swagger.addGet(		{'spec': questions.listSpec,'action': questions.list});
swagger.addPost(	{'spec': questions.addSpec,'action': questions.add});

/**
 * Demo Web-App
 */

app.use('/demoapp', require('./demoapp')(host, url_port, '/demoapp'));


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

swagger.configure("http://"+host+":"+url_port, "0.1");

/**
 * Main
 */
//HTTPS

//var options = {
//		  key: fs.readFileSync('../privatekey.pem'),
//		  cert: fs.readFileSync('../certificate.pem')
//		};
//
//https.createServer(options, app).listen(app.get('port'), function(){
//console.log('ECHO REST API listening on host ' +host + ' on port ' + app.get('port'));
//console.log('Server running in State: ' + state);
//console.log('Swagger Base: https://'+host+':'+url_port + api_docs);
//});



http.createServer(app).listen(app.get('port'), function(){
	console.log('ECHO REST API listening on host ' +host + ' on port ' + app.get('port'));
	console.log('Server running in State: ' + state);
	console.log('Swagger Base: http://'+host+':'+url_port + api_docs);
});
