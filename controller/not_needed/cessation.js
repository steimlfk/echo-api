/**
 * Route: Cessation Intervention Records
 * 
 * Not required ?!
 * 
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;

exports.list = function(req,res){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on GET /CessationIntervention record: ',err);
			res.send(503);
		} else {
			var id = db.escape(req.params.id);
			var qry = 'SELECT * FROM cessationIntervention where patientId=' + id;
			connection.query(qry, function(err, rows) {
				if (err) {
					console.error('Query error on GET /CessationIntervention record: ',err);
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
			console.error('DB Connection error on POST /CessationIntervention record: ',err);
			res.send(503);
		} else {
			var data = req.body;
			var id = db.escape(req.params.id);
			data.RefPatient = id;
			connection.query('INSERT INTO cessationIntervention SET ?', data, function(err, result) {
				if (err) {
					console.error('Query error on POST /CessationIntervention record: ',err);
					return res.send(500);
				} else {
					res.statusCode = 201;
					var real_id = id.replace(/'/g, "");
					res.location('/patients/'+ real_id + '/CessationIntervention/' + result.insertId);
					res.send();
				}
				connection.release();
			});
		}
	});
}


exports.listSpec = {
		summary : "Get All Cessation Intervention Records of this Patient",
		path : "/patients/{id}/cessation-intervention",
		method: "GET",
		type : "Cessation",
		nickname : "listCessation",
		parameters : [swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.addSpec = {
		summary : "Add Cessation Invertention Records",
		path : "/patients/{id}/cessation-intervention",
		method: "POST",
		nickname : "addCessation",
		parameters : [swagger.bodyParam("Cessation", "new Record", "Cessation"), swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.models = {
		"Cessation":{
			"id":"Cessation",
			"required": ["patientId", "diagnoseDate", "CurrentSmoking", "Zyban", "Champix", "NicotineReplacement", "NicotineKind", "NicotineDose", "Behavioural"],
			"properties":{
				"patientId":{
					"type":"integer",
					"format": "int32",
					"description": "Unique Identifier of the Patient"
				},
				"diagnoseDate":{
					"type":"string",
					"format": "Date",
					"description": "Date of Diagnose"
				},
				"CurrentSmoking":{
					"type":"boolean",
					"description": "Value for given Answer"
				},
				"Zyban":{
					"type":"boolean",
					"description": "Value for given Answer"
				},
				"Champix":{
					"type":"boolean",
					"description": "Value for given Answer"
				},
				"NicotineReplacement":{
					"type":"boolean",
					"description": "Value for given Answer"
				},
				"NicotineKind":{
					"type":"string",
					"description": "Value for given Answer"
				},
				"NicotineDose":{
					"type":"string",
					"description": "Value for given Answer"
				},
				"Behavioural":{
					"type":"boolean",
					"description": "Value for given Answer"
				},

				"optional":{
					"type": "boolean",
					"description" : ""
				}

			}
		}
}
