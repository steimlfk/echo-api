/**
 * Route: CCQ Week Records
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;

exports.list = function(req,res){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on GET /ccq_week record: ',err);
			res.send(503);
		} else {
			var id = db.escape(req.params.id);
			var qry = 'SELECT * FROM ccqweek where patientId=' + id;
			connection.query(qry, function(err, rows) {
				if (err) {
					console.error('Query error on GET /ccq_week record: ',err);
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
		console.log(req.body);
		if (err) {
			console.error('DB Connection error on POST /ccq_week record: ',err);
			res.send(503);
		} else {
			var data = req.body;
			var id = db.escape(req.params.id);
			data.patientId = req.params.id;
			connection.query('INSERT INTO ccqweek SET ?', data, function(err, result) {
				if (err) {
					console.error('Query error on POST /ccq_week record: ',err);
					return res.send(500);
				} else {
					res.statusCode = 201;
					var real_id = id.replace(/'/g, "");
					res.location('/patients/'+ real_id + '/ccqweek/' + result.insertId);
					res.send();
				}
				connection.release();
			});
		}
	});
}



exports.listSpec = {
		summary : "Get All weekly CCQ Records of this Patient",
		path : "/patients/{id}/ccqweek",
		method: "GET",
		type : "CCQ",
		nickname : "listCCQ",
		parameters : [swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.addSpec = {
		summary : "Add  weekly CCQ Records",
		notes: "The Score Values don't have to be provided. The Database will calculate them. The DB also sets the date",
		path : "/patients/{id}/ccqweek",
		method: "POST",
		nickname : "addCCQ",
		parameters : [swagger.bodyParam("CCQ", "new Record", "NewCCQ"), swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')],
		notes : "Total Values will be computed from q*; if no diagnoseDate is supplied current date will be used; patientId doesnt need to be supplied as it is taken from the url"


}


exports.models = {
		"CCQ":{
			"id":"CCQ",
			"required": ["patientId", "diagnoseDate", "status", "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "Total_CCQ_Score", "Symptom_Score", "Mental_State_Score", "Functional_State_Score"],
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
				"status":{
					"type":"string",
					"description" : "Status",
					"enum":[
					        "Baseline",
					        "Exacerbation"
					        ]
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
				"q9":{
					"type":"integer",
					"format": "int32",
					"description": "Score for Q9"
				},
				"q10":{
					"type":"integer",
					"format": "int32",
					"description": "Score for Q10"
				},
				"totalCCQScore":{
					"type":"number",
					"format": "float",
					"description": "Total CCQ Score",
				},
				"symptomScore":{
					"type":"number",
					"format": "float",
					"description": "Symptom Score",
				},
				"mentalStateScore":{
					"type":"number",
					"format": "float",
					"description": "Mental State Score",
				},
				"functionalStateScore":{
					"type":"number",
					"format": "float",
					"description": "Functional State Score",
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
		},
		"NewCCQ":{
			"id":"CCQ",
			"required": ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"],
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
				"status":{
					"type":"string",
					"description" : "Status",
					"enum":[
					        "Baseline",
					        "Exacerbation"
					        ]
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
				"q9":{
					"type":"integer",
					"format": "int32",
					"description": "Score for Q9"
				},
				"q10":{
					"type":"integer",
					"format": "int32",
					"description": "Score for Q10"
				},
				"totalCCQScore":{
					"type":"number",
					"format": "float",
					"description": "Total CCQ Score",
				},
				"symptomScore":{
					"type":"number",
					"format": "float",
					"description": "Symptom Score",
				},
				"mentalStateScore":{
					"type":"number",
					"format": "float",
					"description": "Mental State Score",
				},
				"functionalStateScore":{
					"type":"number",
					"format": "float",
					"description": "Functional State Score",
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


