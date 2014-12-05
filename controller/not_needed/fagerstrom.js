/**
 * Route: Fagerstrom Records
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
			console.error('DB Connection error on GET /fagerstrom record: ',err);
			res.send(503);
		} else {
			var id = db.escape(req.params.id);
			var qry = 'SELECT * FROM fagerstrom_scale where patientId=' + id;
			connection.query(qry, function(err, rows) {
				if (err) {
					console.error('Query error on GET /fagerstrom record: ',err);
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
			console.error('DB Connection error on POST /fagerstrom record: ',err);
			res.send(503);
		} else {
			var data = req.body;
			var id = db.escape(req.params.id);
			data.RefPatient = id;
			connection.query('INSERT INTO fagerstrom_scale SET ?', data, function(err, result) {
				if (err) {
					console.error('Query error on POST /fagerstrom record: ',err);
					return res.send(500);
				} else {
					res.statusCode = 201;
					var real_id = id.replace(/'/g, "");
					res.location('/patients/'+ real_id + '/fagerstrom/' + result.insertId);
					res.send();
				}
				connection.release();
			});
		}
	});
}


exports.listSpec = {
		summary : "Get All Fagerstrom  Records of this Patient",
		path : "/patients/{id}/fagerstrom",
		method: "GET",
		type : "Fagerstrom",
		nickname : "listFagerstrom",
		parameters : [swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.addSpec = {
		summary : "Add Fagerstrom Records",
		path : "/patients/{id}/fagerstrom",
		method: "POST",
		nickname : "addFagerstrom",
		parameters : [swagger.bodyParam("Fagerstrom", "new Record", "Fagerstrom"), swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.models = {
		"Fagerstrom":{
			"id":"Fagerstrom",
			"required": ["patientId", "Fagerstrom_Score", "diagnoseDate", "status"],
			"properties":{
				"patientId":{
					"type":"integer",
					"format": "int32",
					"description": "Unique Identifier of the Patient",
				},
				"Fagerstrom_Score":{
					"type":"integer",
					"format": "int32",
					"description": "Catscale Score"
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
				"visit":{
					"type": "integer",
					"format": "int32",
					"description" : ""
				},
								"group":{
					"type": "integer",
					"format": "int32",
					"description" : ""
				},
				"optional":{
					"type": "boolean",
					"description" : ""
				}

			}
		}
}