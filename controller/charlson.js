/**
 * Route: Charlson Records
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;

exports.list = function(req,res){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on GET /charlson record: ',err);
			res.send(503);
		} else {
			var id = db.escape(req.params.id);
			var qry = 'SELECT * FROM charlson where patientId=' + id;
			connection.query(qry, function(err, rows) {
				if (err) {
					console.error('Query error on GET /charlson record: ',err);
					return res.send(500);
				}
				if (rows.length > 0){
					res.send(rows);
				}
				else{
					res.statusCode = 204;
					res.send();
				}
				connection.release();
			});
		}
	});
}


exports.add = function(req,res){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on POST /charlson record: ',err);
			res.send(503);
		} else {
			var data = req.body;
			var id = db.escape(req.params.id);
			data.patientId = req.params.id;
			connection.query('INSERT INTO charlson SET ?', data, function(err, result) {
				if (err) {
					console.error('Query error on POST /charlson record: ',err);
					return res.send(500);
				} else {
					res.statusCode = 201;
					var real_id = id.replace(/'/g, "");
					res.location('/patients/'+ rea_id + '/charlson/' + result.insertId);
					res.send();
				}
				connection.release();
			});
		}
	});
}

exports.listSpec = {
		summary : "Get Charlson Records of this Patient",
		path : "/patients/{id}/charlson",
		method: "GET",
		type : "Charlson",
		nickname : "listCharlson",
		parameters : [swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.addSpec = {
		summary : "Add  Charlson Records",
		notes: "The Score Value don't has to be provided as the Database will calculate it. The DB also sets the date if not provided",
		path : "/patients/{id}/charlson",
		method: "POST",
		nickname : "addCharlson",
		parameters : [swagger.bodyParam("Charlson", "new Record", "Charlson"), swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.models = {
		"Charlson":{
			"id":"Charlson",
			"required": ["patientId","diagnoseDate","myocardialInfarction","congestiveHeartFailure","peripheralVascularDisease",
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
			            	 "myocardialInfarction":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "congestiveHeartFailure":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "peripheralVascularDisease":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "cerebrovascularDisease":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "dementia":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "ChronicPulmonaryDiasease":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "connectiveTissueDisease":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "ulcerDisease":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "liverDiseaseMild":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "diabetes":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "hemiplegia":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "renalDiseaseModerateOrSevere":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "diabetesWithEndOrganDamage":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "anyTumor":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "metastaticSolidMalignancy":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "leukemia":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "malignantLymphoma":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",

			            	 },
			            	 "liverDiseaseModerateOrSevere":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "aids":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "noConditionAvailable":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "totalCharlson":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "group":{
			            		 "type":"integer",
			            		 "format": "int32",
			            		 "description": "",
			            	 },
			            	 "visit":{
			            		 "type": "integer",
			            		 "format": "int32",
			            		 "description" : "",
			            	 },
			            	 "optional":{
			            		 "type": "boolean",
			            		 "description" : "",
			            	 }
			             }
		}
}


