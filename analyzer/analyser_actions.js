/**
 * Controller: A
 *
 * Contains Methods to GET to /analyserOperators (list)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var ssl = require('../config.js').ssl.useSsl;
var commons = require('./../controller/controller_commons.js');

/**
 *  GET /analyserOperators
 *
 *  Steps:
 *  	1) Get DB Connection
 *  	2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	3) create SQL Query from parameters
 *  	4) add links to result
 *  	5) send
 */
exports.list = function(req, res, next1){
    var connection = req.con;
    // query
    var qry = 'SELECT * FROM analyserNotification_view ORDER BY notifyId ASC ';
    
    var pagination = commons.getPaginationInfos(req.query.page, req.query.pageSize);
    qry += pagination.qry;
	
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query(qry, function(err, rows) {
        connection.release();
        if (err) next1(err);
        else {
            var fullResult = {
                AnalyserNotifications : []
            };
            if (rows.length > 0){
                var result = [];
                for (var i = 0; i < rows.length; i++){
                    var o  = rows[i];
                    o._links = {};
                    o._links.event = {};
                    o._links.event.href = '/analyse/options/notifications/'+rows[i].notifyId;
                    result.push(o);
                }
                fullResult.AnalyserNotifications = result;

                var links = commons.generateCollectionLinks(req.originalUrl.split('?')[0], pagination.page, pagination.pageSize, rows.length);

                fullResult._links = links;
            }
            res.result = fullResult;
            next1();
        }
    });
};

exports.listSpec = {
    summary : "Get All Analyser Notifications of the logged-in User",
    notes: "This Function lists all Analyser Notifications for the current user. <br> <br><br>" +

    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " ,
    path : "/analyse/options/notifications",
    method: "GET",
    type : "ListAnalyserNotifications",
    nickname : "listAnalyserNotifications",
    parameters : [
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")
    ],
    responseMessages : [
        {
            code: 200,
            message: "List of Analyser Notifications is supplied. ",
            responseModel : "ListAnalyserNotifications"
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

exports.models = {
    "AnalyserNotification":{
        "id" : "AnalyserNotification",
        "required": ["eventId","eventName","eventFunction"],
        "properties":{
            "notifyId": {"type":"integer", "format": "int32", "description": "Identifier of the notification"},
            "actionName": {"type":"string","format": "Operator", "description": "Description of the notification"},
			"actionFunction": {"type":"string","format": "Operator", "description": "Function name of the notification"}
        }
    },
    "ListAnalyserNotifications":{
        "id":"ListAnalyserNotifications",
        "required": ["AnalyserNotification"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, AnalyserNotification : {"type" : "array", items : { "$ref" : "AnalyserNotification"}}}

    }
};