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
var config = require('../config.js');
var utils = require('../utils.js');
var async = require('async');
var commons = require('./controller_commons.js');

/**
 *  GET /accounts
 */
exports.list = function(req,res,nextOp){
    var connection = req.con;
    // 3) create SQL Query from parameters
    // set base statement
    var qry = 'SELECT accountId, username, role, email, enabled, reminderTime, notificationEnabled, notificationMode, mobile, modified FROM accounts_view where enabled = true';

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

    var pagination = commons.getPaginationInfos(req.query.page, req.query.pageSize);
    qry += pagination.qry;

    // execute query
    connection.query(qry, function(err, rows) {
        connection.release();
        if (err) {
            // renamed next to nextOp since next wasnt visible here...
            nextOp(err);
        }
        else {
            var fullResult = {
                accounts: []
            };
            // is there any result?
            // careful: rows.length > 0 if you execute a "normal" sql statement
            //			 rows[0][0].length > 0 if you execute a SP
            if (rows.length > 0){
                var result = [];
                // add "self" to all resources
                for (var i = 0; i < rows.length; i++){
                    var o  = rows[i];
                    o._links = {};
                    o._links.self = {};
                    o._links.self.href = '/accounts/'+rows[i].accountId;
                    result.push(o);
                }
                fullResult.accounts = result;

                var links = commons.generateCollectionLinks(req.originalUrl.split('?')[0],pagination.page, pagination.pageSize, rows.length);
                if  (role != 'none') {
                    if (links.self) links.self += '&role='+role;
                    if (links.first) links.first += '&role='+role;
                    if (links.next) links.next += '&role='+role;
                    if (links.back) links.back += '&role='+role;
                }

                fullResult._links = links;

            }
            res.result = fullResult;
            nextOp();
        }
    });
};


/**
 *  GET /accounts/id
 */
exports.listOne = function(req,res,next){
    var connection = req.con;
    // 3) create SQL Query from parameters
    var qry = 'SELECT accountId, username, role, email, enabled, reminderTime, notificationEnabled, notificationMode, mobile, modified FROM accounts_view where accountId = ?';
    var id = req.params.id;
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query(qry, [id], function(err, rows) {
        connection.release();
        // error while querying db
        if (err) next(err);
        else {
            var fullResult = {};
            // is there any result?
            // careful: rows.length > 0 if you execute a "normal" sql statement
            //			 rows[0][0].length > 0 if you execute a SP
            if (rows.length > 0) {
                // create self link
                var o = rows[0];
                o._links = {};
                o._links.self = {};
                o._links.self.href = '/accounts/' + rows[0].accountId;

                fullResult = o;
            }
            // result set is empty
            res.result = fullResult;
            next();
        }

    });
};

/**
 *  POST /accounts
 */
exports.add = function(req,res,next){
    var connection = req.con;

    // 4) create SQL Query from parameters
    var i = req.body;
    // make NotificationMode and role lower case so the db triggers can validate the value
    var mode = i.notificationMode.toLowerCase();
    var role = i.role.toLowerCase();

    async.parallel([
        function (cb) {
            utils.cryptPassword(i.password, cb);
        },
        function (cb) {
            connection.query('CALL accountsCreate(?,?,?,?,?,?, ?,?,?,?)' ,
                [config.db_pw_prefix, i.username," ", i.email, role, i.enabled, i.reminderTime, i.notificationEnabled, mode, i.mobile], cb);
        }
    ], function (err, result){
        if (err) {
            connection.release();
            next(err);
        } else {
            var newId = result[1][0][0][0].location;
            connection.changeUser({user: 'echo_db_usr', password: config.db.pwd}, function (err){
                async.parallel([
                    function(cb){
                        connection.query('UPDATE accounts SET password = ? WHERE accountId = ?' , [result[0], newId], cb);
                    },
                    function(cb){
                        connection.query('CALL grantRolePermissions(?, ?)' , [newId, i.role], cb);
                    }
                ], function(err, res0){
                    connection.release();
                    if (err) {
                        // Something went wrong - shouldnt happen
                        // future TODO: implement rollback which deletes the created account and the created db user
                        next(err);
                    }
                    else {
                        // account and db user created.
                        res.loc = '/accounts/' + newId;
                        res.modified = result[1][0][0][0].modified;
                        next();
                    }
                });
            });
        };
    });
};


/**
 *  DELETE /accounts/id
 */
exports.del = function(req,res,next){
    var connection = req.con;

    // 4) create and execute SQL Query from parameters,
    // ? from query will be replaced by values in [] - including escaping!
    connection.query('CALL accountsDelete(?)', [req.params.id], function(err, result) {
        connection.release();
        if (err) next(err);
        else {
            res.affectedRows = result[0][0].affected_rows;
            next();
        }
    });
};

/**
 *  PUT /accounts/id
 */
exports.update = function(req,res,next){
    var connection = req.con;

    // 3) create SQL Query from parameters
    var i = req.body;
    // password given? if no pw is given the SP wont change it! (SP checks if value is null)
    var pwd = null;
    if (i.password != null && i.password != ""){
        pwd = utils.cryptPasswordSync(i.password);
    }
    // make NotificationMode lower case so the db triggers can validate the value
    var mode = i.notificationMode.toLowerCase();
    // execute query
    // ? from query will be replaced by values in [] - including escaping!
    // any value for accountId given in the body will be ignored!
    connection.query('CALL accountsUpdate(?,?,?,?, ?,?,?,?, ?)', [req.params.id, i.username, pwd, i.email, i.reminderTime, i.notificationEnabled, mode, i.mobile, i.enabled], function (err, result) {
        connection.release();
        if (err) next(err);
        else {
            res.affectedRows = result[0][0].affected_rows;
            next();
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
    "<b>Rolefilter</b>: If a valid role is provided the result, only contains accounts of this role. If the role is not valid, the parameter is ignored." ,
    path : "/accounts",
    method: "GET",
    type : "ListAccount",
    nickname : "listAccounts",
    parameters : [
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20"),
        swagger.queryParam("role", "Rolefiltering", "string", false, ["admin","doctor", "patient"])
    ],
    responseMessages: [
        {
            code: 200,
            message: "Accountlist is supplied.",
            responseModel : "ListAccount"
        },
        {
            code: 204,
            message: "List (or the current page) has no items"
        },
        {
            code: 500,
            message: "Internal Server Error",
            responseModel : "ErrorMsg"
        }
    ]
};
exports.listOneSpec = {
    summary : "Get specific Account (Roles: all)",
    notes: "This Function returns the requested Account, if it exists and is visible to the current user. <br>This function constructs a sql query from the parameters and executes it on accounts_view. ",
    path : "/accounts/{id}",
    method: "GET",
    type : "Account",
    nickname : "listOneAccount",
    parameters : [swagger.pathParam("id", "ID of the Account which needs to be fetched", "string")],
    responseMessages: [
        {
            code: 200,
            message: "Account is supplied.",
            responseModel : "Account"
        },
        {
            code: 404,
            message: "The requested account doesnt exist or the current user isnt allowed to view it."
        },
        {
            code: 500,
            message: "Internal Server Error",
            responseModel : "ErrorMsg"
        }
    ]

};
exports.addSpec = {
    summary : "Create Account (Roles: admin and doctor)",
    path : "/accounts",
    notes: "This Function creates an new Account. <br>This function passes its parameters to the SP accountsCreate",
    method: "POST",
    nickname : "addAccount",
    parameters : [swagger.bodyParam("Account", "new Account", "NewAccount")],
    responseMessages: [
        {
            code: 201,
            message: "Account is created and the location is returned in the Location Header"
        },
        {
            code: 400,
            message: "The provided data contains errors, e.g. Username or EMail are not unique or Invalid Value of NotificationMode or Role ",
            responseModel : "ErrorMsg"
        },
        {
            code: 401,
            message: "The logged-in user isnt allowed to use this function ",
            responseModel : "ErrorMsg"
        },        
        {
            code: 403,
            message: "The logged in user isnt allowed to create an account with this data. Possibile Reason: A doctor is only allowed to create a new patient.",
            responseModel : "ErrorMsg"
        },
        {
            code: 500,
            message: "Internal Server Error",
            responseModel : "ErrorMsg"
        }
    ]

};

exports.delSpec = {
    summary : "Delete specific Account (Roles: admin)",
    notes: "This Function disables an Account, which is specified by the url.  <br>This function passes its parameters to the SP accountsDisable",
    path : "/accounts/{id}",
    method: "DELETE",
    nickname : "delAccount",
    parameters : [swagger.pathParam("id", "Account to delete", "string")],
    responseMessages: [
        {
            code: 204,
            message: "Account was deletedr",
            responseModel : "Account"
        },
        {
            code: 401,
            message: "The logged-in user isnt allowed to use this function ",
            responseModel : "ErrorMsg"
        },
        {
            code: 404,
            message: "The requested account doesnt exist or the current user isnt allowed to view it."
        },
        {
            code: 500,
            message: "Internal Server Error",
            responseModel : "ErrorMsg"
        }
    ]

};

exports.updateSpec = {
    summary : "Update specific Account (Roles: all)",
    notes: "This Function updates an Account, which is specified by the url. The accountId in the Message Body is ignored. <br>This function passes its parameters to the SP accountsUpdate",
    path : "/accounts/{id}",
    method: "PUT",
    nickname : "updateAccount",
    parameters : [swagger.pathParam("id", "Account to update", "string"),swagger.bodyParam("Account", "updated Account Record", "UpdateAccount")],
    responseMessages: [
        {
            code: 204,
            message: "Account was updated",
            responseModel : "Account"
        },
        {
            code: 400,
            message: " Account cant be updated using the provided data. Possible Reasons: Username or EMail are not unique or Invalid Value of NotificationMode or Role ",
            responseModel : "ErrorMsg"
        },
        {
            code: 403,
            message: "The current user isnt allowed to alter the specified account.",
            responseModel : "ErrorMsg"
        },
        {
            code: 500,
            message: "Internal Server Error",
            responseModel : "ErrorMsg"
        }
    ]
};


/**
 *  Swagger Models
 */

var contents =  {
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
};

exports.models = {
    "Account":{
        "id":"Account",
        "required": ["accountId","username", "role", "email", "enabled", "reminderTime", "notificationEnabled", "notificationMode","mobile"],
        "properties": contents
    },
    "NewAccount":{
        "id":"Account",
        "required": ["role", "username","password","email", "enabled", "reminderTime", "notificationEnabled", "notificationMode","mobile"],
        "properties": contents

    },
    "UpdateAccount":{
        "id":"Account",
        "required": ["username", "email", "enabled", "reminderTime", "notificationEnabled", "notificationMode","mobile"],
        "properties": contents

    },
    "ListAccount":{
        "id":"ListAccount",
        "required": ["accounts"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, accounts :  {"type" : "array", items : { "$ref" : "Account"}}}

    }
};

