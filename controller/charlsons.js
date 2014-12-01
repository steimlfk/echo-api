/**
 * Controller: Charlson Records
 * 
 * Contains Methods to GET (imported from commons) and POST to /patients/id/charlsons (list and add)
 * And Methodes to GET (imported from commons), PUT and DELETE (imported from commons) /patients/id/charlsons/recordid (listOne, update and del)
 * 
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;
var config = require('../config/config.js');
var commons = require('./exam_commons.js');

/*
 *  GET /patients/id/charlsons
 */
exports.list = function(req,res,next){
	commons.list(req,res,next,'charlsons');
}
/*
 * GET /patients/id/charlsons/recordid
 */
exports.listOne = function(req,res,next){
	commons.listOne(req,res,next,'charlsons');
}
/*
 *  DELETE /patients/id/charlsons/recordid
 */
exports.del = function(req,res,next){
	commons.del(req,res,next,'charlsons');
}

/*
 *  POST /patients/id/charlsons
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
		// 2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				console.error('DB Connection error on POST /cats record: ',err);
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
					// 4) create SQL Query from parameters }
					var i = req.body;
					// any given ID in the body will be ignored and the ids from the url are used!
					var id = parseInt(req.params.id);
					// if no date is given make it null, so the trigger can set the date
					var date = (i.diagnoseDate || i.diagnoseDate != "")? i.diagnoseDate : null;
					// query db 
					// ? from query will be replaced by values in [] - including escaping!
					connection.query('call charlsonCreate(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', 
							[id, date, i.aids,i.anyTumor,i.cerebrovascularDisease,
									i.chronicPulmonaryDiasease,i.congestiveHeartFailure,i.connectiveTissueDisease,i.dementia,
									i.diabetes,i.diabetesWithEndOrganDamage,i.hemiplegia,i.leukemia,i.liverDiseaseMild,
									i.liverDiseaseModerateOrSevere,i.malignantLymphoma,i.metastaticSolidMalignancy,
									i.myocardialInfarction,i.peripheralVascularDisease,i.renalDiseaseModerateOrSevere,
									i.ulcerDisease,i.noConditionAvailable], function(err, result) {
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
								console.error('Query error on POST ccq: ',err);
								res.statusCode = 500;
								res.send({error: 'Internal Server Error'});
							}
						} else {
							// resource was created
							// link will be provided in location header
							res.statusCode = 201;
							res.location('/patients/'+ id + '/charlsons/' + result[0][0].insertId);
							res.send();
						}
						connection.release();
					});
				});
			}	
		});
	}
}

/*
 *  PUT /patients/id/charlsons/recordid
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
		res.send({error: 'Forbidden. Invalid Role.'});
	}
	else{
		// 2) Get DB Connection
		db.getConnection(function(err, connection) {
			if (err) {
				// an error occured while querying the db
				console.error('DB Connection error on PUT /cats record: ',err);
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
					connection.query('call charlsonUpdate(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', 
							[rid, id, date, i.aids,i.anyTumor,i.cerebrovascularDisease,
									i.chronicPulmonaryDiasease,i.congestiveHeartFailure,i.connectiveTissueDisease,i.dementia,
									i.diabetes,i.diabetesWithEndOrganDamage,i.hemiplegia,i.leukemia,i.liverDiseaseMild,
									i.liverDiseaseModerateOrSevere,i.malignantLymphoma,i.metastaticSolidMalignancy,
									i.myocardialInfarction,i.peripheralVascularDisease,i.renalDiseaseModerateOrSevere,
									i.ulcerDisease,i.noConditionAvailable], function(err, result) {
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
								console.error('Query error on PUT ccq: ',err);
								res.statusCode = 500;
								res.send({error: 'Internal Server Error'});
							}
						} else {
							// record  was updated
							if (result[0][0].affected_rows > 0){
								res.statusCode = 204;
								res.send();
							}
							else {
								// record wasnt updated since it doesnt exist or isnt visible to the current user
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
		summary : "Get Charlson Records of this Patient (Roles: doctor)",
		notes: "This Function lists all Charlson Tests for the given patient. <br>This function passes the parameters to the SP listExams. <br><br> <b>Parameters:</b> <br><br>  " +
		"<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " +
		"To support pagination the following links are supplied, if page is greater than zero:  <br>" +
		"_links: { <br>" +
		"self: (link to this collection) <br>" +
		"first: (link to first page of collection) <br>" +
		"next: (link to next page of the collection, if result size not equals pageSize) <br>" +
		"back: (link to previous page of the collection, if page is greater than 1) <br>" +
		"} <br> <br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>200</b>  List of Charlsons is supplied. Format cats: [Array of charlson Model] <br>" +
		" <b>204</b>  List (or the current page) is currently empty <br>" +
		" <b>403</b>  The current user isnt allowed to access the data of the given patient <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/charlsons",
		method: "GET",
		type : "Charlson",
		nickname : "listCharlson",
		parameters : [swagger.pathParam("id", "Patient where the records belong to", "string"),
		              swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
		              swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.addSpec = {
		summary : "Add  Charlson Records (Roles: doctor)",
		notes: "This Function creates an new Catscale Record. If the Body contains patientId, its ignored. The Score Value don't has to be provided as the Database will calculate it. Also it will set the date if date is null. <br>This function passes its parameters to the SP charlsonCreate. <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>201</b>  Record is created and the location is returned in the Location Header <br>" +
		" <b>400</b>  The provided data contains errors, e.g. a invalid value for status <br>" +
		" <b>403</b>  The logged in user isnt allowed to create a record with this data.<br>"+
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/charlsons",
		method: "POST",
		nickname : "addCharlson",
		parameters : [swagger.bodyParam("Charlson", "new Record", "NewCharlson"), swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}

exports.listOneSpec = {
		summary : "Get specific Charlson Record of this Patient (Roles: doctor)",
		notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP listSingleExams. <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>200</b>  Record is supplied <br>" +
		" <b>403</b>  The current user isnt allowed to access the data of the given patient <br>" +
		" <b>404</b>  The requested record doesnt exist. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/charlsons/{rid}",
		method: "GET",
		type : "CCQ",
		nickname : "listOneCCQ",
		parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string")],
		responseMessages : [swagger.errors.notFound('rid')]

}


exports.delSpec = {
		summary : "Delete specific Charlson Record of this Patient (Roles: doctor)",
		notes: "This Function deletes a record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP deleteExamRecord <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>204</b>  Record was deleted. <br>" +
		" <b>404</b>  Record is either not visible to the current user or doesnt exist. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/charlsons/{rid}",
		method: "DELETE",
		nickname : "delCCQ",
		parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string")],
		responseMessages : [swagger.errors.notFound('rid')]

}

exports.updateSpec = {
		summary : "Update specific Charlson Record of this Patient (Roles: doctor)",
		notes: "This Function updates a record, which is specified by the url. The accountId in the Message Body is ignored. <br>This function passes its parameters to the SP charlsonUpdate. <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>204</b>  Record was updated. <br>" +
		" <b>400</b>  The provided data contains errors, e.g. a invalid value for status <br>" +
		" <b>404</b>  Record is either not visible to the current user or doesnt exist. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/patients/{id}/charlsons/{rid}",
		method: "PUT",
		nickname : "updateCCQ",
		parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string") ,swagger.bodyParam("Charlson", "updated Charlson Record", "Charlson")],
		responseMessages : [swagger.errors.notFound('rid')]
};


exports.models = {
		"Charlson":{
			"id":"Charlson",
			"required": ["patientId","recordId","diagnoseDate","myocardialInfarction","congestiveHeartFailure","peripheralVascularDisease",
			             "cerebrovascularDisease","dementia","chronicPulmonaryDiasease","connectiveTissueDisease","ulcerDisease","liverDiseaseMild",
			             "diabetes","hemiplegia","renalDiseaseModerateOrSevere","diabetesWithEndOrganDamage","anyTumor","leukemia","malignantLymphoma",
			             "liverDiseaseModerateOrSevere","metastaticSolidMalignancy","aids","noConditionAvailable","totalCharlson"],
			             "properties":{
			            	 "patientId":{
			            		 "type":"integer",
			            		 "format": "int32",
			            		 "description": "Unique Identifier of the Patient",
			            	 },
			            	 "diagnoseDate":{
			            		 "type":"string",
			            		 "format": "Date",
			            		 "description": "Date of Diagnose"
			            	 },
			            	 "recordId":{
			            		 "type":"integer",
			            		 "format": "int32",
			            		 "description": "Unique Identifier of this Record",
			            	 },
			            	 "myocardialInfarction":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "congestiveHeartFailure":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "peripheralVascularDisease":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "cerebrovascularDisease":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "dementia":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "chronicPulmonaryDiasease":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "connectiveTissueDisease":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "ulcerDisease":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "liverDiseaseMild":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "diabetes":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "hemiplegia":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "renalDiseaseModerateOrSevere":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "diabetesWithEndOrganDamage":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "anyTumor":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "metastaticSolidMalignancy":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "leukemia":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "malignantLymphoma":{
			            		 "type":"boolean","description": "Value for given Answer",

			            	 },
			            	 "liverDiseaseModerateOrSevere":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "aids":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "noConditionAvailable":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "totalCharlson":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 }
			             }
		},
		"NewCharlson":{
			"id":"Charlson",
			"required": ["myocardialInfarction","congestiveHeartFailure","peripheralVascularDisease",
			             "cerebrovascularDisease","dementia","chronicPulmonaryDiasease","connectiveTissueDisease","ulcerDisease","liverDiseaseMild",
			             "diabetes","hemiplegia","renalDiseaseModerateOrSevere","diabetesWithEndOrganDamage","anyTumor","leukemia","malignantLymphoma",
			             "liverDiseaseModerateOrSevere","metastaticSolidMalignancy","aids","noConditionAvailable"],
			             "properties":{
			            	 "diagnoseDate":{
			            		 "type":"string",
			            		 "format": "Date",
			            		 "description": "Date of Diagnose"
			            	 },
			            	 "myocardialInfarction":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "congestiveHeartFailure":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "peripheralVascularDisease":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "cerebrovascularDisease":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "dementia":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "chronicPulmonaryDiasease":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "connectiveTissueDisease":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "ulcerDisease":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "liverDiseaseMild":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "diabetes":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "hemiplegia":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "renalDiseaseModerateOrSevere":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "diabetesWithEndOrganDamage":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "anyTumor":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "metastaticSolidMalignancy":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "leukemia":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "malignantLymphoma":{
			            		 "type":"boolean", "description": "Value for given Answer",
			            	 },
			            	 "liverDiseaseModerateOrSevere":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "aids":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 },
			            	 "noConditionAvailable":{
			            		 "type":"boolean","description": "Value for given Answer",
			            	 }
			             }
		}
}


