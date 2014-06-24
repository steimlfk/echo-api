/**
 * Route: DayilyAnswers Records
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;

exports.add = function(req,res){
    db.getConnection(function(err, connection) {
        if (err) {
            console.error('DB Connection error on POST new daily-answer: ',err);
            res.send(503);
        } else {        	
        	var pid = db.escape(req.params.id);
        	            
            var sql = 'INSERT INTO dailyAnswers (patientId, questionId, score) VALUES '; 
			for (var i = 0; i <= req.body.answers.length - 1; i++){
				sql += '(' + pid + ',' 
							+  db.escape(req.body.answers[i].questionId) + ','
							+ db.escape(req.body.answers[i].score) + ')';
				if (i < req.body.answers.length-1) sql += ',';
			}
			sql += ';';
            
            connection.query(sql, function(err, result) {
                if (err) {
                    console.error('Query error on POST new daily-answer: ',err);
                    return res.send(500);
                } else {
                    res.statusCode = 201;
                    res.send();
                }
                connection.release();
            });
        }
    });
}

exports.list = function(req,res){
    db.getConnection(function(err, connection) {
        if (err) {
            console.error('DB Connection error on GET daily-answer: ',err);
            res.send(503);
        } else {
        	var id = db.escape(req.params.id);
            var qry = 'SELECT q.questionId,q.category,q.text,d.date,d.score FROM questions q, dailyAnswers d where d.questionId = q.questionId and d.patientId ='+id;
            connection.query(qry, function(err, rows) {
                if (err) {
                    console.error('Query error on GET daily-answer: ',err);
                    return res.send(500);
                }
                if (rows.length > 0){
                    res.send(rows);
                }
                else {
                    res.send(204);
                }
                connection.release();
            });
        }
    });
}

exports.listSpec = {
		summary : "Get All Answers (to Daily Questions) Given By this Patient",
		path : "/patients/{id}/daily-answers",
		method: "GET",
		type : "DailyAnswers",
		nickname : "listDailies",
		parameters : [swagger.pathParam("id", "Patient who answered the Questions", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.addSpec = {
		summary : "Add new Set of daily Answers",
		path : "/patients/{id}/daily-answers",
		method: "POST",
		nickname : "addDaily",
		parameters : [swagger.bodyParam("DailyAnswers", "new Set of Daily Answers", "DailyAnswers"), swagger.pathParam("id", "Patient who answered the Questions", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}

exports.models = {
		"SingleDailyAnswer":{
			"id" : "SingleDailyAnswer",
			"required": ["score", "questionId"],
			"properties":{
				"questionId": {
					"type" : "integer",
					"format" : "int32",
					"description" : "Unique Identifier for corresponding Question"
				},
				"score": {
					"type" : "integer",
					"format" : "int32",
					"description" : "scored Value"
				},
				"patientId": {
					"type" : "integer",
					"format" : "int32",
					"description" : "Unique Identifier for corresponding Patient"
				},
				"date": {
					"type" : "string",
					"format" : "date",
					"description" : "Date"
				},
			}
		},
		"DailyAnswers":{
			"id" : "DailyAnswers",
			"required": ["answers"],
			"properties":{
				"answers": {
					"type" : "array",
					"description" : "Given Answers",
					"items" : {
						"$ref" : "SingleDailyAnswer"
					}
				}
			}
		}
}