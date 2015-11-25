/**
 * Controller: Data Mining - Days Exacerbation
 *
 * Contains Methods to GET and POST to /patients/id/daily_reports (list and add)
 * And Methodes to GET, PUT and DELETE  /patients/id/daily_reports/recordid (listOne, update and del)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var ssl = require('../config.js').ssl.useSsl;
var commons = require('./../controller/controller_commons.js');

/**
 *  GET /patients/id/daily_reports/recordid
 *    Steps:
 *      1) Validate Role
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.listOne = function(req,res,next){
    var connection = req.con;
    var id = req.params.id;
    var qry = 'call daysExacerbationListOne(?)';
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query(qry,[id], function(err, rows) {
        connection.release();
        if (err) next(err);
        else {
            var fullResult = {};
            // is there any result?
            if (rows[0].length > 0){
                var o  = rows[0][0];
                o._links = {};
                // create self link
                o._links.self = {};
                o._links.self.href = '/analyse/dataMining/daysExacerbation/daily_report/'+rows[0][0].dailyReportId;
                fullResult = o;
            }
            res.result = fullResult;
            next();
        }
    });
};


var commons = require('./../controller/controller_commons');
var respMessages = commons.respMsg("daysExacerbation");
exports.listOneSpec = {
    summary : "Get specific data report for given daily report id (Roles: doctor and admin)",
    path : "/analyse/dataMining/daysExacerbation/daily_report/{id}",
    notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP reportListOne. <br><br>" ,
    method: "GET",
    type : "DailyReport",
    nickname : "listOneDaysExacerbation",
    parameters : [swagger.pathParam("id", "ID of daily report", "string")],
    responseMessages: respMessages.listOne
};

var contents = {
    "patientId": {"type":"integer", "format": "int32", "description": "patientId"},
    "recordId":{"type":"integer","format": "int32","description": "Unique Identifier of this Record"},
    "date":{"type":"string","format": "Date", "description": "Date of Report"},
    "q1" :{"type":"boolean","description": " Answer to q1 "},
    "q2" :{"type":"boolean","description": " Answer to q2 "},
    "q3" :{"type":"boolean","description": " Answer to q3 "},
    "q4" :{"type":"boolean","description": " Answer to q4 "},
    "q5" :{"type":"boolean","description": " Answer to q5 "},
    "q1a" :{"type":"boolean","description": " Answer to q1a "},
    "q1b" :{"type":"boolean","description": " Answer to q1b "},
    "q1c" :{"type":"boolean","description": " Answer to q1c "},
    "q3a" :{"type":"boolean","description": " Answer to q3a "},
    "q3b" :{"type":"boolean","description": " Answer to q3b "},
    "q3c" :{"type":"boolean","description": " Answer to q3c "},
    "satO2": {"type":"number", "format": "float", "description": "satO2"},
    "walkingDist": {"type":"number", "format": "float", "description": "walkingDist"},
    "temperature": {"type":"number", "format": "float", "description": "temperature"},
    "pefr": {"type":"number", "format": "float", "description": "pefr"},
    "heartRate": {"type":"number", "format": "float", "description": "heartRate"},
    "x":{"type":"string", "description": "X Coordinate of GPS Location. Type is String to avoid rounding."},
    "y":{"type":"string", "description": "Y Coordinate of GPS Location. Type is String to avoid rounding."}
};

exports.models = {
    "DailyReport":{
        "id" : "DailyReport",
        "required": ["patientId", "recordId", "date", "q1","q2","q3","q4","q5","q1a","q1b","q1c","q3a","q3b","q3c","satO2", "walkingDist", "temperature", "pefr", "heartRate", "x", "y"],
        "properties": contents
    },
    "NewDailyReport":{
        "id" : "NewDailyReport",
        "required": ["q1","q2","q3","q4","q5"],
        "properties": contents
    },
    "ListDailyReport":{
        "id":"ListDailyReport",
        "required": ["daily_reports"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, daily_reports : {"type" : "array", items : { "$ref" : "DailyReport"}}}

    }
};