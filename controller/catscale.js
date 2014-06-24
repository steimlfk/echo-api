/**
 * Route: Catsale Records
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;

exports.list = function(req,res){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on GET /catscale record: ',err);
			res.send(503);
		} else {
			var id = db.escape(req.params.id);
			var qry = 'SELECT * FROM catscale where patientId=' + id;
			connection.query(qry, function(err, rows) {
				if (err) {
					console.error('Query error on GET /catscale record: ',err);
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
			console.error('DB Connection error on POST /catscale record: ',err);
			res.send(503);
		} else {
			var data = req.body;
			var id = db.escape(req.params.id);
			data.patientId = req.params.id;
			connection.query('INSERT INTO catscale SET ?', data, function(err, result) {
				if (err) {
					console.error('Query error on POST /catscale record: ',err);
					return res.send(500);
				} else {
					res.statusCode = 201;
					var real_id = id.replace(/'/g, "");
					res.location('/patients/'+ real_id + '/catscale/' + result.insertId);
					res.send();
				}
				connection.release();
			});
		}
	});
}


exports.listSpec = {
		summary : "Get All Catscale Records of this Patient",
		path : "/patients/{id}/catscale",
		method: "GET",
		type : "Catscale",
		nickname : "listCatscale",
		parameters : [swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.addSpec = {
		summary : "Add Catscale Records",
		path : "/patients/{id}/catscale",
		method: "POST",
		nickname : "addCatscale",
		parameters : [swagger.bodyParam("Catscale", "new Record", "NewCatscale"), swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')],
		notes : "Total Catscale Value will be computed from q*; if no diagnoseDate is supplied current date will be used; patientId doesnt need to be supplied as it is taken from the url"

}


exports.models = {
		"Catscale":{
			"id":"Catscale",
			"required": ["q1","q2","q3","q4","q5","q6","q7","q8","totalCatscale","patientId","catscaleId","diagnoseDate" ],
			"properties":{
				"patientId":{
					"type":"integer",
					"format": "int32",
					"description": "Unique Identifier of the Patient",
				},
				"catscaleId":{
					"type":"integer",
					"format": "int32",
					"description": "Unique Identifier of this Record",
				},
				"totalCatscale":{
					"type":"integer",
					"format": "int32",
					"description": "Catscale Score"
				},
				"q1":{
					"type":"integer",
					"format": "int32",
					"description": "Score for Q1"
				},
				"q2":{
					"type":"integer",
					"format": "int32",
					"description": "Score for Q2"
				},
				"q3":{
					"type":"integer",
					"format": "int32",
					"description": "Score for Q3"
				},
				"q4":{
					"type":"integer",
					"format": "int32",
					"description": "Score for Q4"
				},
				"q5":{
					"type":"integer",
					"format": "int32",
					"description": "Score for Q5"
				},
				"q6":{
					"type":"integer",
					"format": "int32",
					"description": "Score for Q6"
				},
				"q7":{
					"type":"integer",
					"format": "int32",
					"description": "Score for Q7"
				},
				"q8":{
					"type":"integer",
					"format": "int32",
					"description": "Score for Q8"
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
					"description" : "",
				},
				"optional":{
					"type": "boolean",
					"description" : "",
				}

			}
		},
		"NewCatscale":{
			"id":"Catscale",
			"required": ["q1","q2","q3","q4","q5","q6","q7","q8" ],
			"properties":{
				"patientId":{
					"type":"integer",
					"format": "int32",
					"description": "Unique Identifier of the Patient",
				},
				"totalCatscale":{
					"type":"integer",
					"format": "int32",
					"description": "Catscale Score"
				},
				"q1":{
					"type":"integer",
					"format": "int32",
					"description": "Catscale Score"
				},
				"q2":{
					"type":"integer",
					"format": "int32",
					"description": "Catscale Score"
				},
				"q3":{
					"type":"integer",
					"format": "int32",
					"description": "Catscale Score"
				},
				"q4":{
					"type":"integer",
					"format": "int32",
					"description": "Catscale Score"
				},
				"q5":{
					"type":"integer",
					"format": "int32",
					"description": "Catscale Score"
				},
				"q6":{
					"type":"integer",
					"format": "int32",
					"description": "Catscale Score"
				},
				"q7":{
					"type":"integer",
					"format": "int32",
					"description": "Catscale Score"
				},
				"q8":{
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
					"description" : "",
				},
				"optional":{
					"type": "boolean",
					"description" : "",
				}

			}
		}
}


