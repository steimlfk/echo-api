/**
 * Controller: Accounts
 *
 * Contains Methods to GET and POST to /accounts (list and add)
 * And Methodes to GET, PUT and DELETE /accounts/id (listOne, update and del)
 *
 * Contains swagger specs and models
 *
 * TODO CATCH DELETE ACCOUNT (patients table references accounts table...)
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;
var config = require('../config/config.js');
var bcrypt = require('bcryptjs');
var ssl = require('../config/ssl.js').useSsl;

/*
 *  GET /accounts
 *  
 *  Steps: 
 *  	1) Get DB Connection
 *  	2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	3) create SQL Query from parameters 
 *  	4) add links to result 
 *  	5) send
 */
exports.list = function(req,res,next){
	// 1) Get DB Connection
	db.getConnection(function(err, connection) {
		if (err) {
			next(err);
		} else {
			//2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
			//   Password is "calculated" by function defined in config.js - currently its a concatenation of a given prefix and user id 
			connection.changeUser({user : req.user.accountId, password : config.calculatePW(req.user.accountId)}, function(err) {
					if (err) {
						next(err);
					}
					// 3) create SQL Query from parameters
					// set base statement
					var qry = 'SELECT accountId, username, role, email, enabled, reminderTime, notificationEnabled, notificationMode, mobile FROM accounts_view where enabled = true';

					// extending statement if req.query.role (/accounts?role=<role>) contains a vaild value
					// if its not valid: ignore
					var role = 'none';
					if (req.query.role){
						switch (req.query.role.toLowerCase()){
							case 'admin':{
								qry += " AND role = 'admin'";	role = 'admin';
							}break;
							case 'doctor':{
								qry += " AND role = 'doctor'"; role = 'doctor';
							}break;
							case 'patient':{
								qry += " AND role = 'patient'"; role = 'patient';
							}
						}
					}

					//extending statement if pagination is required (/accounts?page=<page>&pageSize=<pageSize>)
					// default value for page parameter - zero means no pagination
					var page = 0;
					// if no pageSize is given, use default which is 20
					var pageSize = 20;
					// is page parameter present in url? if not ignore pageSize!
					if (req.query.page){
						// parsing given parameter to int to avoid sql injection
						page = parseInt(req.query.page);
						// if parsing failed assume pagination is wanted anyway - use 1
						if (isNaN(page)) page = 1;
						// pageSize given?
						if (req.query.pageSize){
							// parsing given parameter to int to avoid sql injection
							pageSize = parseInt(req.query.pageSize);
							// if parsing failed assume pagination is wanted anyway - use 20
							if (isNaN(pageSize)) pageSize = 20;
						}
						// calculate offset parameter for sql stmt
						var offset = (page*pageSize)-pageSize;
						// extend statement
						qry += ' LIMIT ' + pageSize + ' OFFSET ' + offset;

					}
					// execute query
					connection.query(qry, function(err, rows) {
						if (err) {
							next(err);
						}
						else {
							// is there any result?
							// careful: rows.length > 0 if you execute a "normal" sql statement
							//			 rows[0][0].length > 0 if you execute a SP
							if (rows.length > 0){
								var host = ((ssl)?'https://':'http://')+req.headers.host;
								var result = [];
								// add "self" to all resources
								for (var i = 0; i < rows.length; i++){
									var o  = rows[i];
									o._links = {};
									o._links.self = {};
									o._links.self.href = host+'/accounts/'+rows[i].accountId;
									result.push(o);
								}
								// add pagination links to result set if pagination was used
								if(req.query.page){
									var links = {};
									// create "first" link
									var first = host+'/accounts?page=1&pageSize='+pageSize;
									// if role-filtering was used, add it to the link
									if  (role != 'none') first += '&role='+role;
									links.first = first;
									// create "next" link
									if (rows.length == pageSize) {
										var next = host+'/accounts?page='+(page+1)+'&pageSize='+pageSize;
										// if role-filtering was used, add it to the link
										if  (role != 'none') next += '&role='+role;
										links.next = next
									}
									// create back link
									if (page != 1){
										var back = host+'/accounts?page='+(page-1)+'&pageSize='+pageSize;
										// if role-filtering was used, add it to the link
										if  (role != 'none') back += '&role='+role;
										links.back = back
									}
									// send complete result set with pagination links
									res.send({'accounts' : result, '_links' : links});

								}
								// send complete result set without links
								else res.send({'accounts' : result});

							}
							else{
								// result set from db was empty (should happen - because the own account should always be visbile)
								res.statusCode = 204;
								res.send();
							}
						}
						connection.release();
					});
				}
			)}
	});
};


/*
 *  GET /accounts/id
 *    Steps: 
 *  	1) Get DB Connection
 *  	2) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	3) create SQL Query from parameters 
 *  	4) add links to result 
 *  	5) send
 */
exports.listOne = function(req,res,next){
	// 1) Get DB Connection from pool
	db.getConnection(function(err, connection) {
		if (err) {
			next(err);
		} else {
			//2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
			//   Password is "calculated" by function defined in config.js - currently its a concatenation of a given prefix and user id 
			connection.changeUser({user : req.user.accountId, password : config.calculatePW(req.user.accountId)}, function(err) {
				if (err) {
					next(err);
				}
				// 3) create SQL Query from parameters 
				var qry = 'SELECT accountId, username, role, email, enabled, reminderTime, notificationEnabled, notificationMode, mobile FROM accounts_view where accountId = ?';
				var id = req.params.id;
				// query db 
				// ? from query will be replaced by values in [] - including escaping!
				connection.query(qry, [id], function(err, rows) {
					// error while querying db
					if (err) {
						res.statusCode = 500;
						res.send({err: 'Internal Server Error'});
					}

					var host = ((ssl)?'https://':'http://')+req.headers.host;
					// is there any result?
					// careful: rows.length > 0 if you execute a "normal" sql statement
					//			 rows[0][0].length > 0 if you execute a SP
					if (rows.length > 0){
						// create self link
						var o  = rows[0];
						o._links = {};
						o._links.self = {};
						o._links.self.href = host+'/accounts/'+rows[0].accountId;

						res.send(o);
					}
					// result set is empty
					else{
						res.statusCode = 404;
						res.send();
					}
					connection.release();
				});
			});
		}
	});
};

/*
 *  POST /accounts
 *  Steps: 
 *  	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.add = function(req,res,next){
	var host = ((ssl)?'https://':'http://')+req.headers.host;
	// 2) Get DB Connection
	db.getConnection(function(err, connection) {
		if (err) {
			next(err);
		} else {
			//3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
			//   Password is "calculated" by function defined in config.js - currently its a concatenation of a given prefix and user id
			connection.changeUser({user : req.user.accountId, password : config.calculatePW(req.user.accountId)}, function(err) {
				if (err) {
					next(err);
				}
				// 4) create SQL Query from parameters
				var i = req.body;
				// make NotificationMode and role lower case so the db triggers can validate the value
				var mode = i.notificationMode.toLowerCase();
				var role = i.role.toLowerCase();
				// hash pwd
				var salt = bcrypt.genSaltSync(10);
				var pwd = bcrypt.hashSync(i.password, salt);
				// query db
				// ? from query will be replaced by values in [] - including escaping!
				connection.query('CALL accountsCreate(?,?,?,?,?,?, ?,?,?,?)' ,
					[config.db_pw_prefix, i.username,pwd, i.email, role, i.enabled, i.reminderTime, i.notificationEnabled,
						mode, i.mobile], function(err, result) {
						if (err) {
							connection.release();
							next(err);
						} else {
							// Since the SP accountsCreate created a new db user, rights have to be set for this new user
							connection.query('CALL grantRolePermissions(?, ?)' , [parseInt(result[0][0].location), i.role], function(err, resu) {
								if (err) {
									// Something went wrong - shouldnt happen
									// future TODO: implement rollback which deletes the created account and the created db user
									console.error('Query error on grant rights POST /accounts: ',err);
									res.statusCode = 500;
									res.send({err: 'Internal Server Error'});
								}
								else {
									// account and db user created. 
									res.statusCode = 201;
									res.location('/accounts/' + result[0][0].location);
									res.send();
								}
								connection.release();
							});
						}
					});
			});
		}
	});

};


/*
 *  DELETE /accounts/id
 *  Steps: 
 *  	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create and execute SQL Query from parameters 
 *  	5) add links to result 
 *  	6) send
 */
exports.del =   function(req,res,next){

	var host = ((ssl)?'https://':'http://')+req.headers.host;
	// 2) Get DB Connection
	db.getConnection(function(err, connection) {
		if (err) {
			next(err);
		} else {
			//3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
			//   Password is "calculated" by function defined in config.js - currently its a concatenation of a given prefix and user id
			connection.changeUser({user : req.user.accountId, password : config.calculatePW(req.user.accountId)}, function(err) {
				if (err) {
					next(err);
				}
				// 4) create and execute SQL Query from parameters,
				// ? from query will be replaced by values in [] - including escaping!
				connection.query('CALL accountsDelete(?)', [req.params.id], function(err, result) {
					if (err){
						// An error occured
						console.error('Query error on DELETE /accounts: ',err);
						res.statusCode = 500;
						res.send({err: 'Internal Server Error'});
					}
					else {
						// Account was removed
						if (result[0][0].affected_rows > 0){
							res.statusCode = 204;
							res.send();
						}
						else {
							// Account wasnt removed since it doesnt exist or isnt visible to the user
							res.statusCode = 404;
							res.send();
						}
					}
					connection.release();
				});
			});
		}
	});

};

/*
 *  PUT /accounts/id
 *  Steps: 
 *  	1) Get DB Connection
 *  	2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	3) create SQL Query from parameters 
 *  	4) add links to result 
 *  	5) send
 */
exports.update = function(req,res,next){
	var host = ((ssl)?'https://':'http://')+req.headers.host;
	// 1) Get DB Connection
	db.getConnection(function(err, connection) {
		if (err) {
			next(err);
		} else {
			//2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
			//   Password is "calculated" by function defined in config.js - currently its a concatenation of a given prefix and user id 
			connection.changeUser({user : req.user.accountId, password : config.calculatePW(req.user.accountId)}, function(err) {
				if (err) {
					next(err);
				}
				// 3) create SQL Query from parameters 
				var i = req.body;
				// password given? if no pw is given the SP wont change it! (SP checks if value is null)
				var pwd = null;
				if (i.password != null && i.password != ""){
					var salt = bcrypt.genSaltSync(10);
					pwd = bcrypt.hashSync(i.password, salt);
				}
				// make NotificationMode lower case so the db triggers can validate the value
				var mode = i.notificationMode.toLowerCase();
				// execute query
				// ? from query will be replaced by values in [] - including escaping!
				// any value for accountId given in the body will be ignored!
				connection.query('CALL accountsUpdate(?,?,?,?, ?,?,?,?)' , [req.params.id, i.username, pwd, i.email, i.reminderTime, i.notificationEnabled, mode, i.mobile], function(err, result) {
					if (err) {
						next(err);
					} else {
						// Account was updated
						if (result[0][0].affected_rows > 0){
							res.statusCode = 204;
							res.send();
						}
						else {
							// Account wasnt updated since it doesnt exist or isnt visible to the user
							res.statusCode = 404;
							res.send();
						}
					}
					connection.release();
				});
			});
		}
	});
};

/**
 *  Swagger Specs used to describe the functions via swagger ui
 */
exports.listSpec = {
		summary : "List all visible Accounts (Roles: all)",
		notes: "This Function lists all Accounts which are visible to the logged in user and are enabled. <br>This function constructs a sql query from the parameters and executes it on accounts_view. <br><br> <b>Parameters:</b> <br><br>  " +
		"<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " +
		"To support pagination the following links are supplied, if page is greater than zero:  <br>" +
		"_links: { <br>" +
		"self: (link to this collection) <br>" +
		"first: (link to first page of collection) <br>" +
		"next: (link to next page of the collection, if result size not equals pageSize) <br>" +
		"back: (link to previous page of the collection, if page is greater than 1) <br>" +
		"} <br> <br>" +
		"<b>Rolefilter</b>: If a valid role is provided the result, only contains accounts of this role. If the role is not valid, the parameter is ignored.<br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>200</b>  Accountlist is supplied. Format accounts: [Array of Account Model] <br>" +
		" <b>204</b>  List (or the current page) is currently empty <br>" +
		" <b>500</b> Internal Server Error",
		path : "/accounts",
		method: "GET",
		type : "Account",
		nickname : "listAccounts",
		parameters : [
		              swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
		              swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20"),
		              swagger.queryParam("role", "Rolefiltering", "string", false, ["admin","doctor", "patient"])
		              ]

};
exports.listOneSpec = {
		summary : "Get specific Account (Roles: all)",
		notes: "This Function returns the requested Account, if it exists and is visible to the current user. <br>This function constructs a sql query from the parameters and executes it on accounts_view. <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>200</b>  Account is supplied <br>" +
		" <b>404</b>  The requested account doesnt exist or the current user isnt allowed to view it. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/accounts/{id}",
		method: "GET",
		type : "Account",
		nickname : "listOneAccount",
		parameters : [swagger.pathParam("id", "ID of the Account which needs to be fetched", "string")]

};
exports.addSpec = {
		summary : "Create Account (Roles: admin and doctor)",
		path : "/accounts",
		notes: "This Function creates an new Account. <br>This function passes its parameters to the SP accountsCreate <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>201</b>  Account is created and the location is returned in the Location Header <br>" +
		" <b>400</b>  The provided data contains errors, e.g. Username or EMail are not unique or Invalid Value of NotificationMode or Role <br>" +
		" <b>403</b>  The logged in user isnt allowed to create an account with this data. Possibile Reason: A doctor is only allowed to create a new patient.<br>"+
		" <b>500</b> Internal Server Error",
		method: "POST",
		nickname : "addAccount",
		parameters : [swagger.bodyParam("Account", "new Account", "NewAccount")]

};

exports.delSpec = {
		summary : "Delete specific Account (Roles: admin)",
		notes: "This Function disables an Account, which is specified by the url.  <br>This function passes its parameters to the SP accountsDisable <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>204</b>  Account was disabled. <br>" +
		" <b>404</b>  Account is either not visible to the current user or doesnt exist. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/accounts/{id}",
		method: "DELETE",
		nickname : "delAccount",
		parameters : [swagger.pathParam("id", "Account to delete", "string")]

};

exports.updateSpec = {
		summary : "Update specific Account (Roles: all)",
		notes: "This Function updates an Account, which is specified by the url. The accountId in the Message Body is ignored. <br>This function passes its parameters to the SP accountsUpdate <br><br>" +
		"<b>Possible Results</b>: <br>" +
		" <b>204</b>  Account was updated. <br>" +
		" <b>400</b>  Account cant be updated using the provided data. Possible Reasons: Username or EMail are not unique or Invalid Value of NotificationMode or Role <br>" +
		" <b>403</b>  The current user isnt allowed to alter the specified account. <br>" +
		" <b>500</b> Internal Server Error",
		path : "/accounts/{id}",
		method: "PUT",
		nickname : "updateAccount",
		parameters : [swagger.pathParam("id", "Account to update", "string"),swagger.bodyParam("Account", "updated Account Record", "Account")]
};


/*
 *  Swagger Models
 */
exports.models = {
		"Account":{
			"id":"Account",
			"required": ["accountId","username", "role", "email", "enabled", "reminderTime", "notificationEnabled", "notificationMode","mobile"],
			"properties":{
				"accountId":{
					"type":"integer",
					"format": "int64",
					"description": "Unique Identifier"
				},
				"username":{
					"type": "string",
					"description" : "Unique Username"
				},
				"password":{
					"type":"string",
					"description": "Password"
				},
				"role":{
					"type":"string",
					"description" : "Role",
					"enum":[  "admin", "doctor",  "patient" ]
				},
				"email":{
					"type": "string",
					"description" : "E-Mail Address"
				},
				"enabled":{
					"type": "boolean",
					"description" : "can this account login?"
				},
				"reminderTime":{
					"type": "string",
					"description" : "Reminder Time (Format: 'HH:MM')"
				},
				"notificationEnabled":{
					"type": "boolean",
					"description" : "Notifications enabled?"
				},
				"notificationMode":{
					"type":"string",
					"description" : "Notification Mode",
					"enum":[  "sms",  "push",  "email" ]
				},
				"mobile":{
					"type": "string",
					"description" : "Mobile Number"
				}
			}
		},
		"NewAccount":{
			"id":"Account",
			"required": ["role", "username","password","email", "enabled", "reminderTime", "notificationEnabled", "notificationMode","mobile"],
			"properties":{
				"username":{
					"type": "string",
					"description" : "Unique Username"
				},
				"password":{
					"type":"string",
					"description": "Password"
				},
				"role":{
					"type":"string",
					"description" : "Role",
					"enum":["admin", "doctor", "patient" ]
				},
				"email":{
					"type": "string",
					"description" : "E-Mail Address"
				},
				"enabled":{
					"type": "boolean",
					"description" : "can this account login?"
				},
				"reminderTime":{
					"type": "string",
					"description" : "Reminder Time (Format: 'HH:MM')"
				},
				"notificationEnabled":{
					"type": "boolean",
					"description" : "Notifications enabled?"
				},
				"notificationMode":{
					"type":"string",
					"description" : "Notification Mode",
					"enum":[ "sms", "push",  "email" ]
				},
				"mobile":{
					"type": "string",
					"description" : "Mobile Number"
				}
			}
		}
};

