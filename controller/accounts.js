/**
 * Route: Account
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;

exports.list = function(req,res,next){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on GET /accounts: ',err);
			res.send(503);
		} else {
			var qry = 'SELECT * FROM accounts';
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
					console.error('Query error on GET /accounts: ',err);
					return res.send(500);
				}
				if (rows.length > 0){
					res.send({'accounts' : rows});
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
			console.error('DB Connection error on GET single accounts: ',err);
			res.send(503);
		} else {
			connection.query('SELECT * FROM accounts where accountId='+req.params.id, function(err, rows, fields) {
				if (err) {
					console.error('Query error on GET single accounts: ',err);
					return res.send(500);
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
			console.error('DB Connection error on POST new accounts: ',err);
			res.send(503);
		} else {
			connection.query('INSERT INTO accounts SET ?', req.body, function(err, result) {
				if (err) {
					console.error('Query error on POST /accounts: ',err);
					return res.send(500);
				} else {
					res.statusCode = 201;
					res.location('/accounts/' + result.insertId);
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
			console.error('DB Connection error on DELETE accounts: ',err);
			res.send(503);
		} else {
			connection.query('DELETE FROM accounts WHERE accountId = ?', req.params.id, function(err, result) {
				if (err){ 
					console.error('Query error on DELETE /accounts: ',err);
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
			console.error('DB Connection error on PUT accounts: ',err);
			res.send(503);
		} else {
			
			connection.query('UPDATE accounts SET ? WHERE accountId = '+connection.escape(req.params.id), req.body, function(err, result) {
				if (err) {
					console.error('Query error on PUT single accounts: ',err);
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
		summary : "List All Accounts",
		path : "/accounts",
		method: "GET",
		type : "Account",
		nickname : "listAccounts",
		parameters : [
		              swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
		              swagger.queryParam("pageSize", "Page Size for Pagnination. Default is 20", "string", false, null, "20"),
		              swagger.queryParam("sortBy", "Name of the Column to sort after", "string"),
		              swagger.queryParam("order", "ASCending or DESCending", "string", false, null, "ASC"),
		              ]

}
exports.listOneSpec = {
		summary : "Get specific Account",
		path : "/accounts/{id}",
		method: "GET",
		type : "Account",
		nickname : "listOneAccount",
		parameters : [swagger.pathParam("id", "ID of the Account which needs to be fetched", "string")],
		responseMessages : [swagger.errors.notFound('id')]

}
exports.addSpec = {
		summary : "Create Account",
		path : "/accounts",
		method: "POST",
		nickname : "addAccount",
		parameters : [swagger.bodyParam("Account", "new Account", "NewAccount")]

}

exports.delSpec = {
		summary : "Delete specific Account",
		path : "/accounts/{id}",
		method: "DELETE",
		nickname : "delAccount",
			parameters : [swagger.pathParam("id", "Account to delete", "string")],
			responseMessages : [swagger.errors.notFound('id')]

}

exports.updateSpec = {
		summary : "Update specific Account",
		path : "/accounts/{id}",
		method: "PUT",
		nickname : "updateAccount",
		parameters : [swagger.pathParam("id", "Account to update", "string"),swagger.bodyParam("Account", "updated Account Record", "NewAccount")],
		responseMessages : [swagger.errors.notFound('id')]
};

exports.models = {
		"Account":{
			"id":"Account", 
			"required": ["accountId", "username", "password", "role", "email"],
			"properties":{
				"accountId":{
					"type":"integer",
					"format": "int64",
					"description": "Unique Identifier",
				},
				"username":{
					"type":"string",
					"description": "Username"
				}, 
				"password":{
					"type":"string",
					"description": "Password"
				},
				"role":{
					"type":"string",
					"description" : "Role",
					"enum":[
					        "admin",
					        "doctor",
					        "patient"
					        ]
				},
				"email":{
					"type": "string",
					"description" : "E-Mail Address",
				}
			}
		},
		"NewAccount":{
			"id":"Account", 
			"required": ["username", "password", "role", "email"],
			"properties":{
				"username":{
					"type":"string",
					"description": "Username"
				}, 
				"password":{
					"type":"string",
					"description": "Password"
				},
				"role":{
					"type":"string",
					"description" : "Role",
					"enum":[
					        "admin",
					        "doctor",
					        "patient"
					        ]
				},
				"email":{
					"type": "string",
					"description" : "E-Mail Address",
				}
			}
		}
}

exports.listDoctors = function(req,res,next){
	db.getConnection(function(err, connection) {
		if (err) {
			console.error('DB Connection error on GET doctors accounts: ',err);
			res.send(503);
		} else {
			connection.query('SELECT accountId, username, email FROM accounts where role=\'doctor\'', function(err, rows) {
				if (err) {
					console.error('Query error on GET doctors accounts: ',err);
					return res.send(500);
				}
				if (rows.length > 0){
					res.send(rows);
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