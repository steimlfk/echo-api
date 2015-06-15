/**
 * Controller: Daily Reports
 *
 * Contains Methods to GET and POST to /patients/id/daily_reports (list and add)
 * And Methodes to GET, PUT and DELETE  /patients/id/daily_reports/recordid (listOne, update and del)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');


/**
 *  GET /patients/id/daily_reports
 *    Steps:
 *    	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.list = function(req, res, next1){
    var exam = 'daily_reports';
    var connection = req.con;
    // query
    var qry = 'call reportList(?, ?, ?)';
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

    }
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query(qry, [req.params.id, page, pageSize], function(err, rows) {
        connection.release();
        if (err) next1(err);
        else {
            var fullResult = {
                daily_reports : []
            };
            // is there any result?
            if (rows[0].length > 0){
                var host = 'https://'+req.headers.host;
                var result = [];
                for (var i = 0; i < rows[0].length; i++){
                    var o  = rows[0][i];
                    // add "self" to all resources
                    o._links = {};
                    o._links.self = {};
                    o._links.self.href = host+'/patients/'+req.params.id+'/'+exam+'/'+rows[0][i].recordId;
                    // create corresponding patients link
                    o._links.patient = {};
                    o._links.patient.href = host+'/patients/'+req.params.id;
                    result.push(o);
                }
                fullResult.daily_reports = result;

                // add pagination links to result set if pagination was used
                if(page != 0){
                    var links = {};
                    // create "first" link
                    var first = host+'/patients/'+req.params.id+'/'+exam+'?page=1&pageSize='+pageSize;
                    links.first = first;
                    // create "next" link if pageSize equals result size
                    if (rows[0].length == pageSize) {
                        var next = host+'/patients/'+req.params.id+'/'+exam+'?page='+(page+1)+'&pageSize='+pageSize;
                        links.next = next
                    }
                    // create back link if page was not the first
                    if (page != 1){
                        var back = host+'/patients/'+req.params.id+'/'+exam+'?page='+(page-1)+'&pageSize='+pageSize;
                        links.back = back
                    }
                    fullResult._links = links;
                }
            }
            res.result = fullResult;
            next1();
        }
    });
};

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
    var exam = 'daily_reports';
    var connection = req.con;
    var id = req.params.id;
    var rid = req.params.rid;
    var qry = 'call reportListOne(?,?)';
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query(qry,[id,rid], function(err, rows) {
        connection.release();
        if (err) next(err);
        else {
            var fullResult = {};
            // is there any result?
            if (rows[0].length > 0){
                var host = 'https://'+req.headers.host;
                var o  = rows[0][0];
                o._links = {};
                // create self link
                o._links.self = {};
                o._links.self.href = host+'/patients/'+req.params.id+'/'+exam+'/'+rows[0][0].recordId;
                // create corresponding patients link
                o._links.patient = {};
                o._links.patient.href = host+'/patients/'+req.params.id;
                fullResult = o;
            }
            res.result = fullResult;
            next();
        }
    });
};

/**
 *  DELETE /patients/id/daily_reports/recordid
 *    Steps:
 *      1) Validate Role
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.del = function(req, res, next){
    var connection = req.con;
    // 3) create SQL Query from parameters
    var id = parseInt(req.params.id);
    var rid = parseInt(req.params.rid);
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query('call reportDelete(?, ?)', [id, rid], function(err, result) {
        connection.release();
        if (err) next(err);
        else {
            res.affectedRows = result[0][0].affected_rows > 0;
            next();
        }
    });
};

/**
 *  PUT /patients/id/daily_reports/recordid
 *  Steps:
 *  	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.update = function(req,res,next) {
    var connection = req.con;
    // 3) create SQL Query from parameters
    var i = req.body;
    // convert ids
    var id = parseInt(req.params.id);
    var rid = parseInt(req.params.rid);
    // set date to null if not set
    var date = i.date || null;
    // query db
    connection.query('call reportUpdate(?,?,?, ?,?,?,?,?, ?,?,?,?,?,?, ?,?,?,?,?,?,?)',
        [rid, id, date,
            i.q1, i.q2, i.q3, i.q4, i.q5, i.q1a, i.q1b, i.q1c, i.q3a, i.q3b, i.q3c, i.satO2,
            i.walkingDist, i.temperature, i.pefr, i.heartRate, i.x, i.y], function (err, result) {
            connection.release();
            if (err) next(err);
            else {
                res.affectedRows = result[0][0].affected_rows > 0;
                next();
            }
        });
};

/**
 *  POST /patients/id/daily_reports
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
    var id = parseInt(req.params.id);
    // set date to null if not set
    var date = i.date || null;
    // query db
    connection.query('call reportCreate(?,?, ?,?,?,?,?, ?,?,?, ?,?,?, ?,?,?,?,?,?,?)',
        [id, date,
            i.q1, i.q2, i.q3, i.q4, i.q5, i.q1a, i.q1b, i.q1c, i.q3a, i.q3b, i.q3c, i.satO2,
            i.walkingDist, i.temperature, i.pefr, i.heartRate, i.x, i.y], function(err, result) {
            connection.release();
            if (err) next(err);
            else {
                // trigger analysis
                var analyzer = require('./notify.js');
                var dailyAnalyzer = new analyzer();
                // this postpones the analysis of the data until the POST is completely processed
                process.nextTick (function (){
                    dailyAnalyzer.emit('newDailyReport', result[0][0].insertId);
                });
                res.loc = '/patients/'+ id + '/daily_reports/' + result[0][0].insertId;
                next();
            }
        });
};

var commons = require('./controller_commons');
var respMessages = commons.respMsg("DailyReport");
exports.listSpec = {
    summary : "Get All Daily Reports By this Patient (Roles: doctor and patient)",
    notes: "This Function lists all Daily Reports for the given patient. <br>This function passes the parameters to the SP reportList. <br><br> <b>Parameters:</b> <br><br>  " +
    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> ",
    path : "/patients/{id}/daily_reports",
    method: "GET",
    type : "ListDailyReport",
    nickname : "listReport",
    parameters : [swagger.pathParam("id", "Patient who answered the Questions", "string"),
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")],
    responseMessages: respMessages.list
};


exports.addSpec = {
    summary : "Add new Daily Reports (Roles: doctor and patient)",
    notes: "This Function creates an new Daily Report. If the Body contains patientId, its ignored and the id from the url is taken. Also it will set the date if date is null. <br>This function passes its parameters to the SP reportCreate. <br><br>" ,
    path : "/patients/{id}/daily_reports",
    method: "POST",
    nickname : "addReport",
    parameters : [swagger.bodyParam("NewDailyReport", "new Set of Daily Answers", "NewDailyReport"), swagger.pathParam("id", "Patient who answered the Questions", "string")],
    responseMessages: respMessages.add
};

exports.listOneSpec = {
    summary : "Get specific Daily Report Record of this Patient (Roles: doctor and patient)",
    path : "/patients/{id}/daily_reports/{rid}",
    notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP reportListOne. <br><br>" ,
    method: "GET",
    type : "DailyReport",
    nickname : "listOneReport",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string")],
    responseMessages: respMessages.listOne
};


exports.delSpec = {
    summary : "Delete specific Daily Report Record of this Patient (Roles: doctor and patient)",
    notes: "This Function deletes a record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP reportDelete <br><br>" ,
    path : "/patients/{id}/daily_reports/{rid}",
    method: "DELETE",
    nickname : "delReport",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string")],
    responseMessages: respMessages.del
};

exports.updateSpec = {
    summary : "Update specific Daily Report Record of this Patient (Roles: doctor and patient)",
    notes: "This Function updates a Daily Report, which is specified by the url. Any ids in the Message Body are ignored. <br>This function passes its parameters to the SP reportUpdate. <br><br>" ,
    path : "/patients/{id}/daily_reports/{rid}",
    method: "PUT",
    nickname : "updateReport",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string") ,
        swagger.bodyParam("DailyReport", "updated Readings Record", "NewDailyReport")],
    responseMessages: respMessages.update
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