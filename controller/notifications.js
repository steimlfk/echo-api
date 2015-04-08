/**
 * Controller: Accounts
 *
 * Contains Methods to GET and POST to /notifications (list and add)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var ssl = require('../config.js').ssl.useSsl;

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
    var qry = 'SELECT * FROM notifications_view ORDER BY date desc';

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
    //query db
    connection.query(qry, function(err, rows) {
        connection.release();
        if (err) nextOp(err);
        else {
            var fullResult = {
                notifications : []
            };
            if (rows.length > 0){
                var host = ((ssl)?'https://':'http://')+req.headers.host;
                var result = [];
                for (var i = 0; i < rows.length; i++){
                    var o  = rows[i];
                    o._links = {};
                    // create link to patients account
                    o._links.patient = {};
                    o._links.patient.href = host+'/patients/'+rows[i].subjectsAccount;
                    delete o.subjectsAccount;
                    result.push(o);
                }
                fullResult.notifications = result;

                // add pagination links to result set if pagination was used
                if(page != 0){
                    var links = {};
                    //create first link
                    var first = host+'/notifications?page=1&pageSize='+pageSize;
                    links.first = first;
                    if (rows[0].length == pageSize) {
                        // create next link if result set size equals pagesize
                        var next = host+'/notifications?page='+(page+1)+'&pageSize='+pageSize;
                        links.next = next
                    }
                    if (page != 1){
                        // create back link if page number doenst equal 1
                        var back = host+'/notifications?page='+(page-1)+'&pageSize='+pageSize;
                        links.back = back
                    }
                    fullResult._links = links;
                }
            }
            res.result = fullResult;
            nextOp();
        }
    });
};

/**
 *  POST /notifications
 *
 *  Since this is a debug function it only stores the request body in the database

 */
exports.add = function(req, res, next){
    var connection = req.con;
    var qry = 'INSERT INTO notifications SET ?';
    connection.query(qry, [req.body], function(err, rows) {
        connection.release();
        if (err) next(err);
        else {
            res.loc = '/dummy_loc';
            next();
        }
    });

};

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
    summary : "Create Notification. DEBUG PURPOSES! (Roles: Any)",
    notes: "This Function creates a new Notification. <br>Since the Analysispart isnt implemented yet you can create Notifications here!  <br><br>" ,
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
            "subjectsAccount":{"type":"integer","format": "int32","description": "Patients Account for Doctors Notifications (3,4,5 and 6)"}
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
