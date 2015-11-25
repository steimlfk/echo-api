/**
 * Controller: Accounts
 *
 * Contains Methods to GET and POST to /notifications (list and add)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var ssl = require('../config.js').ssl.useSsl;
var commons = require('./controller_commons.js');


/**
 *  GET /notifications
 *
 *  Steps:
 *  	1) Get DB Connection
 *  	2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	3) create SQL Query from parameters
 *  	4) add links to result
 *  	5) send
 */
exports.list = function(req, res, nextOp){
    var connection = req.con;
    // 3) create SQL Query from parameters
    // set base statement
    var qry = 'SELECT * FROM notifications_view ORDER BY date desc ';

    var pagination = commons.getPaginationInfos(req.query.page, req.query.pageSize);
    qry += pagination.qry;

    //query db
    connection.query(qry, function(err, rows) {
        connection.release();
        if (err) nextOp(err);
        else {
            var fullResult = {
                notifications : []
            };
            if (rows.length > 0){
                var result = [];
                for (var i = 0; i < rows.length; i++){
                    var o  = rows[i];
                    o._links = {};
                    // create link to patients account
                    o._links.patient = {};
                    o._links.patient.href = '/patients/'+rows[i].subjectsAccount;
                    delete o.subjectsAccount;
                    result.push(o);
                }
                fullResult.notifications = result;

                var links = commons.generateCollectionLinks(req.originalUrl.split('?')[0], pagination.page, pagination.pageSize, rows.length);

                fullResult._links = links;
            }
            res.result = fullResult;
            nextOp();
        }
    });
};

/**
 *  POST /notifications
 *  Steps:
 *  	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.add = function(req,res,next){
    var connection = req.con;

    var i = req.body;
    var id = parseInt(i.accountId);
	var aId = parseInt(i.subjectsAccount);
	
    // set date to null if not set
    var date = i.date || null;
    // query db
    connection.query('call notificationCreate(?,?,?,?,?)',
        [id, date, i.type, aId, i.message], function(err, result) {
            connection.release();
            if (err) next(err);
            else {
                res.loc = '/notifications/' + result[0][0].insertId;
                res.modified = result[0][0].modified;
                next();
            }
        });
};

/*
exports.add = function(req, res, next){
    var connection = req.con;
    var qry = 'call reportCreate(?,?, ?,?,?,?,?, ?,?,?, ?,?,?, ?,?,?,?,?,?,?)';
    connection.query(qry, [req.body], function(err, rows) {
        connection.release();
        if (err) next(err);
        else {
            res.loc = '/dummy_loc';
            next();
        }
    });

};
*/

exports.listSpec = {
    summary : "Get All Notifications of the logged-in User",
    notes: "This Function lists all Notifications for the current user. <br> <br><br>" +
    "type 0: You have to fill in your daily report! <br>" +
    "type 1: Call your doctor!<br>" +
    "type 2: Go to hospital!<br>" +
    "type 3: Your patient: %name% should call you!<br>" +
    "type 4: Your patient: %name% is going to hospital!<br>" +
    "type 5: Your patient: %name% has 2 days to fill in a daily report!<br>" +
    "type 6: Your patient: %name% has 10 days to fill in a daily report!<br><br><br>" +

    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " ,
    path : "/notifications",
    method: "GET",
    type : "ListNotification",
    nickname : "listNotifications",
    parameters : [
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")
    ],
    responseMessages : [
        {
            code: 200,
            message: "List of Notifications is supplied. ",
            responseModel : "ListNotifications"
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

exports.addSpec = {
    summary : "Create Notification. (Roles: Patient, Doctor)",
    notes: "This Function creates a new Notification. <br> This function is mostly used for analysis and notification services!  <br><br>" ,
    path : "/notifications",
    method: "POST",
    nickname : "addNotification",
    parameters : [swagger.bodyParam("NewNotification", "new Notification", "NewNotification")],
    responseMessages: [
        {
            code: 201,
            message: "Notification created. Location wont be returned, since it wouldnt be accessable!"
        },
        {
            code: 400,
            message: "The provided data contains errors. ",
            responseModel : "ErrorMsg"
        },
        {
            code: 500,
            message: "Internal Server Error",
            responseModel : "ErrorMsg"
        }
    ]

};

exports.models = {
    "NewNotification":{
        "id" : "Notification",
        "required": ["accountId","date","type"],
        "properties":{
            "accountId":{"type":"integer","format": "int32","description": "Identifier of the Notifications Owner"},
            "date":{"type":"string","format": "Date", "description": "Date and Time of Notification"},
            "type":{"type":"integer","format": "int32","description": "notification type (range 1-6)"},
            "subjectsAccount":{"type":"integer","format": "int32","description": "Patients Account for Doctors Notifications (3,4,5 and 6)"},
			"message":{"type":"string"}
        }
    },
    "Notification":{
        "id" : "Notification",
        "required": ["notificationId","accountId","date","type","message"],
        "properties":{
            "notificationId": {"type":"integer", "format": "int32", "description": "Identifier of the notification"},
            "accountId":{"type":"integer","format": "int32","description": "Identifier of the Notifications Owner"},
            "date":{"type":"string","format": "Date", "description": "Date and Time of Notification"},
            "type":{"type":"integer","format": "int32","description": "notification type (range 1-6)"},
            "message":{"type":"string"}
        }
    },
    "ListNotification":{
        "id":"ListNotification",
        "required": ["notifications"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, notifications : {"type" : "array", items : { "$ref" : "Notification"}}}

    }
};
