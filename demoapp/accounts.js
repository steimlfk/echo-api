/**
 * Demo App: Accounts
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
	if (mSSL == true) httpMode = httpMode+''; 

};


exports.index = function(req, res, next){
	var queryParams = '';
	var queryAvailable = false;
	if (req.query){
		if (req.query.page){
			queryParams += 'page=' + req.query.page + '&';
			queryAvailable = true;
		}
		if (req.query.pageSize){
			queryParams += 'pageSize=' + req.query.pageSize + '&';
			queryAvailable = true;
		}
		if (req.query.sortBy){
			queryParams += 'sortBy=' + req.query.sortBy + '&';
			queryAvailable = true;
			if (req.query.order){
				queryParams += 'order=' + req.query.order;
				queryAvailable = true;
			}
		}

	}
	var uri = httpMode+'://'+mHost+':'+mPort+'/accounts';
	if (queryAvailable) uri += '?'+ queryParams;
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
			var acc = JSON.parse(body);
			res.render('accounts/index', {accounts: acc.accounts , username:req.user.username, role:req.user.role});
		}
		else res.render('accounts/index', {username:req.user.username, role:req.user.role});
	});

};

exports.viewUpdate = function(req, res, next){
	var uri = httpMode+'://'+mHost+':'+mPort+'/accounts/' + req.params.id;
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
			var acc = JSON.parse(body); 
			res.render('accounts/edit', {account: acc, username:req.user.username, role:req.user.role});
		}
		else res.redirect(mPath + '/accounts');
	});
};

exports.viewAdd = function(req, res, next){
	res.render('accounts/edit', {role:req.user.role,username:req.user.username});

};

exports.saveNew = function(req, res, next){
	var account = new Object();
	account.username = req.body.username;
	account.password = req.body.password;
	account.email = req.body.email;
	account.role = req.body.role;
	var uri1 = httpMode+'://'+mHost+':'+mPort+'/accounts/';
	var re1 = request.post(uri1, {
		'auth' : {
			'bearer' : req.user.token
		},
		'json' : account,
		strictSSL : false
	}, function(err, resp, body){
		if (resp.statusCode == '401'){
			req.session.messages = ['Token Expired! Please login again and repeat.'];
			return res.redirect(mPath+'/login');
		}
		res.redirect(mPath+resp.headers.location)
	});
};

exports.saveUpdate = function(req, res, next){
	var account = new Object();
	account.username = req.body.username;
	account.password = req.body.password;
	account.email = req.body.email;
	account.role = req.body.role;
	if (req.body.password != '') account.password = req.body.password;
	var uri1 = httpMode+'://'+mHost+':'+mPort+'/accounts/' + req.params.id;
	var re1 = request.put(uri1, {
		'auth' : {
			'bearer' : req.user.token
		},
		'json' : account,
		strictSSL : false
	}, function(err, resp, body){
		if (resp.statusCode == '401'){
			req.session.messages = ['Token Expired! Please login again and repeat.'];
			return res.redirect(mPath+'/login');
		}
		res.redirect(mPath+ '/accounts/' + req.params.id)
	});
};

exports.del = function(req, res, next){
	var uri1 = httpMode+'://'+mHost+':'+mPort+'/accounts/' + req.params.id;
	var re1 = request.del(uri1, {
		'auth' : {
			'bearer' : req.user.token
		},
		strictSSL : false
	}, function(err, resp, body){
		if (resp.statusCode == '401'){
			req.session.messages = ['Token Expired! Please login again and repeat.'];
			return res.redirect(mPath+'/login');
		}
		res.redirect(mPath+ '/accounts?page=1')
	});
};


exports.viewSingleOne = function(req, res, next){
	var uri = httpMode+'://'+mHost+':'+mPort+'/accounts/' + req.params.id;
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
			var acc = JSON.parse(body); 
			res.render('accounts/details', {account: acc, username:req.user.username, role:req.user.role});
		}
		else res.redirect(mPath+ '/accounts?page=1');
	});
};

