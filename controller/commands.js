/**
 * Command Ressources
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;
var config = require('../config/config.js');
var async = require('async');
var bcrypt = require('bcryptjs');


exports.createPatientAndAccount = function(req,res,next) {
	// 1) Validate Role!
	if (req.user.role == 'patient'){
		res.statusCode = 403;
		res.send({error: 'Forbidden. Invalid Role.'});
	}
	else {
		// check if account and patient data was submitted
		if (req.body.account && req.body.patient) {
			// 2) Get DB Connection
			db.getConnection(function(err, connection) {
				if (err) {
					console.error('DB Connection error on POST new accounts: ',err);
					callback (err);
				} else {
					//3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
					//   Password is "calculated" by function defined in config.js - currently its a concatenation of a given prefix and user id 
					connection.changeUser({user : req.user.accountId, password : config.calculatePW(req.user.accountId)}, function(err) {
						if (err) {
							// an error occured while changing user
							console.error(err); res.statusCode = 500;
							res.send({err: 'Internal Server Error'}); 
						}
						// since its not possible to "really" delete a created account
						// it was necessary to write a new SP to create a patient and an account
						async.waterfall([
						                 function(cb){
						                	 // shorter vars
						                	 var i = req.body.account;
						                	 var j = req.body.patient;
						                	 // hash pw
						                	 var salt = bcrypt.genSaltSync(10);
						                	 var pwd = bcrypt.hashSync(i.password, salt);
						                	 // set doctorid if current role is doctor
						                	 var doc_id = i.doctorId;
						                	 if (req.user.role == 'doctor') doc_id = req.user.accountId;
						                	 // query db
						                	 connection.query('CALL patientsAndAccountCreate(?,?,? ,?,?,? ,?,?,? ,?, ?,?,?, ?,?,?, ?,?,?, ?,?)' , 
						                			 [ config.db_pw_prefix, i.username, pwd, 
						                			   i.email, i.role, i.enabled, 
						                			   i.reminderTime, i.notificationEnabled, i.notificationMode,
						                			   i.mobile, 
						                			   doc_id, j.firstName, j.lastName, 
						                			   j.secondName, j.socialId, j.sex, 
						                			   j.dateOfBirth, j.firstDiagnoseDate, j.fileId, 
						                			   j.fullAddress, j.landline], 
						                			   cb);
						                 },
						                 function(arg1, fields, ccb){
						                	 // grant rights if create was successfull
						                	 var i = req.body.account;
						                	 connection.query('CALL grantRolePermissions(?, ?)' , [parseInt(arg1[0][0].location), i.role], function (err, result){
						                		 if (err) ccb(err);
						                		 else ccb (null, arg1[0][0].location);
						                	 });
						                 }
						                 ],
						                 // optional callback
						                 function(err, re1){
							if (err) {
								console.error('Query error on create account and patient: ',err);
								// Error Handling for sql signal statements for the triggers
								// 22400 is equiv. to HTTP Error Code 400: Bad Request (has errors, should be altered and resend)
								if (err.code === 'ER_SIGNAL_EXCEPTION' && err.sqlState == '22400'){
									res.statusCode = 400;
									res.send({error: err.message});
								}
								// Error Handling for sql signal statements for the triggers
								// 22403 is equiv. to HTTP Error Code 403: Forbidden
								else if (err.code === 'ER_SIGNAL_EXCEPTION' && err.sqlState == '22403'){
									res.statusCode = 403;
									res.send({error: err.message});
								}
								// Error Handling: username, email, socialid and fileid have to be unique
								else if (err.code === 'ER_DUP_ENTRY' ) {
									res.statusCode = 400;
									res.send({error: err.message});
								}
								// Error Handling: Something else went wrong!
								else {
									console.error('Query error on create account and patient: ',err);
									res.statusCode = 500;
									res.send({error: 'Internal Server Error'});
								}
							} else {
								// resource was created
								// link will be provided in location header
								res.statusCode = 201;
								res.location('/patients/' + re1);
								res.send();
							}
							connection.release();
						}
						);
					});
				}
			});
		}
	}
}


exports.changeDoctor = function(req,res,next){
	// 1) Validate Role!
	if (req.user.role != 'admin'){
		res.statusCode = 403;
		res.send({error: 'Forbidden. Invalid Role.'});
	}
	else{
		// 2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on POST changeDoc: ',err);
				res.send(500);
			} else {
				//3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
				//   Password is "calculated" by function defined in config.js - currently its a concatenation of a given prefix and user id 
				connection.changeUser({user : req.user.accountId, password : config.calculatePW(req.user.accountId)}, function(err) {
					if (err) {
						// an error occured while changing user
						console.error(err); res.statusCode = 500;
						res.send({err: 'Internal Server Error'}); 
					}
					var pid = req.body.patientId;
					var did = req.body.newDoctorId;
					connection.query('call patientsChangeDoctor(?,?)',	[pid, did], function(err, result) {
						if (err) {
							// Error Handling for sql signal statements for the triggers
							// 22400 is equiv. to HTTP Error Code 400: Bad Request (has errors, should be altered and resend)
							if (err.code === 'ER_SIGNAL_EXCEPTION' && err.sqlState == '22400'){
								res.statusCode = 400;
								res.send({error: err.message});
							}
							// Error Handling for sql signal statements for the triggers
							// 22403 is equiv. to HTTP Error Code 403: Forbidden
							else if (err.code === 'ER_SIGNAL_EXCEPTION' && err.sqlState == '22403'){
								res.statusCode = 403;
								res.send({error: err.message});
							}
							// Error Handling: Something else went wrong!
							else {
								console.error('Query error on POST changeDoc: ',err);
								res.statusCode = 500;
								res.send({error: 'Internal Server Error'});
							}
						} else {
							// doctor was changed
							if (result[0][0].affected_rows > 0){
								res.statusCode = 204;
								res.send();
							}
							// patient wasnt found
							else {
								res.statusCode = 404;
								res.send();
							}
						}
						connection.release();
					});
				});
			}	
		});
	}
}



exports.createSpec = {
		summary : "Create Patient with Account (Roles: doctor)",
		notes: "Instead of calling POST /account and POST /patient in a row, you can use this function to create a patients' account. Uses new SP instead of combinig the existing two methods, since there is no possiblity to delete an account if this operation fails after account creation <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>201</b>  Account is created and the location is returned in the Location Header <br>" +
		" <b>400</b>  The provided data contains errors, e.g. Username or EMail are not unique or Invalid Value of NotificationMode or Role <br>" +
		" <b>403</b>  The logged in user isnt allowed to create an account with this data. Possibile Reason: A doctor is only allowed to create a new patient.<br>"+
		" <b>500</b> Internal Server Error",
		path : "/createPatientAndAccount",
		method: "POST",
		nickname : "addPatientWithAccount",
		parameters : [swagger.bodyParam("PatientAndAccount", "new Patient with new Account", "PatientAndAccount")]

}

exports.changeSpec = {
		summary : "Changes Doctor of Given Patient (Roles: admin)",
		notes: "Changes Doctor of Given Patient <br><br><b>Possible Results</b>: <br>" +
		" <b>200</b>  Doctor changed <br>" +
		" <b>400</b>  The provided data contains errors, e.g. given doctor isnt a doctor <br>" +
		" <b>500</b> Internal Server Error",
		path : "/changeDoctor",
		method: "POST",
		nickname : "changeDoc",
		parameters : [swagger.bodyParam("ChangeDoctor", "new Patient with new Account", "ChangeDoctor")]

}

exports.models = {
		"ExtraPatient":{
			"id": "Patient",
			"required":["dateOfBirth","firstDiagnoseDate", "firstName","lastName","sex","fileId", "mobile", "email", "fullAddress", "socialId"],
			"properties":{
				"lastName": {
					"type":"string",
					"description": "Patients Last Name"
				},
				"firstName": {
					"type":"string",
					"description": "Patient's first Name"
				},
				"secondName": {
					"type":"string",
					"description": "Patients second Name"
				},
				"dateOfBirth": {
					"type":"string",
					"format":"date",
					"description": "Date of Birth"
				},				
				"sex": {
					"type":"string",
					"enum": ["0","1"] ,
					"description": "Sex (1 is male)"
				},
				"firstDiagnoseDate": {
					"type":"string",
					"format":"date",
					"description": "Date of First Diagnoe"
				},
				"socialId": {
					"type":"string",
					"description": "Patients social ID"
				},
				"fileId": {
					"type":"string",
					"description": "Patient File Id"
				},
				"fullAddress": {
					"type":"string",
					"description": "Patients address"
				},
				"landline": {
					"type":"string",
					"description": "Patients phone number"
				}
			}
		},
		"PatientAndAccount":{
			"id" : "PatientAndAccount",
			"required": ["account", "patient"],
			"properties":{
				"account":{
					"$ref" : "NewAccount"
				},
				"patient":{
					"$ref" : "ExtraPatient"
				}
			}
		},
		"ChangeDoctor":{
			"id" : "ChangeDoctor",
			"required": ["patientId", "newDoctorId"],
			"properties":{
				"patientId":{
					"type":"integer"
				},
				"newDoctorId":{
					"type":"integer"
				}
			}
		}
}