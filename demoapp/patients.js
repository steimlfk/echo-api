/**
 * Demo App: Patients
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
	var uri = httpMode+'://'+mHost+':'+mPort+'/patients';
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
			
			var pats = JSON.parse(body)
			for (var i = 0; i < pats.patients.length; i++){
				pats.patients[i].dateOfBirth = pats.patients[i].dateOfBirth.split("T")[0];
			}
			res.render('patients/index', {patients: pats.patients, username:req.user.username, role:req.user.role, webpath:mPath});
		}
		else res.render('patients/index', {username:req.user.username, role:req.user.role, webpath:mPath});
	});

};

exports.viewUpdate = function(req, res, next){
	var uri = httpMode+'://'+mHost+':'+mPort+'/patients/' + req.params.id;
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
			var pat = JSON.parse(body); 
			pat.dateOfBirth = pat.dateOfBirth.split("T")[0];
			pat.firstDiagnose = pat.firstDiagnose.split("T")[0];
			res.render('patients/edit', {patient: pat, username:req.user.username, role:req.user.role, webpath:mPath});
		}
		else res.redirect(mPath+ '/patients');
	});
};


exports.viewAdd = function(req, res, next){
	var uri = httpMode+'://'+mHost+':'+mPort+'/accounts/doctors';
	if (req.user.role =='admin'){
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
				var docs = JSON.parse(body); 
				res.render('patients/edit', {doctors: docs,username:req.user.username, role:req.user.role, webpath:mPath});
			}
			else res.render('patients/edit', {doctors: [{'username' : 'No doctors registered!', 'doctorId' : -1}], role:req.user.role,username:req.user.username, webpath:mPath});
		});
	}
	else res.render('patients/edit', {role:req.user.role,username:req.user.username, webpath:mPath});

};

exports.saveNew = function(req, res, next){
	var b = req.body;
	
	var account = new Object();
	account.username = b.username;
	account.password = b.password;
	account.email = b.email;
	account.role = 'patient';
	
	var patient = new Object();
	patient.firstName = b.firstName;
	patient.lastName = b.lastName;
	patient.secondName = b.secondName;
	patient.height = b.height;
	patient.weight = b.weight
	patient.sex = b.sex;
	patient.dateOfBirth = b.dateOfBirth;
	patient.firstDiagnose = b.firstDiagnose;
	patient.fileNo = b.fileNo;
	patient.hospital = b.hospital;
	patient.smoker = b.smoker;
	patient.pxy = b.pxy;
	patient.notes = b.notes;
	patient.trial = b.trial;
	patient.optional = b.optional;
	
	var uri1 = httpMode+'://'+mHost+':'+mPort+'/accounts/';
	var uri2 = httpMode+'://'+mHost+':'+mPort+'/patients/';
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
		var loc = resp.headers.location;
		var locArr = loc.split("/");
		loc = locArr[locArr.length-1];
		patient.patientId = loc;
		request.post(uri2, {
			'auth' : {
				'bearer' : req.user.token
			},
			'json' : patient 
		}, function(err, resp1, body){
			if (resp1.statusCode == '401'){
				req.session.messages = ['Token Expired! Please login again and repeat.'];
				return res.redirect(mPath+'/login');
			}
			res.redirect(mPath+'/patients/'+loc);
		});
	});
};

exports.viewSingleOne  = function(req, res, next){
	var id = req.params.id;
	var token = req.user.token;

	arr = new Array();
	arr.push(httpMode+'://'+mHost+':'+mPort+'/patients/'+id )
	arr.push(httpMode+'://'+mHost+':'+mPort+'/patients/'+ id + '/catscale');
	arr.push(httpMode+'://'+mHost+':'+mPort+'/patients/'+ id + '/ccqweek');
	arr.push(httpMode+'://'+mHost+':'+mPort+'/patients/'+id + '/charlson');
	arr.push(httpMode+'://'+mHost+':'+mPort+'/patients/'+id + '/daily-answers');
	var it = function(item, callback){
		request.get(item, {
			'auth' : {
				'bearer' : req.user.token
			},
			strictSSL : false
		}, function(err, resp, body){
 			if (err) callback (err, null);
			else callback(null, body);
		});
	}

	async.map(arr, it, function(err, results){
		var patient 	= (results[0] != '')? JSON.parse(results[0]) : new Object();
		var  catscale 	= (results[1] != '')? JSON.parse(results[1]) : new Array();
		var  ccqweek 	= (results[2] != '')? JSON.parse(results[2]) : new Array();
		var charlson 	= (results[3] != '')? JSON.parse(results[3]) : new Array();
		var daily 		= (results[4] != '')? JSON.parse(results[4]) : new Array();
		if (patient.notes){
			patient.notes = patient.notes.replace(/\\r\\n/g, "<br />");
			patient.notes = patient.notes.replace(/\n/g, "<br />");
		}

		res.render('patients/details', {
			username : req.user.username,
			role : req.user.role,
			patient : patient,
			ccqweek : ccqweek,
			catscale : catscale,
			charlson : charlson,
			daily : daily,
			webpath:mPath
		})
	});
};

exports.saveUpdate = function(req, res, next){
	var uri1 = httpMode+'://'+mHost+':'+mPort+'/patients/' + req.params.id;
	var re1 = request.put(uri1, {
		'auth' : {
			'bearer' : req.user.token
		},
		'json' : req.body,
		strictSSL : false
	}, function(err, resp, body){
		if (resp.statusCode == '401'){
			req.session.messages = ['Token Expired! Please login again and repeat.'];
			return res.redirect(mPath+'/login');
		}
		res.redirect(mPath+ '/patients/' + req.params.id);
	});
};

exports.del = function(req, res, next){
	var uri1 = httpMode+'://'+mHost+':'+mPort+'/patients/' + req.params.id;
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
		res.redirect(mPath+ '/patients?page=1')
	});
};
