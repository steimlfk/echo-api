/**
 * Created by armin on 25.03.15.
 */
var commons = require('./controller_commons');
var swagger = require('swagger-node-express');

exports.list = function(req, res, next) {
    commons.list(req,res,next,'severity');
};

exports.listOne = function(req, res, next) {
    commons.listOne(req, res, next, 'severity');
};

exports.del = function(req,res,next){
    commons.del(req,res,next,'severity');
};

exports.add = function(req,res,next){
    var connection = req.con;
    // 4) create SQL Query from parameters
    var i = req.body;
    // any given ID in the body will be ignored and the ids from the url are used!
    var id = parseInt(req.params.id);
    // if no date is given make it null, so the trigger can set the date
    var date = i.validFrom || null;
    // if no comment is given make it null.
    var comment = i.comment || null;
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query('call severityCreate(?,?,?,?)',
        [id, date,comment, i.severity.toUpperCase()],
        function(err, result) {
            if (err) {
                next(err);

            } else {
                // resource was created
                // link will be provided in location header
                res.statusCode = 201;
                res.location('/patients/'+ id + '/severity/' + result[0][0].insertId);
                res.send();
            }
            connection.release();
        });
};

exports.listSpec = {
    summary : "Get All Severities By this Patient (Roles: doctor and patient)",
    notes: "This Function lists all Severities for the given patient. <br>This function passes the parameters to the SP severityList. <br><br> <b>Parameters:</b> <br><br>  " +
    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " +
    "<b>Possible Results</b>: <br>" +
    " <b>200</b>  List of Severities is supplied. Format cats: [Array of severity Model] <br>" +
    " <b>204</b>  List (or the current page) is currently empty <br>" +
    " <b>403</b>  The current user isnt allowed to access the data of the given patient <br>" +
    " <b>500</b> Internal Server Error",
    path : "/patients/{id}/severity",
    method: "GET",
    type : "ListSeverity",
    nickname : "listSeverity",
    parameters : [swagger.pathParam("id", "Patient", "string"),
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")]
};

exports.addSpec = {
    summary : "Add new Severity (Roles: doctor and patient)",
    notes: "This Function creates a new Severity. If the Body contains patientId, its ignored and the id from the url is taken. Also it will set the date if date is null. <br>This function passes its parameters to the SP severityCreate. <br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>201</b>  Record is created and the location is returned in the Location Header <br>" +
    " <b>400</b>  The provided data contains errors. <br>" +
    " <b>403</b>  The logged in user isnt allowed to create a record with this data.<br>"+
    " <b>500</b> Internal Server Error",
    path : "/patients/{id}/severity",
    method: "POST",
    nickname : "addSeverity",
    parameters : [swagger.bodyParam("NewSeverity", "new Set of Daily Answers", "NewSeverity"), swagger.pathParam("id", "Patient", "string")]
};

exports.listOneSpec = {
    summary : "Get specific Severity Record of this Patient (Roles: doctor and patient)",
    path : "/patients/{id}/severity/{rid}",
    notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP severityListOne. <br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>200</b>  Record is supplied <br>" +
    " <b>403</b>  The current user isnt allowed to access the data of the given patient <br>" +
    " <b>404</b>  The requested record doesnt exist. <br>" +
    " <b>500</b> Internal Server Error",
    method: "GET",
    type : "Severity",
    nickname : "listOneSeverity",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string")]
};

exports.delSpec = {
    summary : "Delete specific Severity Record of this Patient (Roles: doctor and patient)",
    notes: "This Function deletes a record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP severityDelete <br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>204</b>  Record was deleted. <br>" +
    " <b>404</b>  Record is either not visible to the current user or doesnt exist. <br>" +
    " <b>500</b> Internal Server Error",
    path : "/patients/{id}/severity/{rid}",
    method: "DELETE",
    nickname : "delSeverity",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string")]
};

var contents = {
    "patientId": {"type":"integer", "format": "int32", "description": "patientId"},
    "recordId":{"type":"integer","format": "int32","description": "Unique Identifier of this Record"},
    "validFrom":{"type":"string","format": "Date", "description": "Date this severity is valid from."},
    "comment":{"type":"string","description":"Comment why the severity changed."},
    "severity":{"type":"string","description":"The new severity.", "enum":["A", "B", "C", "D"]}
};

exports.models = {
    "NewSeverity":{
        "id" : "NewSeverity",
        "required": ["severity"],
        "properties": contents
    },
    "ListSeverity":{
        "id":"ListSeverity",
        "required": ["daily_reports"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, severity : {"type" : "array", items : { "$ref" : "Severity"}}}

    }
};