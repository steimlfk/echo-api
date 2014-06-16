/**
 * Demo App: Questions
 */

var http = require("http");
var request = require("request");
var async = require("async");

var mHost = 'n00b';
var mPort = 3000;
var mPath = 'n00b';
var mSSL = false;
var httpMode = 'http';

exports.setup = function(host, port, path, ssl){

	mHost = host;
	mPort = port;
	mPath = path;
	mSSL = ssl;
	if (mSSL == true) httpMode = httpMode;
};

exports.index = function(req, res, next){
	var uri = httpMode+'://'+mHost+':'+mPort+'/questions';
	request.get(uri, {
		'auth' : {
			'bearer' : req.user.token
		},
		strictSSL : false
	}, function(err, resp, body){
		if (resp.statusCode == '401'){
			req.session.messages = ['Token Expired! Please login again and repeat.'];
			return res.redirect(mPath+'/login');
		}
		if (body){
			var questions = JSON.parse(body);
			res.render('questions/index', {questions: questions , username:req.user.username, role:req.user.role});
		}
		else res.render('questions/index', {username:req.user.username, role:req.user.role});
	});

};

exports.viewAdd = function(req, res, next){
	res.render('questions/edit', {role:req.user.role,username:req.user.username});

};

exports.saveNew = function(req, res, next){
	console.log(req.body);
	var question = req.body.question;
	question.answers = new Array();
	for (var i = 0; i < req.body.answertext.length; i++){
		question.answers[i] = new Object();
		question.answers[i].value = req.body.answervalue[i];
		question.answers[i].text = req.body.answertext[i];
	}
	var uri1 = httpMode+'://'+mHost+':'+mPort+'/questions/';
	var re1 = request.post(uri1, {
		'auth' : {
			'bearer' : req.user.token
		},
		'json' : question,
		strictSSL : false
	}, function(err, resp, body){
		if (resp.statusCode == '401'){
			req.session.messages = ['Token Expired! Please login again and repeat.'];
			return res.redirect(mPath+'/login');
		}
		res.redirect(mPath+'/questions')
	});
};