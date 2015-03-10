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
exports.list = function(req, res, next){
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
        if (err) {
            next(err);
        }
        else {
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
                var links;
                // add pagination links to result set if pagination was used
                if(page != 0){
                    links = {};

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
                }
                // send result
                var ret = {};
                ret.notifications = result;
                if(page != 0) ret._links = links;
                res.send(ret);
            }
            else{
                // no notifiactions found
                res.statusCode = 204;
                res.send();
            }
        }
        connection.release();
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
        if (err) {
            next(err);
        }
        else {
            res.statusCode = 201;
            res.send();
        }
        connection.release();
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

    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " +
    "To support pagination the following links are supplied, if page is greater than zero:  <br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>200</b>  List of Patients is supplied. Format accounts: [Array of Notifications Model] <br>" +
    " <b>204</b>  List (or the current page) is currently empty <br>" +
    " <b>500</b> Internal Server Error",
    path : "/notifications",
    method: "GET",
    type : "ListNotification",
    nickname : "listNotifications",
    parameters : [
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")
    ]

};

exports.addSpec = {
    summary : "Create Notification. DEBUG PURPOSES! (Roles: Any)",
    notes: "This Function creates a new Notification. <br>Since the Analysispart isnt implemented yet you can create Notifications here!  <br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>201</b>  Notification created. Location wont be returned, since it wouldnt be accessable! <br>" +
    " <b>400</b>  The provided data contains errors. <br>" +
    " <b>500</b> Internal Server Error",
    path : "/notifications",
    method: "POST",
    nickname : "addNotification",
    parameters : [swagger.bodyParam("NewNotification", "new Notification", "NewNotification")]

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
