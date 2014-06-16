/**
 * Route: Patients Records
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;

exports.list = function(req,res,next){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on GET /users: ',err);
			res.send(503);
		} else {
			var qry = 'SELECT * FROM patients';
			if (req.query.sortBy && req.query.sortBy != 'undefined'){
				qry += ' ORDER BY ' + req.query.sortBy + ' ';
				var order = 'ASC';
				if (req.query.order && req.query.order != 'undefined'){
					if (req.query.order.toLowerCase() == 'desc') order = 'DESC';
				}
				qry += order;
			}
			if (req.query.page && req.query.page != 'undefined'){
				var page = parseInt(req.query.page);
				var pageSize = 20;
				if (req.query.pageSize && req.query.pageSize != 'undefined'){
					pageSize = parseInt(req.query.pageSize);
				}
				var offset = (page*pageSize)-pageSize;
				qry += ' LIMIT ' + pageSize + ' OFFSET ' + offset;
			}
			connection.query(qry, function(err, rows) {
				if (err) {
					console.error('Query error on GET /users: ',err);
					return res.send(500);
				}
				if (rows.length > 0){
					res.send({"patients" : rows});
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
 
exports.listOne = function(req,res,next){
   
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on GET single user: ',err);
			res.send(503);
		} else {
			connection.query('SELECT * FROM patients where patientId='+db.escape(req.params.id), function(err, rows, fields) {
				if (err) {
					console.error('Query error on GET single user: ',err);
					return  res.send(500);
				}
				if (rows.length > 0){
					res.send(rows[0]);
				} 
				else{
					res.statusCode = 404;
					res.send();
				}
				connection.release();
			});
		}
	});
}

exports.add = function(req,res,next){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on POST new user: ',err);
			res.send(503);
		} else {
//			console.log(req.body);
			connection.query('INSERT INTO patients SET ?', req.body, function(err, result) {
				if (err) {
					console.error('Query error on POST /users: ',err);
					return res.send(500);
				} else {
					res.statusCode = 201;
					res.location('/users/' + result.insertId);
					res.send();
				}
				connection.release();
			});
		}
	});
}

exports.del =   function(req,res,next){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on DELETE user: ',err);
			res.send(503);
		} else {
			connection.query('DELETE FROM patients WHERE patientId = ?', req.params.id, function(err, result) {
				if (err){ 
					console.error('Query error on DELETE /users: ',err);
					return res.send(500); 
				}
				else {
					if (result.affectedRows > 0){
						res.statusCode = 204;
						res.send();
					}
					else {
						res.statusCode = 404;
						res.send();
					}
				}
				connection.release();
			});
		}
	});
}

exports.update = function(req,res,next){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on PUT user: ',err);
			res.send(503);
		} else {
			connection.query('UPDATE patients SET ? WHERE patientId = '+connection.escape(req.params.id), req.body, function(err, result) {
				if (err) {
					console.error('Query error on PUT single users: ',err);
					return res.send(500);
				} else {
					if (result.affectedRows > 0){
						res.statusCode = 204;
						res.send();
					}
					else {
						res.statusCode = 404;
						res.send();
					}
				}
				connection.release();
			});
		}
	});
}


exports.listSpec = {
		summary : "List All Patients",
		path : "/patients", 
		method: "GET",
		type : "Patient",
		nickname : "listPatients",
		parameters : [
		              swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
		              swagger.queryParam("pageSize", "Page Size for Pagnination. Default is 20", "string", false, null, "20"),
		              swagger.queryParam("sortBy", "Name of the Column to sort after", "string"),
		              swagger.queryParam("order", "ASCending or DESCending", "string", false, null, "ASC"),
		              ]

}
exports.listOneSpec = {
		summary : "Get specific Patient",
		path : "/patients/{id}",
		method: "GET",
		type : "Patient",
		nickname : "listOnePatient",
		parameters : [swagger.pathParam("id", "ID of the patient which needs to be fetched", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}

exports.addSpec = {
		summary : "Create Patient",
		path : "/patients",
		method: "POST",
		nickname : "addPatient",
		parameters : [swagger.bodyParam("Patient", "new Patient Record", "Patient")],

}

exports.delSpec = {
		summary : "Delete specific Patient",
		path : "/patients/{id}",
		method: "DELETE",
		nickname : "delPatient",
		parameters : [swagger.pathParam("id", "Patient to delete", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}
exports.updateSpec = {
		summary : "Update specific Patient",
		path : "/patients/{id}",
		method: "PUT",
		nickname : "updatePatient",    
		parameters : [swagger.pathParam("id", "Patient to update", "string"),swagger.bodyParam("Patient", "updated Patient Record", "Patient")],
		responseMessages : [swagger.errors.notFound('id')]

};

exports.models = {
		"Patient":{
			"id": "Patient",
			"required":["dateOfBirth", "doctorId","patientId", "firstDiagnose", "hospital", "name","surname","sex","weight","size","smoker"],
			"properties":{
				"patientId": {
					"type":"integer",
					"format": "int32",
					"description": "Unique Identifier and ID of the corresponding Account"
				},
				"surname": {
					"type":"string",
					"format": "surname",
					"description": "Patients Surname"
				},
				"name": {
					"type":"string",
					"description": "Patient's Name"
				},
				"secondName": {
					"type":"string",
					"description": "Patients second Name"
				},
				"dateOfBirth": {
					"type":"string",
					"format":"date",
					"description": "Date of Birth"
				},				
				"sex": {
					"type":"string",
					"enum": ["0","1"] ,
					"description": "Sex (1 is male)"
				},
				"size": {
					"type":"integer",
					"format": "int32",
					"description": "Patient's Size"
				},
				"weight": {
					"type":"integer",
					"format": "int32",
					"description": "Patients Weight"
				},
				"smoker": {
					"type":"integer",
					"format": "int32",
					"minimum" : "0",
					"maximum" : "2",
					"description": "Smokerstatus (0=nonsmoker,1=smoker,2=ex-smoker)"
				},
				"doctorId": {
					"type":"integer",
					"format" : "int32",
					"description": "Identifier of the Responsible Doctor"
				},
				"firstDiagnose": {
					"type":"string",
					"format":"date",
					"description": "Date of First Diagnoe"
				},
				"hospital": {
					"type":"string",
					"description": "local Hospital"
				},
				"fileNo": {
					"type":"number",
					"format": "int32",
					"description": "File Number"
				},
				"idNumber": {
					"type":"number",
					"format": "int32",
					"description": " - "
				},

				"notes": {
					"type":"string",
					"description": "other Notes"
				},
				"optional": {
					"type":"boolean",
					"description": "[Privatpatient?]"
				},

				"pxy": {
					"type":"integer",
					"format": "int32",
					"description": "Something about Smoking"
				},
				"trial": {
					"type":"string",
					"format": "trial",
					"description": "Something..."
				},
				"refPatient": {
					"type":"string",
					"description": "Legacy Identifier (Access DB)"
				},
			}
		}
}

