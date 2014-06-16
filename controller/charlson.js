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
			data.RefPatient = id;
			connection.query('INSERT INTO charlson SET ?', data, function(err, result) {
				if (err) {
					console.error('Query error on POST /charlson record: ',err);
					return res.send(500);
				} else {
					res.statusCode = 201;
					var real_id = id.replace(/'/g, "");
					res.location('/patients/'+ real_id + '/charlson/' + result.insertId);
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
		notes: "The Score Value don't has to be provided as the Database will calculate it. The DB also sets the date",
		path : "/patients/{id}/charlson",
		method: "POST",
		nickname : "addCharlson",
		parameters : [swagger.bodyParam("Charlson", "new Record", "Charlson"), swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.models = {
		"Charlson":{
			"id":"Charlson",
			"required": ["patientId","diagnoseDate","Myocardial_Infarction","Congestive_Heart_Failure","Peripheral_Vascular_Disease",
			             "Cerebrovascular_disease","Dementia","Chronic_Pulmonary_Diasease","Connective_tissue_disease","Ulcer_disease","Liver_disease_mild",
			             "Diabetes","Hemiplegia","Renal_disease_moderate_or_severe","Diabetes_with_end_organ_damage","Any_tumor","Leukemia","Malignant_Lymphoma",
			             "Liver_disease_moderate_or_severe","Metastatic_solid_malignancy","AIDS","No_condition_available_for_Charlson_Index","Total_Charlson"],
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
			            	 "Myocardial_Infarction":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Congestive_Heart_Failure":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Peripheral_Vascular_Disease":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Cerebrovascular_disease":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Dementia":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Chronic_Pulmonary_Diasease":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Connective_tissue_disease":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Ulcer_disease":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Liver_disease_mild":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Diabetes":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Hemiplegia":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Renal_disease_moderate_or_severe":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Diabetes_with_end_organ_damage":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Any_tumor":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Metastatic_solid_malignancy":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Leukemia":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Malignant_Lymphoma":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",

			            	 },
			            	 "Liver_disease_moderate_or_severe":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "AIDS":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "No_condition_available_for_Charlson_Index":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Total_Charlson":{
			            		 "type":"boolean",
			            		 "description": "Value for given Answer",
			            	 },
			            	 "Group":{
			            		 "type":"integer",
			            		 "format": "int32",
			            		 "description": "",
			            	 },
			            	 "visit":{
			            		 "type": "integer",
			            		 "format": "int32",
			            		 "description" : "",
			            	 },
			            	 "Optional":{
			            		 "type": "boolean",
			            		 "description" : "",
			            	 }
			             }
		}
}


