/**
 * Controller: Patients
 * 
 * Contains Methods to GET and POST to /accounts (list and add)
 * And Methodes to GET, PUT and DELETE /accounts/id (listOne, update and del)
 * 
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;
var config = require('../config/config.js');
var ssl = require('../config/ssl.js').useSsl;

/*
 *  GET /patients
 *  
 *  Steps:
 *  	1) Role Check 
 *  	2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.list = function(req,res,next){
	// 1) Role Check 
	if (req.user.role == 'patient'){
		res.statusCode = 403;
		res.send({error: 'Forbidden. Invalid Role.'});
	}
	else{
		//2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on GET /patients: ',err);
				res.send(500);
			} else {
				//2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
				//   Password is "calculated" by function defined in config.js - currently its a concatenation of a given prefix and user id 
				connection.changeUser({user : req.user.accountId, password : config.calculatePW(req.user.accountId)}, function(err) {
					if (err) {
						// an error occured while changing user
						console.error(err); res.statusCode = 500;
						res.send({err: 'Internal Server Error'}); 
					}
					// 3) create SQL Query from parameters 
					// set base statement
					var qry = 'SELECT * FROM patients_view';
					// extending statement if req.query.sortBy (/accounts?sortBy=<sort>) contains a vaild value
					// if its not valid: set it to primary key
					var sort = 'patientId';
					var order = 'ASC';
					if (req.query.sortBy){
						switch (req.query.sortBy){
						case 'email': sort = 'email'; break;
						}
						qry += ' ORDER BY ' + sort + ' ';
						if (req.query.order){
							if (req.query.order.toLowerCase() == 'desc') order = 'DESC';
						}
						qry += order;
					}
					
					//extending statement if pagination is required (/accounts?page=<page>&pageSize=<pageSize>)
					// default value for page parameter - zero means no pagination
					var page = 0;
					// if no pageSize is given, use default which is 20 
					var pageSize = 20;
					// is page parameter present in url? if not ignore pageSize!
					if (req.query.page){
						// parsing given parameter to int to avoid sql injection
						page = parseInt(req.query.page);
						// if parsing failed assume pagination is wanted anyway - use 1
						if (isNaN(page)) page = 1;
						// pageSize given?
						if (req.query.pageSize){
							// parsing given parameter to int to avoid sql injection
							pageSize = parseInt(req.query.pageSize);
							// if parsing failed assume pagination is wanted anyway - use 20
							if (isNaN(pageSize)) pageSize = 20;
						}
						// calculate offset parameter for sql stmt
						var offset = (page*pageSize)-pageSize;
						// extend statement
						qry += ' LIMIT ' + pageSize + ' OFFSET ' + offset;

					}
					// execute query
					connection.query(qry, function(err, rows) {
						if (err) {
							console.error('Query error on GET /patients: ',err);
							res.statusCode = 500;
							res.send({error: 'Internal Server Error'}); 
						}
						// is there any result?
						if (rows.length > 0){
							var host = ((ssl)?'https://':'http://')+req.headers.host;
							var result = [];
							for (var i = 0; i < rows.length; i++){
								var o  = rows[i];
								o._links = {};
								// create self link
								o._links.self = {};
								o._links.self.href = host+'/patients/'+rows[i].patientId;
								result.push(o);
							}
							// add pagination links to result set if pagination was used
							if(req.query.page){
								var links = {};
								// create "first" link
								var first = host+'/patients?page=1&pageSize='+pageSize;
								// if sorting was used, add it to the link
								if (req.query.sortBy) {
									first += '&sortBy='+ sort;
									if (req.query.order) first += '&order='+ order;
								}
								links.first = first;
								// create "next" link if length of result set was pagesize
								if (rows.length == pageSize) {
									var next = host+'/patients?page='+(page+1)+'&pageSize='+pageSize;
									// if sorting was used, add it to the link
									if (req.query.sortBy) {
										next += '&sortBy='+ sort;
										if (req.query.order) next += '&order='+ order;
									}
									links.next = next
								}
								// create back link
								if (page != 1){
									var back = host+'/patients?page='+(page-1)+'&pageSize='+pageSize;
									// if sorting was used, add it to the link
									if (req.query.sortBy) {
										back += '&sortBy='+ sort;
										if (req.query.order) back += '&order='+ order;
									}
									links.back = back
								}
								// send result with pagination links
								res.send({'patients' : result, '_links' : links});
							}
							// send plain results
							else res.send({'patients' : result});
						}
						else{
							// there are no patients atm
							res.statusCode = 204;
							res.send();
						}
						connection.release();
					});
				});
			}
		});
	}
};

/*
 *  GET /patients/id
 *    Steps: 
 *    	1) Role Check
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.listOne = function(req,res,next){
	// 1) Role Check
	if (req.user.role == 'patient'){
		res.statusCode = 403;
		res.send({error: 'Forbidden. Invalid Role.'});
	}
	else{
		// 2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on GET single patient: ',err);
				res.send(500);
			} else {
				//2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
				//   Password is "calculated" by function defined in config.js - currently its a concatenation of a given prefix and user id 
				connection.changeUser({user : req.user.accountId, password : config.calculatePW(req.user.accountId)}, function(err) {
					if (err) {
						// an error occured while changing user
						console.error(err); res.statusCode = 500;
						res.send({err: 'Internal Server Error'}); 
					}
					// 3) create SQL Query from parameters 
					var qry =  'SELECT * FROM patients_view where patientId=?';
					// query db 
					// ? from query will be replaced by values in [] - including escaping!
					connection.query(qry, [req.params.id], function(err, rows, fields) {
						if (err) {
							console.error('Query error on GET single patient: ',err);
							res.statusCode = 500;
							res.send({error: 'Internal Server Error'}); 
						}
						// there was a matching patient
						if (rows.length > 0){
							var host = ((ssl)?'https://':'http://')+req.headers.host;
							var o  = rows[0];
							o._links = {};
							// add self link
							o._links.self = {};
							o._links.self.href = host+'/patients/'+rows[0].patientId;
							res.send(o);
						} 
						else{
							// no result
							res.statusCode = 404;
							res.send();
						}
						connection.release();
					});
				});
			}
		});
	}
};

/*
 *  POST /patients
 *  Steps: 
 *  	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.add = function(req,res,next){
	// 1) Validate Role!
	if (req.user.role == 'patient'){
		res.statusCode = 403;
		res.send({error: 'Forbidden. Invalid Role.'});
	}
	else{
		// 2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on POST new patient: ',err);
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
					// 4) create SQL Query from parameters 
					var i = req.body;
					// set doctor id to current user if current user is doctor
					var doc_id = i.doctorId;
					if (req.user.role == 'doctor') doc_id = req.user.accountId;
					connection.query('CALL patientsCreate(?,?,?,?,?,?,?,?,?,?,?,?)', [i.accountId, doc_id, i.firstName, i.lastName, i.secondName, i.socialId, i.sex, i.dateOfBirth, i.firstDiagnoseDate, i.fileId, i.fullAddress, i.landline], function(err, result) {
						if (err) {

							// Error Handling for duplicate values
							if (err.code === 'ER_DUP_ENTRY'){
								res.statusCode = 400;
								res.send({error: err.message});
							}
							// Error Handling for sql signal statements for the triggers
							// 22403 is equiv. to HTTP Error Code 403: Forbidden
							else if (err.code === 'ER_SIGNAL_EXCEPTION' && err.sqlState == '22403')
							{
								res.statusCode = 403;
								res.send({error: err.message});
							}
							// Error Handling for sql signal statements for the triggers
							// 22400 is equiv. to HTTP Error Code 400: Bad Request (has errors, should be altered and resend)
							else if (err.code === 'ER_SIGNAL_EXCEPTION' && err.sqlState == '22400')
							{
								res.statusCode = 400;
								res.send({error: err.message});
							}
							// Error Handling: Something else went wrong!
							else {
								console.error('Query error on POST patients: ',err);
								res.statusCode = 500;
								res.send({error: 'Internal Server Error'});
							}
						} else {
							// resource created
							res.statusCode = 201;
							res.location('/patients/' + i.accountId);
							res.send();
						}
						connection.release();
					});
				});
			}
		});
	}
};

/*
 *  DELETE /patients/id
 *  Steps: 
 *  	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create and execute SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.del =   function(req,res,next){
	// 1) Validate Role!
	if (req.user.role == 'patient'){
		res.statusCode = 403;
		res.send({error: 'Forbidden. Invalid Role.'});
	}
	else{
		// 2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on DELETE patient: ',err);
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
					// 4) create and execute SQL Query from parameters, 
					// ? from query will be replaced by values in [] - including escaping!
					connection.query('CALL patientsDelete(?)', req.params.id, function(err, result) {
						if (err){ 
							console.error('Query error on DELETE /patient: ',err);
							res.statusCode = 500;
							res.send({error: 'Internal Server Error'});  
						}
						else {
							// patient was deleted
							if (result[0][0].affected_rows > 0){
								res.statusCode = 204;
								res.send();
							}
							else {
								// patient was not deleted since it was not found
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
};

/*
 *  PUT /patients/id
 *  Steps:
 *  	1) Validate Role 
 *  	2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.update = function(req,res,next){
	// 1) Validate Role 
	if (req.user.role == 'patient'){
		res.statusCode = 403;
		res.send({error: 'Forbidden. Invalid Role.'});
	}
	else{
		// 2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on PUT patient: ',err);
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
					// 4) create SQL Query from parameters 
					var i = req.body;
					connection.query('Call patientsRessourceUpdate(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
							[req.params.id, i.doctorId, i.firstName, i.lastName, i.secondName, i.socialId, i.sex, i.dateOfBirth, 
							 i.firstDiagnoseDate, i.fileId, i.fullAddress, i.landline, i.email, i.mobile], function(err, result) {
						if (err) {
							// Error Handling for duplicate values
							if (err.code === 'ER_DUP_ENTRY'){
								res.statusCode = 400;
								res.send({error: err.message});
							}
							// Error Handling for sql signal statements for the triggers
							// 22403 is equiv. to HTTP Error Code 403: Forbidden
							else if (err.code === 'ER_SIGNAL_EXCEPTION' && err.sqlState == '22403')
							{
								res.statusCode = 403;
								res.send({error: err.message});
							}
							// Error Handling for sql signal statements for the triggers
							// 22400 is equiv. to HTTP Error Code 400: Bad Request (has errors, should be altered and resend)
							else if (err.code === 'ER_SIGNAL_EXCEPTION' && err.sqlState == '22400')
							{
								res.statusCode = 400;
								res.send({error: err.message});
							}
							// Error Handling: Something else went wrong!
							else {
								console.error('Query error on PUT patients: ',err);
								res.statusCode = 500;
								res.send({error: 'Internal Server Error'});
							}
						} else {
							// patient was updated
							if (result[0][0].affected_rows > 0){
								res.statusCode = 204;
								res.send();
							}
							// patient wasnt updated
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
};


exports.listSpec = {
		summary : "List All Patients (Roles: doctor and admin)",
		notes: "This Function lists all Patients which are visible to the logged in user and are enabled. <br>This function constructs a sql query from the parameters and executes it on patients_view. <br><br> <b>Parameters:</b> <br><br>  " +
		"<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " +
		"To support pagination the following links are supplied, if page is greater than zero:  <br>" +
		"_links: { <br>" +
		"self: (link to this collection) <br>" +
		"first: (link to first page of collection) <br>" +
		"next: (link to next page of the collection, if result size not equals pageSize) <br>" +
		"back: (link to previous page of the collection, if page is greater than 1) <br>" +
		"} <br> <br>" +
		"<b>Sorting</b>: If a valid column (patientId or email) is provided the result will be ordered after that column. If the role is not valid, the parameter is set to patientId.<br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>200</b>  List of Patients is supplied. Format accounts: [Array of Patient Model] <br>" +
		" <b>204</b>  List (or the current page) is currently empty <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients", 
		method: "GET",
		type : "Patient",
		nickname : "listPatients",
		parameters : [
		              swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
		              swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20"),
		              swagger.queryParam("sortBy", "Name of the Column to sort after", "string",false, ["patientId","email"]),
		              swagger.queryParam("order", "ASCending or DESCending", "string", false, ["asc","desc"])
		              ]

};
exports.listOneSpec = {
		summary : "Get specific Patient (Roles: doctor and admin)",
		notes: "This Function returns the requested Patient, if it exists and is visible to the current user. <br>This function constructs a sql query from the parameters and executes it on patients_view. <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>200</b>  Patient is supplied <br>" +
		" <b>404</b>  The requested account doesnt exist or the current user isnt allowed to view it. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}",
		method: "GET",
		type : "Patient",
		nickname : "listOnePatient",
		parameters : [swagger.pathParam("id", "ID of the patient which needs to be fetched", "string")]

};

exports.addSpec = {
		summary : "Create Patient (Roles: doctor and admin)",
		notes: "This Function creates an new Patient. <br>This function passes its parameters to the SP patientsCreate <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>201</b>  Patient is created and the location is returned in the Location Header <br>" +
		" <b>400</b>  The provided data contains errors, e.g. SocialID or FileID are not unique. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients",
		method: "POST",
		nickname : "addPatient",
		parameters : [swagger.bodyParam("Patient", "new Patient Record", "NewPatient")]

};

exports.delSpec = {
		summary : "Delete specific Patient (Roles: doctor and admin)",
		notes: "This Function deletes a Patients Record, which is specified by the url.  <br>This function passes its parameters to the SP patientsDelete <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>204</b>  Patient was deleted. <br>" +
		" <b>403</b>  Patient is either not visible to the current user or doesnt exist. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}",
		method: "DELETE",
		nickname : "delPatient",
		parameters : [swagger.pathParam("id", "Patient to delete", "string")]

};
exports.updateSpec = {
		summary : "Update specific Patient (Roles: doctor and admin)",
		notes: "This Function updates a Patients record, which is specified by the url. An accountId in the Message Body is ignored. <br>This function passes its parameters to the SP patientsUpdate <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>204</b>  Patient was updated. <br>" +
		" <b>400</b>  Patient cant be updated using the provided data since the provided data contains errors, e.g. SocialID or FileID are not unique. <br>" +
		" <b>403</b>  The current user isnt allowed to alter the specified patient. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}",
		method: "PUT",
		nickname : "updatePatient",    
		parameters : [swagger.pathParam("id", "Patient to update", "string"),swagger.bodyParam("Patient", "updated Patient Record", "Patient")]

};

exports.models = {
		"Patient":{
			"id": "Patient",
			"required":["dateOfBirth", "doctorId","accountId", "firstDiagnoseDate", "firstName","lastName","sex","fileId", "mobile", "email", "fullAddress", "socialId"],
			"properties":{
				"accountId": {
					"type":"integer",
					"format": "int32",
					"description": "Unique Identifier and ID of the corresponding Account"
				},
				"doctorId": {
					"type":"integer",
					"format" : "int32",
					"description": "Identifier of the Responsible Doctor"
				},
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
				"mobile": {
					"type":"string",
					"description": "Patients mobile no"
				},
				"email": {
					"type":"string",
					"description": "Patients email address"
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
		"NewPatient":{
			"id": "Patient",
			"required":["dateOfBirth","accountId", "doctorId","firstDiagnoseDate", "firstName","lastName","sex","fileId", "mobile", "email", "fullAddress", "socialId"],
			"properties":{
				"doctorId": {
					"type":"integer",
					"format" : "int32",
					"description": "Identifier of the Responsible Doctor"
				},
				"accountId": {
					"type":"integer",
					"format": "int32",
					"description": "Unique Identifier and ID of the corresponding Account"
				},
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
		}
};

