/**
 * Demo App: Adminstuff
 */
var request = require("request");
var express = require("express");

var mHost = 'n00b';
var mPort = 3000;
var mPath = 'n00b';
var mSSL = false;
var httpMode = 'http';

module.exports = function(host, port, path, ssl){
	var router = express.Router();

	mHost = host;
	mPort = port;
	mPath = path;
	mSSL = (ssl || false);
	if (mSSL == true) httpMode = httpMode; 

	var patients = require ('./patients.js');
	patients.setup(host,port,path, ssl);

	var accounts = require ('./accounts.js');
	accounts.setup(host,port,path, ssl);

	var questions = require ('./questions.js');
	questions.setup(host,port,path, ssl);

	router.get  ('/', function(req,res,next){res.redirect(mPath+'/login');});
	router.get	('/login', loginPage);
	router.post	('/login', login);
	router.get	('/logout', logout);
	router.use	('*', checkAuth);
	router.get	('/home', home);
	router.get	('/patients', patients.index);
	router.get	('/patients/add', patients.viewAdd);
	router.post	('/patients/add', patients.saveNew);
	router.get	('/patients/:id', patients.viewSingleOne);
	router.get	('/patients/:id/edit', patients.viewUpdate);
	router.post	('/patients/:id/update', patients.saveUpdate);
	router.get	('/patients/:id/delete', patients.del);
	router.get	('/accounts', accounts.index);
	router.get	('/accounts/add', accounts.viewAdd);
	router.post	('/accounts/add', accounts.saveNew);
	router.get	('/accounts/:id', accounts.viewSingleOne);
	router.get	('/accounts/:id/edit', accounts.viewUpdate);
	router.post	('/accounts/:id/update', accounts.saveUpdate);
	router.get	('/accounts/:id/delete', accounts.del);
	router.get	('/questions', questions.index);
	router.get	('/questions/add', questions.viewAdd);
	router.post	('/questions/add', questions.saveNew);

	return router;
}

var loginPage = function(req,res,next){	 
	if (req.isAuthenticated()) {res.redirect(mPath+'/home');}
	else{
		var msg;
		if (req.session) msg = req.session.messages;
		res.render('login',{message : msg, webpath:mPath}); 
	}
};

var login = function(req,res,next){
	request({
		uri: httpMode+"://"+mHost+":"+mPort+"/login",
		method: "POST",
		strictSSL : false,
		form: {
			username: req.body.username,
			password: req.body.password,
			grant_type: "password"
		}
	}, function(error, response, body) {
		if (response.statusCode == '401'){
			req.session.messages = ['Invalid Credentials'];
			return res.redirect(mPath+'/login');
		}
		var user = new Object();
		var tmp = JSON.parse(body);
		user.username = req.body.username;
		user.role = tmp.role;
		user.accountId = tmp.accountId;
		user.token = tmp.access_token;

		req.logIn(user, function(err) {
			if (err) { return next(err); }
			req.session.messages = [];
			return res.redirect(mPath+'/home');
		});
	});


}

var home = function(req, res, next){
	res.redirect(mPath + '/accounts/' + req.user.accountId);
}

var logout = function(req,res,next){	
	req.logout();
	res.redirect(mPath + '/login');
}

var checkAuth = function (req, res, next) {
	if (req.isAuthenticated()) {return next(); }
	console.error("... not authenticated");
	res.redirect(mPath+'/login');
};