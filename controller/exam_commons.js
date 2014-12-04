/**
 * Common Functions for Catscales, CCQs, Charlsons, Treatments, Readings
 * 
 * These are the exam-subresources (with collection-resources) of patients, which only can be used by doctors.
 * 
 * Valid Values for exam parameter are: catscales, ccqs, charlsons, treatments, readings
 * (Those values are supported by the stored procedures!)
 */

var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;
var config = require('../config/config.js');

/**
 * GET lists from Catscales, CCQs, Charlsons, Treatments, Readings
 * 
 * Valid Values for exam parameter are: catscales, ccqs, charlsons, treatments, readings
 * (Those values are supported by the stored procedures!)
 * 
 * Steps:
 * 		1) Role Validation
 * 		2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.list = function(req, res, next, exam){
	// 1) Role Validation
	if (req.user.role != 'doctor'){
		res.statusCode = 403;
		res.send({error: 'Forbidden'});
	}
	else{
		//2) Get DB Connection
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
					// 3) create SQL Query from parameters 

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
					} //TODO: qry not declared
					connection.query(qry, [exam, req.params.id, page, pageSize], function(err, rows) {
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
									o._links = new Object();
									// create self link
									o._links.self = new Object();
									o._links.self.href = host+'/patients/'+req.params.id+'/'+exam+'/'+rows[0][i].recordId;
									o._links.patient = new Object();
									// create link to patient
									o._links.patient.href = host+'/patients/'+req.params.id;
									result.push(o);
								}
								var links;
								// add pagination links to result set if pagination was used
								if(page != 0){
									links = new Object();
									// create first link
									var first = host+'/patients/'+req.params.id+'/'+exam+'?page=1&pageSize='+pageSize;
									links.first = first;
									if (rows[0].length == pageSize) {
										// create "next" link
										var next = host+'/patients/'+req.params.id+'/'+exam+'?page='+(page+1)+'&pageSize='+pageSize;
										links.next = next
									}
									if (page != 1){
										// create back link
										var back = host+'/patients/'+req.params.id+'/'+exam+'?page='+(page-1)+'&pageSize='+pageSize;
										links.back = back
									}
								}
								// send result
								var ret = new Object();
								ret[exam] = result;
								if(page != 0) ret._links = links;
								res.send(ret);
							}
							else{
								// there was no result to send
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
 * GET single record from Catscales, CCQs, Charlsons, Treatments, Readings
 * 
 * Valid Values for exam parameter are: catscales, ccqs, charlsons, treatments, readings
 * (Those values are supported by the stored procedures!)
 * 
 * Steps:
 * 		1) Role Validation
 * 		2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.listOne = function(req,res,next, exam) {
	// 1) Role Validation
	if (req.user.role != 'doctor') {
		res.statusCode = 403;
		res.send({error: 'Forbidden'});
	}
	else {
		// 2) Get DB Connection
		db.getConnection(function (err, connection) {
			if (err) {
				console.error('DB Connection error on GET single ' + exam + ' record: ', err);
				res.send(500);
			} else {
				//3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
				//   Password is "calculated" by function defined in config.js - currently its a concatenation of a given prefix and user id 
				connection.changeUser({
					user: req.user.accountId,
					password: config.calculatePW(req.user.accountId)
				}, function (err) {
					if (err) {
						// an error occured while changing user
						console.error(err);
						res.statusCode = 500;
						res.send({err: 'Internal Server Error'});
					}
					// 3) create SQL Query from parameters 
					var id = req.params.id;
					var rid = req.params.rid;
					var qry = 'call listSingleExam(?,?,?)';
					connection.query(qry, [exam, id, rid], function (err, rows) {
						if (err) {
							// Error Handling for sql signal statements for the triggers
							// 22400 is equiv. to HTTP Error Code 400: Bad Request (has errors, should be altered and resend)
							if (err.code === 'ER_SIGNAL_EXCEPTION' && err.sqlState == '22400') {
								res.statusCode = 400;
								res.send({error: err.message});
							}
							// Error Handling for sql signal statements for the triggers
							// 22403 is equiv. to HTTP Error Code 403: Forbidden
							else if (err.code === 'ER_SIGNAL_EXCEPTION' && err.sqlState == '22403') {
								res.statusCode = 403;
								res.send({error: err.message});
							}
							// Error Handling: Something else went wrong!
							console.error('Query error on GET ' + exam + ': ', err);
							res.statusCode = 500;
							res.send({error: 'Internal Server Error'});
						}
						else {
							// was there any result?
							if (rows[0].length > 0) {
								var host = 'http://' + req.headers.host;
								var result = new Array();
								for (var i = 0; i < rows[0].length; i++) {
									var o = rows[0][i];
									o._links = new Object();
									o._links.self = new Object();
									// create self link
									o._links.self.href = host + '/patients/' + req.params.id + '/' + exam + '/' + rows[0][i].recordId;
									o._links.patient = new Object();
									// create link to corresponding patient
									o._links.patient.href = host + '/patients/' + req.params.id;
									result.push(o);
								}
								// send result
								res.send(result);

							}
							// there was no result
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
 * DELETE single record from Catscales, CCQs, Charlsons, Treatments, Readings
 * 
 * Valid Values for exam parameter are: catscales, ccqs, charlsons, treatments, readings
 * (Those values are supported by the stored procedures!)
 * 
 * Steps:
 * 		1) Role Validation
 * 		2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.del = function(req, res, next, exam){
	// 1) Role Validation
	if (req.user.role != 'doctor'){
		res.statusCode = 403;
		res.send({error: 'Forbidden'});
	}
	else{
		// 2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on DEL '+exam+' record: ',err);
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
					// 3) create SQL Query from parameters
					var i = req.body;
					var id = parseInt(req.params.id);
					var rid = parseInt(req.params.rid);
					// query db
					connection.query('call deleteExamRecord(?, ?, ?)', [exam, id, rid], function(err, result) {
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
								console.error('Query error on DEL '+exam+': ',err);
								res.statusCode = 500;
								res.send({error: 'Internal Server Error'});
							}
						 	else {
							// was there any row to delete?
							if (result[0][0].affected_rows > 0){
								res.statusCode = 204;
								res.send();
							}
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
