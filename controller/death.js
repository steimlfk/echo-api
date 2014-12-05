/**
 * Controller: Death Reports
 * 
 * Contains Methods to GET, POST, PUT and DELETE to /patients/id/death 
 * 
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;
var config = require('../config/config.js');
var ssl = require('../config/ssl.js').useSsl;

/*
 *  GET /patients/id/death
 *    Steps: 
 *    	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.list = function(req, res, next){
	// 1) Validate Role!
	if (req.user.role != 'doctor'){
		res.statusCode = 403;
		res.send({error: 'Forbidden. Invalid Role.'});
	}
	else{
		// 2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on GET '+exam+' list: ',err);
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
					// query
					var qry = 'call deathGet(?)';
					connection.query(qry, [req.params.id], function(err, rows) {
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
								console.error('Query error on GET death : ',err);
								res.statusCode = 500;
								res.send({error: 'Internal Server Error'});
							}
						}
						else {
							// row found
							if (rows[0].length > 0){
								var host = ((ssl)?'https://':'http://')+req.headers.host;
								var result = [];
								var o  = rows[0][0];
								o._links = {};
								// add self link
								o._links.self = {};
								o._links.self.href = host+'/patients/'+req.params.id+'/death';
								// add patients link
								o._links.patient = {};
								o._links.patient.href = host+'/patients/'+req.params.id;
								result.push(o);
								res.send(result);
							}
							// row doesnt exist
							else{
								res.statusCode = 204;
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
 *  DELETE /patients/id/death
 *    Steps: 
 *      1) Validate Role
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.del = function(req, res, next, exam){
	//1) Validate Role
	if (req.user.role != 'doctor'){
		res.statusCode = 403;
		res.send({error: 'Forbidden. Invalid Role.'});
	}
	
	else{
		//2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on DEL death record: ',err);
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
					// query
					var i = req.body;
					var id = parseInt(req.params.id);
					connection.query('call deathDelete(?)', [id], function(err, result) {
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
								console.error('Query error on DEL '+exam+': ',err);
								res.statusCode = 500;
								res.send({error: 'Internal Server Error'});
							}

						} else {
							// death event deleted
							if (result[0][0].affected_rows > 0){
								res.statusCode = 204;
								res.send();
							}
							// death event not found
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
/*
 *  PUT /patients/id/death
 *  Steps: 
 *  	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.update = function(req,res,next){
	//1) Validate Role!
	if (req.user.role != 'doctor'){
		res.statusCode = 403;
		res.send({error: 'Forbidden. Invalid Role.'});
	}
	else{
		// 2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on PUT /report record: ',err);
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
					// query
					var i = req.body;
					var id = parseInt(req.params.id);
					// set date to null if date not set, so db can set it
					var date = (i.diagnoseDate || i.diagnoseDate != "")? i.diagnoseDate : null;
					connection.query('call deathUpdate(?,?,?, ?,?,?,?)', 
							[id, date,i.cardiovascular,i.respiratory,i.infectious_disease,i.malignancy,i.other], function(err, result) {
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
								console.error('Query error on PUT death: ',err);
								res.statusCode = 500;
								res.send({error: 'Internal Server Error'});
							}
						} else {
							// record updated
							if (result[0][0].affected_rows > 0){
								res.statusCode = 204;
								res.send();
							}
							// record not found
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
/*
 *  POST /patients/id/death
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
	if (req.user.role != 'doctor'){
		res.statusCode = 403;
		res.send({error: 'Forbidden. Invalid Role.'});
	}
	else{
		//2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on POST /cats record: ',err);
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
					// query
					var i = req.body;
					var id = parseInt(req.params.id);
					// set date to null if date not set, so db can set it
					var date = (i.diagnoseDate || i.diagnoseDate != "")? i.diagnoseDate : null;
					connection.query('call deathCreate(?,?,?, ?,?,?,?)', 
							[id, date, i.cardiovascular,i.respiratory,i.infectious_disease,i.malignancy,i.other], function(err, result) {
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
								console.error('Query error on del death: ',err);
								res.statusCode = 500;
								res.send({error: 'Internal Server Error'});
							}
							
						} else {
							// resource creted 
							res.statusCode = 201;
							res.location('/patients/'+ id + '/death');
							res.send();
						}
						connection.release();
					});
				});
			}	
		});
	}
};
exports.listSpec = {
		summary : "Get Death Record of this Patient (Roles: doctor)",
		notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP deathGet. <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>200</b>  Record is supplied <br>" +
		" <b>403</b>  The current user isnt allowed to access the data of the given patient <br>" +
		" <b>404</b>  The requested record doesnt exist. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/death",
		method: "GET",
		type : "Death",
		nickname : "listDeath",
		parameters : [swagger.pathParam("id", "Patient where the records belong to", "string")]

};


exports.addSpec = {
		summary : "Add  Death Records (Roles: doctor)",
		notes: "This Function creates an new Death Record. (if the Body contains patientId, its ignored) <br>This function passes its parameters to the SP deathCreate. <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>201</b>  Record is created and the location is returned in the Location Header <br>" +
		" <b>400</b>  The provided data contains errors, maybe the record already exists? <br>" +
		" <b>403</b>  The logged in user isnt allowed to create a record with this data.<br>"+
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/death",
		method: "POST",
		nickname : "addDeath",
		parameters : [swagger.bodyParam("Death", "new Record", "Death"), 
		              swagger.pathParam("id", "Patient where the records belong to", "string")]

};

exports.delSpec = {
		summary : "Delete Death Record of this Patient (Roles: doctor)",
		notes: "This Function deletes the death record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP deathDelete <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>204</b>  Record was deleted. <br>" +
		" <b>404</b>  Record is either not visible to the current user or doesnt exist. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/death",
		method: "DELETE",
		nickname : "delDeath",
		parameters : [swagger.pathParam("id", "ID of the Patient", "string")]

};

exports.updateSpec = {
		summary : "Update specific Treatment Record of this Patient (Roles: doctor)",
		notes: "This Function updates the death record, which is specified by the url. Any IDs in the Message Body are ignored. Instead the ids in the url are used. <br>This function passes its parameters to the SP deathUpdate. <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>204</b>  Record was updated. <br>" +
		" <b>400</b>  The provided data contains errors, e.g. a invalid value for status <br>" +
		" <b>404</b>  Record is either not visible to the current user or doesnt exist. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/death/",
		method: "PUT",
		nickname : "updateDeath",
		parameters : [swagger.pathParam("id", "ID of the Patient", "string"), 
		              swagger.bodyParam("Death", "updated Treatment Record", "Death")]
};


exports.models = {
		"Death":{
			"id":"Death",
			"required": ["date","cardiovascular","respiratory","infectious_disease","malignancy","other"],
			"properties":{
				"patientId": {"type":"integer", "format": "int32", "description": "patientId"},
				"date":{"type":"string","format": "Date", "description": "Date of Diagnose"},
				"cardiovascular":{"type":"boolean","description": "cardiovascular"},
				"respiratory":{"type":"boolean","description": "respiratory"},
				"infectious_disease":{"type":"boolean","description": "infectious_disease"},
				"malignancy":{"type":"boolean","description": "malignancy"},
				"other":{"type":"string","description" : "other cause"}
			}
		}
};


