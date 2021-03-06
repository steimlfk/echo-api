/**
 * Route: Questions
 */
var mysql = require('../utils.js').db;
var swagger = require('swagger-node-express');
var db = mysql;
var async = require('async');

exports.add = function(req,res,next){
    var connection = req.con;

    var question_text = db.escape(req.body.text);
    var question_type = db.escape(req.body.type);
    var question_category = db.escape(req.body.category);
    if (req.body.type == 'radio'){
        var sql = 'Insert into questions (text, type, category) VALUES ('
            + question_text + ','
            + question_type + ','
            + question_category + ');';
        connection.query(sql, function(err, result) {
            if (err) {
                next(err);
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
                        next(err);
                    }
                });
                res.statusCode = 201;
                res.location('/questions/' + result.insertId);
                res.send();
            }
            connection.release();
        });
    }

    if (req.body.type == 'boolean'){
        console.log(req.body);
        sql = 'Insert into questions (text, type, category) VALUES ('
        + question_text + ','
        + question_type + ','
        + question_category + ');';
        connection.query(sql, function(err, result) {
            if (err) {
                next(err);
            } else {
                res.statusCode = 201;
                res.location('/questions/' + result.insertId);
                res.send();
            }
            connection.release();
        });
    }
};

exports.list = function(req,res,next){
    var connection = req.con;
    var qry = 'SELECT questionId,category,type,text,active FROM questions ORDER BY category,type,text';
    connection.query(qry, function(err, rows) {
        if (err) {
            connection.release();
            next(err);
        }
        else if (rows.length > 0){
            var result_set = [];
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
                        if (err) {
                            each_next(err);
                        }
                        else {
                            result_set.push(result);
                            each_next();
                        }
                    });
            }, function(err,result){ // final eachSeries
                if (err) {
                    next(err);
                }
                else res.send(result_set);
                connection.release();
            } );
        }
        else{
            res.sendStatus(204);
            connection.release();
        }

    });
};

exports.del = function (req, res, next){
    var con = req.con;
    var qry = 'DELETE FROM questions WHERE questionId = ?';
    con.query(qry, req.params.id, function(err, result){
        connection.release();
        if (err) next(err);
        else {
            res.affectedRows = result[0][0].affected_rows > 0;
            next();
        }
    });
};

exports.listCatscale = function(req, res, next){
    getQuestions(req, res, next, 'cat');
};

exports.listCCQ = function(req, res, next){
    getQuestions(req, res, next, 'ccq');
};

exports.listDaily = function(req, res, next){
    getQuestions(req, res, next, 'daily');
};

exports.listCharlson = function(req, res, next){
    getQuestions(req, res, next, 'charlson');
};

function getQuestions(req, res, next, cat){
    var connection = req.con;
    var qry = 'SELECT questionId,category,type,text,active,label FROM questions where active = 1 and category=' + db.escape(cat);
    connection.query(qry, function(err, rows) {
        if (err) {
            connection.release();
            next(err);
        }
        if (rows.length > 0){
            var result_set = [];
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
                        if (err) {each_next(err);}
                        else {
                            result_set.push(result);
                            each_next();
                        }
                    });
            }, function(err,result){ // final eachSeries
                if (err) {next(err);}
                else res.send(result_set);
                connection.release();
            } );
        }
        else{
            res.sendStatus(204);
            connection.release();
        }
    });
};

exports.listSpec = {
    summary : "List all Questions",
    path : "/questions",
    method: "GET",
    type : "Question",
    nickname : "listQuestions"

};

exports.delSpec = {
    summary : "Delete specific Questions",
    path : "/questions/{id}",
    method: "DELETE",
    nickname : "delQuestion",
    parameters : [swagger.pathParam("id", "Question to delete", "string")]

};

exports.addSpec = {
    summary : "Add Question",
    path : "/questions",
    method: "POST",
    nickname : "addQuestion",
    parameters : [swagger.bodyParam("Question", "new Question with Answers", "Question")]

};

exports.listCatscaleSpec = {
    summary : "List all CAT Questions",
    path : "/questions/cat",
    method: "GET",
    type : "Question",
    nickname : "listCatscaleQuestions"

};

exports.listCCQSpec = {
    summary : "List all CCQ Questions",
    path : "/questions/ccq",
    method: "GET",
    type : "Question",
    nickname : "listCCQQuestions"

};

exports.listCharlsonSpec = {
    summary : "List all Charlson Questions",
    path : "/questions/charlson",
    method: "GET",
    type : "Question",
    nickname : "listCharlsonQuestions"

};

exports.listDailySpec = {
    summary : "List all Daily Questions",
    path : "/questions/daily",
    method: "GET",
    type : "Question",
    nickname : "listDailyQuestions"

};

exports.models = {
    "Answer":{
        "id" : "Answer",
        "required": ["questionId", "answerId", "value"],
        "properties":{
            "answerId":{
                "type":"integer",
                "format": "int32",
                "description": "Unique Identifier"
            },
            "questionId":{
                "type":"integer",
                "format": "int32",
                "description": "Unique Identifier for the corresponding Question"
            },
            "value":{
                "type":"integer",
                "format": "int32",
                "description": "Numerical Value for this Answerpossibilty"
            },
            "text":{
                "type":"string",
                "description": "Optional Description"
            }
        }
    },
    "Question":{
        "id" : "Question",
        "required": ["questionId", "type", "category", "active", "answers"],
        "properties":{
            "questionId":{
                "type":"integer",
                "format": "int64",
                "description": "Unique Identifier"
            },
            "type":{
                "type":"string",
                "description" : "Answertype",
                "enum":[
                    "radio",
                    "check"
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
};
