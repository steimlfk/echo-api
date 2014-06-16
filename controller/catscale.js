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
			data.RefPatient = id;
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
		parameters : [swagger.bodyParam("Catscale", "new Record", "Catscale"), swagger.pathParam("id", "Patient where the records belong to", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}


exports.models = {
		"Catscale":{
			"id":"Catscale",
			"required": ["patientId", "catscale", "diagnoseDate", "status"],
			"properties":{
				"patientId":{
					"type":"integer",
					"format": "int32",
					"description": "Unique Identifier of the Patient",
				},
				"catscale":{
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


//exports.listOne = function(req,res){

//db.getConnection(function(err, connection) {
//if (err) {
//console.error('DB Connection error on GET /charlson record: ',err);
//res.send(503);
//} else {
//var id = db.escape(req.params.id);
//var date = db.escape(req.params.cid);
//console.log(date);
//connection.query('SELECT * FROM charlson where patient=' + id+ ' And diag_date = ' + date, function(err, rows, fields) {
//if (err) {
//console.error('Query error on GET /charlson record: ',err);
//return res.send(500);
//}

//if (rows.length > 0){
//res.send(rows);
//}
//else{
//res.statusCode = 404;
//res.send();
//}
//connection.release();
//});
//}
//});
//}


//exports.del =   function(req,res){
//db.getConnection(function(err, connection) {
//if (err) {
//console.error('DB Connection error on DELETE /charlson record: ',err);
//res.send(503);
//} else {
//var id = db.escape(req.params.id);
//var cid = db.escape(req.params.cid);
//var sql = 'DELETE FROM charlson WHERE charlsonId = ' + cid + 'AND refpatient =' +id;
//connection.query(sql , function(err, result) {
//if (err){ 
//console.error('Query error on DELETE //charlson record: ',err);
//return res.send(500); 
//}
//else {
//if (result.affectedRows > 0){
//res.statusCode = 204;
//res.send();
//}
//else {
//res.statusCode = 404;
//res.send();
//}
//}
//connection.release();
//});
//}
//});
//}

//exports.update = function(req,res){

//db.getConnection(function(err, connection) {
//if (err) {
//console.error('DB Connection error on PUT charlson record: ',err);
//res.send(503);
//} else {
//var id = db.escape(req.params.id);
//var cid = db.escape(req.params.cid);
//var sql = 'UPDATE charlson SET ? WHERE charlsonId = ' + cid + 'AND refpatient ='+id;
//connection.query(sql,req.body, function(err, result) {
//if (err) {
//console.error('Query error on PUT charlson record: ',err);
//return res.send(500);
//} else {
//if (result.affectedRows > 0){
//res.statusCode = 204;
//res.send();
//}
//else {
//res.statusCode = 404;
//res.send();
//}
//}
//connection.release();
//});
//}
//});
//}
