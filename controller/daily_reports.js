/**
 * Controller: Daily Reports
 * 
 * Contains Methods to GET and POST to /patients/id/daily_reports (list and add)
 * And Methodes to GET, PUT and DELETE  /patients/id/daily_reports/recordid (listOne, update and del)
 * 
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;
var config = require('../config/config.js');


/**
 *  GET /patients/id/daily_reports
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
	if (req.user.role == 'admin'){
		res.statusCode = 403;
		res.send({error: 'Forbidden'});
	}
	else{
	var exam = 'daily_reports';
	// 2) Get DB Connection
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on GET daily report list: ',err);
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
				var qry = 'call reportList(?, ?, ?)';
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

				}
				// query db 
				// ? from query will be replaced by values in [] - including escaping!
				connection.query(qry, [req.params.id, page, pageSize], function(err, rows) {
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
							console.error('Query error on GET '+exam+' list: ',err);
							res.statusCode = 500;
							res.send({error: 'Internal Server Error'});
						}
					}
					else {
						// is there any result?
						
						if (rows[0].length > 0){
							var host = 'http://'+req.headers.host;
							var result = new Array();
							for (var i = 0; i < rows[0].length; i++){
								var o  = rows[0][i];
								// add "self" to all resources
								o._links = new Object();
								o._links.self = new Object();
								o._links.self.href = host+'/patients/'+req.params.id+'/'+exam+'/'+rows[0][i].recordId;
								// create corresponding patients link
								o._links.patient = new Object();
								o._links.patient.href = host+'/patients/'+req.params.id;
								result.push(o);
							}
							var links;
							// add pagination links to result set if pagination was used
							if(page != 0){
								links = new Object();
								// create "first" link
								var first = host+'/patients/'+req.params.id+'/'+exam+'?page=1&pageSize='+pageSize;
								links.first = first;
								// create "next" link if pageSize equals result size
								if (rows[0].length == pageSize) {
									var next = host+'/patients/'+req.params.id+'/'+exam+'?page='+(page+1)+'&pageSize='+pageSize;
									links.next = next
								}
								// create back link if page was not the first
								if (page != 1){
									var back = host+'/patients/'+req.params.id+'/'+exam+'?page='+(page-1)+'&pageSize='+pageSize;
									links.back = back
								}
							}
							// send complete result set with pagination links
							var ret = new Object();
							ret[exam] = result;
							if(page != 0) ret._links = links;
							res.send(ret);
						}
						else{
							// result set from db was empty
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
}

/**
 *  GET /patients/id/daily_reports/recordid
 *    Steps: 
 *      1) Validate Role
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.listOne = function(req,res,next){
	// 1) Validate Role
	if (req.user.role == 'admin'){
		res.statusCode = 403;
		res.send({error: 'Forbidden'});
	}
	else{
	var exam = 'daily_reports';
	//2) Get DB Connection
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on GET single daily report: ',err);
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
				
				var id = req.params.id;
				var rid = req.params.rid;
				var qry = 'call reportListOne(?,?)';
				// query db 
				// ? from query will be replaced by values in [] - including escaping!
				connection.query(qry,[id,rid], function(err, rows) {
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
						else{
							console.error('Query error on GET '+exam+': ',err);
							res.statusCode = 500;
							res.send({error: 'Internal Server Error'});
						}
					}
					else {
						// is there any result?
						if (rows[0].length > 0){
							var host = 'http://'+req.headers.host;
							var result = new Array();
							for (var i = 0; i < rows[0].length; i++){
								var o  = rows[0][i];
								o._links = new Object();
								// create self link
								o._links.self = new Object();
								o._links.self.href = host+'/patients/'+req.params.id+'/'+exam+'/'+rows[0][i].recordId;
								// create corresponding patients link
								o._links.patient = new Object();
								o._links.patient.href = host+'/patients/'+req.params.id;
								result.push(o);
							}
							res.send(result);

						}
						// there was no result from db
						else{
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

/**
 *  DELETE /patients/id/daily_reports/recordid
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
	if (req.user.role == 'admin'){
		res.statusCode = 403;
		res.send({error: 'Forbidden'});
	}
	else{
	var exam = 'daily_reports';
	//2) Get DB Connection
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on DEL daily report: ',err);
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
				var i = req.body;
				var id = parseInt(req.params.id);
				var rid = parseInt(req.params.rid);
				// query db 
				// ? from query will be replaced by values in [] - including escaping!
				connection.query('call reportDelete(?, ?)', [id, rid], function(err, result) {
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
						else{
							console.error('Query error on DEL '+exam+': ',err);
							res.statusCode = 500;
							res.send({error: 'Internal Server Error'});
						}
					} else {
						// record was deleted
						if (result[0][0].affected_rows > 0){
							res.statusCode = 204;
							res.send();
						}
						// record wasnt deleted
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
/**
 *  PUT /patients/id/daily_reports/recordid
 *  Steps: 
 *  	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.update = function(req,res,next){
	// 1) Validate Role!
	if (req.user.role == 'admin'){
		res.statusCode = 403;
		res.send({error: 'Forbidden'});
	}
	
	else{
		// 2) Get DB Connection
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on PUT /report record: ',err);
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
				var i = req.body;
				// convert ids
				var id = parseInt(req.params.id);
				var rid = parseInt(req.params.rid);
				// set date to null if not set
				var date = (i.date || i.date != "")? i.date : null;//TODO: (!A || B)
				// query db
				connection.query('call reportUpdate(?,?,?, ?,?,?,?,?, ?,?,?,?,?,?, ?,?,?,?,?)', 
						[rid, id, date, 
								i.q1, i.q2, i.q3, i.q4, i.q5, i.q1a, i.q1b, i.q1c,i.q3a, i.q3b, i.q3c, i.satO2, 
								i.walkingDist, i.temperature, i.pefr, i.heartRate], function(err, result) {
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
							console.error('Query error on PUT report: ',err);
							res.statusCode = 500;
							res.send({error: 'Internal Server Error'});
						}
					} else {
						// record  was updated
						if (result[0][0].affected_rows > 0){
							res.statusCode = 204;
							res.send();
						}
						// record was not found
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
/**
 *  POST /patients/id/daily_reports
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
	if (req.user.role == 'admin'){
		res.statusCode = 403;
		res.send({error: 'Forbidden'});
	}
	else{
		//2) Get DB Connection
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on POST /daily_reports record: ',err);
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
				
				var i = req.body;
				var id = parseInt(req.params.id);
				// set date to null if not set
				var date = (i.date || i.date != "")? i.date : null; //TODO: (!A || B)
				// query db
				connection.query('call reportCreate(?,?, ?,?,?,?,?, ?,?,?, ?,?,?, ?,?,?,?,?)', 
						[id, date, 
								i.q1, i.q2, i.q3, i.q4, i.q5, i.q1a, i.q1b, i.q1c, i.q3a, i.q3b, i.q3c, i.satO2, 
								i.walkingDist, i.temperature, i.pefr, i.heartRate], function(err, result) {
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
							console.error('Query error on POST report: ',err);
							res.statusCode = 500;
							res.send({error: 'Internal Server Error'});
						}

					} else {
						// new ressource created
						res.statusCode = 201;
						res.location('/patients/'+ id + '/daily_reports/' + result[0][0].insertId);
						res.send();
					}
					connection.release();
				});
			});
		}	
	});
	}
}

exports.listSpec = {
		summary : "Get All Daily Reports By this Patient (Roles: doctor and patient)",
		notes: "This Function lists all Daily Reports for the given patient. <br>This function passes the parameters to the SP reportList. <br><br> <b>Parameters:</b> <br><br>  " +
		"<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " +
		"To support pagination the following links are supplied, if page is greater than zero:  <br>" +
		"_links: { <br>" +
		"self: (link to this collection) <br>" +
		"first: (link to first page of collection) <br>" +
		"next: (link to next page of the collection, if result size not equals pageSize) <br>" +
		"back: (link to previous page of the collection, if page is greater than 1) <br>" +
		"} <br> <br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>200</b>  List of Daily Reports is supplied. Format cats: [Array of daily_report Model] <br>" +
		" <b>204</b>  List (or the current page) is currently empty <br>" +
		" <b>403</b>  The current user isnt allowed to access the data of the given patient <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/daily_reports",
		method: "GET",
		type : "DailyReport",
		nickname : "listReport",
		parameters : [swagger.pathParam("id", "Patient who answered the Questions", "string"),
		              swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
		              swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")],

}


exports.addSpec = {
		summary : "Add new Daily Reports (Roles: doctor and patient)",
		notes: "This Function creates an new Daily Report. If the Body contains patientId, its ignored and the id from the url is taken. Also it will set the date if date is null. <br>This function passes its parameters to the SP reportCreate. <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>201</b>  Record is created and the location is returned in the Location Header <br>" +
		" <b>400</b>  The provided data contains errors. <br>" +
		" <b>403</b>  The logged in user isnt allowed to create a record with this data.<br>"+
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/daily_reports",
		method: "POST",
		nickname : "addReport",
		parameters : [swagger.bodyParam("NewDailyReport", "new Set of Daily Answers", "NewDailyReport"), swagger.pathParam("id", "Patient who answered the Questions", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}

exports.listOneSpec = {
		summary : "Get specific Daily Report Record of this Patient (Roles: doctor and patient)",
		path : "/patients/{id}/daily_reports/{rid}",
		notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP reportListOne. <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>200</b>  Record is supplied <br>" +
		" <b>403</b>  The current user isnt allowed to access the data of the given patient <br>" +
		" <b>404</b>  The requested record doesnt exist. <br>" +
		" <b>500</b> Internal Server Error",
		method: "GET",
		type : "DailyReport",
		nickname : "listOneReport",
		parameters : [swagger.pathParam("id", "ID of the Patient", "string"), 
		              swagger.pathParam("rid", "ID of the Record", "string")],
		responseMessages : [swagger.errors.notFound('rid')]

}


exports.delSpec = {
		summary : "Delete specific Daily Report Record of this Patient (Roles: doctor and patient)",
		notes: "This Function deletes a record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP reportDelete <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>204</b>  Record was deleted. <br>" +
		" <b>404</b>  Record is either not visible to the current user or doesnt exist. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/daily_reports/{rid}",
		method: "DELETE",
		nickname : "delReport",
		parameters : [swagger.pathParam("id", "ID of the Patient", "string"), 
		              swagger.pathParam("rid", "ID of the Record", "string")],
		responseMessages : [swagger.errors.notFound('rid')]

}

exports.updateSpec = {
		summary : "Update specific Daily Report Record of this Patient (Roles: doctor and patient)",		
		notes: "This Function updates a Daily Report, which is specified by the url. Any ids in the Message Body are ignored. <br>This function passes its parameters to the SP reportUpdate. <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>204</b>  Record was updated. <br>" +
		" <b>400</b>  The provided data contains errors, e.g. a invalid value for status <br>" +
		" <b>404</b>  Record is either not visible to the current user or doesnt exist. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/daily_reports/{rid}",
		method: "PUT",
		nickname : "updateReport",
		parameters : [swagger.pathParam("id", "ID of the Patient", "string"), 
		              swagger.pathParam("rid", "ID of the Record", "string") ,
		              swagger.bodyParam("DailyReport", "updated Readings Record", "DailyReport")],
		responseMessages : [swagger.errors.notFound('rid')]
};

exports.models = {
		"DailyReport":{
			"id" : "DailyReport",
			"required": ["patientId", "recordId", "date", "q1","q2","q3","q4","q5","q1a","q1b","q1c","q3a","q3b","q3c","satO2", "walkingDist", "temperature", "pefr", "heartRate"],
			"properties":{
				"patientId": {"type":"integer", "format": "int32", "description": "patientId"},
				"recordId":{"type":"integer","format": "int32","description": "Unique Identifier of this Record"},
				"date":{"type":"string","format": "Date", "description": "Date of Report"},
				"q1" :{"type":"boolean","description": " Answer to q1 "},
				"q2" :{"type":"boolean","description": " Answer to q2 "},
				"q3" :{"type":"boolean","description": " Answer to q3 "},
				"q4" :{"type":"boolean","description": " Answer to q4 "},
				"q5" :{"type":"boolean","description": " Answer to q5 "},
				"q1a" :{"type":"boolean","description": " Answer to q1a "},
				"q1b" :{"type":"boolean","description": " Answer to q1b "},
				"q1c" :{"type":"boolean","description": " Answer to q1c "},
				"q3a" :{"type":"boolean","description": " Answer to q3a "},
				"q3b" :{"type":"boolean","description": " Answer to q3b "},
				"q3c" :{"type":"boolean","description": " Answer to q3c "},
				"satO2": {"type":"number", "format": "float", "description": "satO2"},
				"walkingDist": {"type":"number", "format": "float", "description": "walkingDist"},
				"temperature": {"type":"number", "format": "float", "description": "temperature"},
				"pefr": {"type":"number", "format": "float", "description": "pefr"},
				"heartRate": {"type":"number", "format": "float", "description": "heartRate"}
			}
		},
		"NewDailyReport":{
			"id" : "DailyReport",
			"required": ["date", "q1","q2","q3","q4","q5","q1a","q1b","q1c","q3a","q3b","q3c","satO2", "walkingDist", "temperature", "pefr", "heartRate"],
			"properties":{
				"date":{"type":"string","format": "Date", "description": "Date of Report"},
				"q1" :{"type":"boolean","description": " Answer to q1 "},
				"q2" :{"type":"boolean","description": " Answer to q2 "},
				"q3" :{"type":"boolean","description": " Answer to q3 "},
				"q4" :{"type":"boolean","description": " Answer to q4 "},
				"q5" :{"type":"boolean","description": " Answer to q5 "},
				"q1a" :{"type":"boolean","description": " Answer to q1a "},
				"q1b" :{"type":"boolean","description": " Answer to q1b "},
				"q1c" :{"type":"boolean","description": " Answer to q1c "},
				"q3a" :{"type":"boolean","description": " Answer to q3a "},
				"q3b" :{"type":"boolean","description": " Answer to q3b "},
				"q3c" :{"type":"boolean","description": " Answer to q3c "},
				"satO2": {"type":"number", "format": "float", "description": "satO2"},
				"walkingDist": {"type":"number", "format": "float", "description": "walkingDist"},
				"temperature": {"type":"number", "format": "float", "description": "temperature"},
				"pefr": {"type":"number", "format": "float", "description": "pefr"},
				"heartRate": {"type":"number", "format": "float", "description": "heartRate"}
			}
		}
}