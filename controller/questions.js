/**
 * Route: Questions
 */

var mysql = require('../config/mysql');
var swagger = require('swagger-node-express');
var db = mysql.db;
var async = require('async');


exports.add = function(req,res){
   db.getConnection(function(err, connection) {
      if (err) {
         console.error('DB Connection error on POST new question: ',err);
         res.send(503);
      } else {
         var question_text = db.escape(req.body.text);
         var question_type = db.escape(req.body.type);
         var question_category = db.escape(req.body.category);
         var sql = 'Insert into questions (text, type, category) VALUES (' 
            + question_text + ','
            + question_type + ','
            + question_category + ');'
            connection.query(sql, function(err, result) {
               if (err) {
                  console.error('Query error on POST /question: ',err);
                  return res.send(500);
               } else {
                  var sql2 = 'Insert into answers (questionId, text, value) VALUES ' ;
                  for (var i = 0; i <= req.body.answers.length - 1; i++){
                     sql2 += '(' + result.insertId + ',' 
                     +  db.escape(req.body.answers[i].text) + ','
                     + db.escape(req.body.answers[i].value) + ')';
                     if (i < req.body.answers.length-1) sql2 += ',';
                  }
                  sql2 += ';';
                  connection.query(sql2, function(err, result2) {
                     if (err) {
                        console.error('Query error on POST /question: ',err);
                        return res.send(500);
                     } 
                  });
                  res.statusCode = 201;
                  res.location('questions/' + result.insertId);
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
         console.error('DB Connection error on GET questions: ',err);
         res.send(503);
      } else {
         var qry = 'SELECT questionId,category,type,text,active FROM questions ORDER BY category';
//         if (req.query.category && req.query.category != 'undefined'){
//        	 qry += ' WHERE category='+db.escape(req.query.category);
//         }
//         if (req.query.sortBy && req.query.sortBy != 'undefined'){
//            qry += ' ORDER BY ' + req.query.sortBy + ' ';
//            if (req.query.order != 'undefined' && req.query.order){
//               qry += req.query.order;
//            }
//            else qry += 'ASC';
//         }
         connection.query(qry, function(err, rows) {
            if (err) {
               console.error('Query error on GET questions: ',err);
               return res.send(500);
            }
            if (rows.length > 0){
               var result_set = new Array();
               async.eachSeries(rows, function(question, each_next){
                  async.waterfall([
                                   function(wf1_next){
                                      var qid = question.questionId;
                                      var qry = 'SELECT * FROM answers where questionId = ' + qid;
                                      connection.query(qry, wf1_next);
                                   },
                                   function(result, fields, wf2_next){
                                      question.answers = [];
                                      for (var k = 0; k < result.length;k++){
                                         question.answers.push(result[k]);
                                      }
                                      //result_set.push(question);
                                      wf2_next(null, question);
                                   }
                                   ], 
                                   function(err, result){ //final waterfall
                                 if (err) {res.send (503);}
                                 result_set.push(result);
                                 each_next();
                              });
               }, function(err,result){ // final eachSeries
                  if (err) {res.send (503);}
                  res.send(result_set);
               } ); 
            }
            else{
               res.send(204);
            }
            connection.release();
         });
      }
   });
}

exports.getCategories = function(req,res){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on GET /quesiton categories: ',err);
			res.send(503);
		} else {
			connection.query('SELECT DISTINCT category FROM questions', function(err, rows, fields) {
				if (err) {
					console.error('Query error on GET /quesiton categories: ',err);
					return res.send(500);
				}
				if (rows.length > 0){
					var cat = [];
					for (var i = 0;i<rows.length;i++){
						cat.push(rows[i].category);
					}
					res.send({categories: cat});
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

exports.getTypes = function(req,res){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on GET /quesiton types: ',err);
			res.send(503);
		} else {
			connection.query('SELECT DISTINCT type FROM questions', function(err, rows, fields) {
				if (err) {
					console.error('Query error on GET /quesiton types: ',err);
					return res.send(500);
				}
				if (rows.length > 0){
					var typ = [];
					for (var i = 0;i<rows.length;i++){
						typ.push(rows[i].type);
					}
					res.send({types: typ});
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

exports.listSpec = {
		summary : "List all Questions",
		path : "/questions",
		method: "GET",
		type : "Question",
		nickname : "listQuestions",

}


exports.addSpec = {
		summary : "Add Question",
		path : "/questions",
		method: "POST",
		nickname : "addQuestion",
		parameters : [swagger.bodyParam("Question", "new Question with Answers", "Question")],

}

exports.models = {
		"Answer":{
			"id" : "Answer",
			"required": ["questionId", "answerId", "value"],
			"properties":{
				"answerId":{
					"type":"integer",
					"format": "int32",
					"description": "Unique Identifier",
				},
				"questionId":{
					"type":"integer",
					"format": "int32",
					"description": "Unique Identifier for the corresponding Question",
				},
				"value":{
					"type":"integer",
					"format": "int32",
					"description": "Numerical Value for this Answerpossibilty",
				},
				"text":{
					"type":"string",
					"description": "Optional Description",
				},
				
			}
		},
		"Question":{
			"id" : "Question",
			"required": ["questionId", "type", "category", "active", "answers"],
			"properties":{
				"questionId":{
					"type":"integer",
					"format": "int64",
					"description": "Unique Identifier",
				},
				"type":{
					"type":"string",
					"description" : "Answertype",
					"enum":[
					        "radio",
					        "check",
					        "mixed"
					        ]
				},
				"category":{
					"type":"string",
					"description" : "Questioncategory",
					"enum":[
					        "daily",
					        "catscale",
					        "ccq"
					        ]
				},
				"text":{
					"type":"string",
					"description": "Questiontext"
				}, 
				"active":{
					"type":"boolean",
					"description": "Is this question still active? Inactive Questions wont be displayed by default"
				}, 
				"answers":{
					"type" : "array",
					"description" : "Possible Answers to this question",
					"items" : {
						"$ref" : "Answer"
					}
				}
			}
		}

}
