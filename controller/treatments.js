/**
 * Controller: Treatment Records
 * 
 * Contains Methods to GET (imported from commons) and POST to /patients/id/treatments (list and add)
 * And Methodes to GET (imported from commons), PUT and DELETE (imported from commons) /patients/id/treatments/recordid (listOne, update and del)
 * 
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;
var config = require('../config/config.js');
var commons = require('./exam_commons.js');

/*
 *  GET /patients/id/treatments
 */
exports.list = function(req,res,next){
	commons.list(req,res,next,'treatments');
}

/*
 * GET /patients/id/treatments/recordid
 */
exports.listOne = function(req,res,next){
	commons.listOne(req,res,next,'treatments');
}

/*
 *  DELETE /patients/id/treatments/recordid
 */
exports.del = function(req,res,next){
	commons.del(req,res,next,'treatments');
}

/**
 *  POST /patients/id/treatments
 *  Steps: 
 *  	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.add = function(req,res,next){
	// 1) Validate Role!
	if (req.user.role != 'doctor'){
		res.statusCode = 403;
		res.send({error: 'Forbidden'});
	}
	else{
		// 2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on POST /Treatment record: ',err);
				res.statusCode = 500;
				res.send({err: 'Internal Server Error'}); 
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
					// any given ID in the body will be ignored and the ids from the url are used!
					var id = parseInt(req.params.id);
					// if no date is given make it null, so the trigger can set the date
					var date = i.diagnoseDate || null;
					// make status lower case so the db triggers can validate the value (valid are baseline and exacerbation)
					var status = (i.status)? i.status.toLowerCase() : "";
					// query db 
					// ? from query will be replaced by values in [] - including escaping!
					connection.query('call treatmentCreate(?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?)', 
							[id, date,status,i.antibiotics,i.antiflu,i.antipneum,i.lama,i.longActingB2,
									i.ltot,i.ltotDevice,i.ltotStart,i.mycolytocis,i.niv,i.pdef4Inhalator,i.sama,i.shortActingB2,
									i.steroidsInhaled,i.steroidsOral,i.theophyline,i.ultraLongB2,i.ventilationDevice,i.ventilationStart], 
									function(err, result) {
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
								console.error('Query error on POST Treatment: ',err);
								res.statusCode = 500;
								res.send({error: 'Internal Server Error'});
							}

						} else {
							// resource was created
							// link will be provided in location header
							res.statusCode = 201;
							res.location('/patients/'+ id + '/treatments/' + result[0][0].insertId);
							res.send();
						}
						connection.release();
					});
				});
			}	
		});
	}
}

/**
 *  PUT /patients/id/treatments/recordid
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
	if (req.user.role != 'doctor'){
		res.statusCode = 403;
		res.send({error: 'Forbidden'});
	}
	else{
		// 2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on PUT /Treatment record: ',err);
				res.statusCode = 500;
				res.send({err: 'Internal Server Error'}); 
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
					// any given ID in the body will be ignored and the ids from the url are used!
					var id = parseInt(req.params.id);
					var rid = parseInt(req.params.rid);
					// if no date is given make it null, so the trigger can set the date
					var date = (i.diagnoseDate || i.diagnoseDate != "")? i.diagnoseDate : null;
					// make status lower case so the db triggers can validate the value (valid are baseline and exacerbation)
					var status = (i.status)? i.status.toLowerCase() : "";
					// query db 
					// ? from query will be replaced by values in [] - including escaping!
					connection.query('call treatmentUpdate(?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?,?)', 
							[rid, id, date,status,i.antibiotics,i.antiflu,i.antipneum,i.lama,i.longActingB2,
									i.ltot,i.ltotDevice,i.ltotStart,i.mycolytocis,i.niv,i.pdef4Inhalator,i.sama,i.shortActingB2,
									i.steroidsInhaled,i.steroidsOral,i.theophyline,i.ultraLongB2,i.ventilationDevice,i.ventilationStart], 
									function(err, result) {
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
								console.error('Query error on PUT Treatment: ',err);
								res.statusCode = 500;
								res.send({error: 'Internal Server Error'});
							}
						} else {
							// record  was updated
							if (result[0][0].affected_rows > 0){
								res.statusCode = 204;
								res.send();
							}
							// record wasnt updated since it doesnt exist or isnt visible to the current user	
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

exports.listSpec = {
		summary : "Get Treatment Records of this Patient (Roles: doctor)",
		notes: "This Function lists all Treatment Records for the given patient. <br>This function passes the parameters to the SP listExams. <br><br> <b>Parameters:</b> <br><br>  " +
		"<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " +
		"To support pagination the following links are supplied, if page is greater than zero:  <br>" +
		"_links: { <br>" +
		"self: (link to this collection) <br>" +
		"first: (link to first page of collection) <br>" +
		"next: (link to next page of the collection, if result size not equals pageSize) <br>" +
		"back: (link to previous page of the collection, if page is greater than 1) <br>" +
		"} <br> <br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>200</b>  List of Readings is supplied. Format cats: [Array of treatments Model] <br>" +
		" <b>204</b>  List (or the current page) is currently empty <br>" +
		" <b>403</b>  The current user isnt allowed to access the data of the given patient <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/treatments",
		method: "GET",
		type : "Treatment",
		nickname : "listTreatment",
		parameters : [swagger.pathParam("id", "Patient where the records belong to", "string"),
		              swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
		              swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.addSpec = {
		summary : "Add  Treatment Records (Roles: doctor)",
		notes: "This Function creates an new Catscale Record. (if the Body contains patientId, its ignored) <br>This function passes its parameters to the SP treamtentCreate. <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>201</b>  Record is created and the location is returned in the Location Header <br>" +
		" <b>400</b>  The provided data contains errors, e.g. a invalid value for status <br>" +
		" <b>403</b>  The logged in user isnt allowed to create a record with this data.<br>"+
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/treatments",
		method: "POST",
		nickname : "addTreatment",
		parameters : [swagger.bodyParam("Treatment", "new Record", "NewTreatment"), 
		              swagger.pathParam("id", "Patient where the records belong to", "string")],

}

exports.listOneSpec = {
		summary : "Get specific Treatment Record of this Patient (Roles: doctor)",
		notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP listSingleExams. <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>200</b>  Record is supplied <br>" +
		" <b>403</b>  The current user isnt allowed to access the data of the given patient <br>" +
		" <b>404</b>  The requested record doesnt exist. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/treatments/{rid}",
		method: "GET",
		type : "Treatment",
		nickname : "listOneTreatment",
		parameters : [swagger.pathParam("id", "ID of the Patient", "string"), 
		              swagger.pathParam("rid", "ID of the Record", "string")],

}


exports.delSpec = {
		summary : "Delete specific Treatment Record of this Patient (Roles: doctor)",
		notes: "This Function deletes a record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP deleteExamRecord <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>204</b>  Record was deleted. <br>" +
		" <b>404</b>  Record is either not visible to the current user or doesnt exist. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/treatments/{rid}",
		method: "DELETE",
		nickname : "delTreatment",
		parameters : [swagger.pathParam("id", "ID of the Patient", "string"), 
		              swagger.pathParam("rid", "ID of the Record", "string")],

}

exports.updateSpec = {
		summary : "Update specific Treatment Record of this Patient (Roles: doctor)",
		path : "/patients/{id}/treatments/{rid}",
		notes: "This Function updates an Account, which is specified by the url. The accountId in the Message Body is ignored. <br>This function passes its parameters to the SP treatmentUpdate. <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>204</b>  Record was updated. <br>" +
		" <b>400</b>  The provided data contains errors, e.g. a invalid value for status <br>" +
		" <b>404</b>  Record is either not visible to the current user or doesnt exist. <br>" +
		" <b>500</b> Internal Server Error",
		method: "PUT",
		nickname : "updateTreatment",
		parameters : [swagger.pathParam("id", "ID of the Patient", "string"), 
		              swagger.pathParam("rid", "ID of the Record", "string") ,
		              swagger.bodyParam("Treatment", "updated Treatment Record", "Treatment")],
};


exports.models = {
		"Treatment":{
			"id":"Treatment",
			"required": ["patientId","recordId","diagnoseDate","status","antibiotics","antiflu","antipneum","lama","longActingB2","ltot",
			             "ltotDevice","ltotStart","mycolytocis","niv","pdef4Inhalator","sama","shortActingB2","steroidsInhaled",
			             "steroidsOral","theophyline","ultraLongB2","ventilationDevice","ventilationStart"],
			             "properties":{
			            	 "patientId": {"type":"integer", "format": "int32", "description": "patientId"},
			            	 "recordId":{"type":"integer","format": "int32","description": "Unique Identifier of this Record"},
			            	 "diagnoseDate":{"type":"string","format": "Date", "description": "Date of Diagnose"},
			            	 "status":{"type":"string","description" : "Status","enum":[ "Baseline", "Exacerbation"]},
			            	 "antibiotics":{"type":"boolean","description": "antibiotics"},
			            	 "antiflu":{"type":"boolean","description": "antiflu"},
			            	 "antipneum":{"type":"boolean","description": "antipneum"},
			            	 "lama":{"type":"boolean","description": "lama"},
			            	 "longActingB2":{"type":"boolean","description": "longActingB2"},
			            	 "ltot":{"type":"boolean","description": "ltot"},
			            	 "ltotDevice":{"type":"string","description" : "LTOT Device","enum":[ "CPAP", "BiPAP"]},
			            	 "ltotStartDate":{"type":"string","format": "Date", "description": "Date of LTOT Start"},
			            	 "mycolytocis":{"type":"boolean","description": "mycolytocis"},
			            	 "niv":{"type":"boolean","description": "niv"},
			            	 "pdef4Inhalator":{"type":"boolean","description": "pdef4Inhalator"},
			            	 "sama":{"type":"boolean","description": "sama"},
			            	 "shortActingB2":{"type":"boolean","description": "shortActingB2"},
			            	 "steroidsInhaled":{"type":"boolean","description": "steroidsInhaled"},
			            	 "steroidsOral":{"type":"boolean","description": "steroidsOral"},
			            	 "theophyline":{"type":"boolean","description": "theophyline"},
			            	 "ultraLongB2":{"type":"boolean","description": "ultraLongB2"},
			            	 "ventilationDevice":{"type":"string","description" : "Ventilation Device","enum":[ "Concetrator", "Cylinder", "Liquid"]},
			            	 "ventilationStart":{"type":"string","format": "Date", "description": "Date of Ventilation Start"}
			             }
		},
		"NewTreatment":{
			"id":"Treatment",
			"required": ["patientId","diagnoseDate","status","antibiotics","antiflu","antipneum","lama","longActingB2","ltot",
			             "ltotDevice","ltotStart","mycolytocis","niv","pdef4Inhalator","sama","shortActingB2","steroidsInhaled",
			             "steroidsOral","theophyline","ultraLongB2","ventilationDevice","ventilationStart"],
			             "properties":{
			            	 "diagnoseDate":{"type":"string","format": "Date", "description": "Date of Diagnose"},
			            	 "status":{"type":"string","description" : "Status","enum":[ "Baseline", "Exacerbation"]},
			            	 "antibiotics":{"type":"boolean","description": "antibiotics"},
			            	 "antiflu":{"type":"boolean","description": "antiflu"},
			            	 "antipneum":{"type":"boolean","description": "antipneum"},
			            	 "lama":{"type":"boolean","description": "lama"},
			            	 "longActingB2":{"type":"boolean","description": "longActingB2"},
			            	 "ltot":{"type":"boolean","description": "ltot"},
			            	 "ltotDevice":{"type":"string","description" : "LTOT Device","enum":[ "CPAP", "BiPAP"]},
			            	 "ltotStartDate":{"type":"string","format": "Date", "description": "Date of LTOT Start"},
			            	 "mycolytocis":{"type":"boolean","description": "mycolytocis"},
			            	 "niv":{"type":"boolean","description": "niv"},
			            	 "pdef4Inhalator":{"type":"boolean","description": "pdef4Inhalator"},
			            	 "sama":{"type":"boolean","description": "sama"},
			            	 "shortActingB2":{"type":"boolean","description": "shortActingB2"},
			            	 "steroidsInhaled":{"type":"boolean","description": "steroidsInhaled"},
			            	 "steroidsOral":{"type":"boolean","description": "steroidsOral"},
			            	 "theophyline":{"type":"boolean","description": "theophyline"},
			            	 "ultraLongB2":{"type":"boolean","description": "ultraLongB2"},
			            	 "ventilationDevice":{"type":"string","description" : "Ventilation Device","enum":[ "Concetrator", "Cylinder", "Liquid"]},
			            	 "ventilationStart":{"type":"string","format": "Date", "description": "Date of Ventilation Start"}
			             }
		}
}


