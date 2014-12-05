/**
 * Route: Dyspneascale Records
 * 
 * Not required ?!
 * 
 * 
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;

exports.list = function(req,res){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on GET /Dyspneascale record: ',err);
			res.send(503);
		} else {
			var id = db.escape(req.params.id);
			var qry = 'SELECT * FROM dyspneascales where patientId=' + id;
			connection.query(qry, function(err, rows) {
				if (err) {
					console.error('Query error on GET /Dyspneascale record: ',err);
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
			console.error('DB Connection error on POST /Dyspneascale record: ',err);
			res.send(503);
		} else {
			var data = req.body;
			var id = db.escape(req.params.id);
			data.RefPatient = id;
			connection.query('INSERT INTO dyspneascales SET ?', data, function(err, result) {
				if (err) {
					console.error('Query error on POST /catscale record: ',err);
					return res.send(500);
				} else {
					res.statusCode = 201;
					var real_id = id.replace(/'/g, "");
					res.location('/patients/'+ real_id + '/dyspneascales/' + result.insertId);
					res.send();
				}
				connection.release();
			});
		}
	});
}


exports.listSpec = {
		summary : "Get All Dyspneascale Records of this Patient",
		path : "/patients/{id}/dyspneascale",
		method: "GET",
		type : "Dyspneascale",
		nickname : "listDyspneascale",
		parameters : [swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.addSpec = {
		summary : "Add Dyspneascale Records",
		path : "/patients/{id}/dyspneascale",
		method: "POST",
		nickname : "addDyspneascale",
		parameters : [swagger.bodyParam("Dyspneascale", "new Record", "Dyspneascale"), swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.models = {
		"Dyspneascale":{
			"id":"Dyspneascale",
			"required": ["patientId","diagnoseDate","status","BORG","MRC","VAS","O2COST","SixMWT","SixMWTTIME","group","visit","optional"],
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
				"status":{
					"type":"string",
					"description" : "Status",
					"enum":[
					        "Baseline",
					        "Exacerbation"
					        ]
				},
				"BORG":{
					"type":"integer",
					"format": "int32",
					"description": "Value for given Answer"
				},
				"MRC":{
					"type":"integer",
					"format": "int32",
					"description": "Value for given Answer"
				},
				"VAS":{
					"type":"integer",
					"format": "int32",
					"description": "Value for given Answer"
				},
				"O2COST":{
					"type":"integer",
					"format": "int32",
					"description": "Value for given Answer"
				},
				"SixMWT":{
					"type":"integer",
					"format": "int32",
					"description": "Value for given Answer"
				},
				"SixMWTTIME":{
					"type":"integer",
					"format": "int32",
					"description": "Value for given Answer"
				},
				"Group":{
					"type":"integer",
					"format": "int32",
					"description": ""
				},
				"Visit":{
					"type": "integer",
					"format": "int32",
					"description" : ""
				},
				"Optional":{
					"type": "boolean",
					"description" : ""
				}

			}
		}
}
