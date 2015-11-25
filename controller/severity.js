/**
 * Created by armin on 25.03.15.
 */
var commons = require('./controller_commons');
var request = require('request');
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

exports.add = function(req,res,next) {
    var connection = req.con;
    // 4) create SQL Query from parameters
    var i = req.body;
    // any given ID in the body will be ignored and the ids from the url are used!
    var id = parseInt(req.params.id);
    // if no date is given make it null, so the trigger can set the date
    var date = i.validFrom || null;
    // if no comment is given make it null.
    var comment = i.comment || null;
    i.severity = i.severity ? i.severity : "";
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query('call severityCreate(?,?,?,?)',
        [id, date, comment, i.severity.toUpperCase()],
        function (err, result) {
            connection.release();
            if (err) next(err);
            else {
				
				// Notify flow engine
				process.nextTick (function (){
					request.post({url:'http://localhost:1880/analyzer/new_report', form: {url:'/patients/'+ id + '/severity/' + result[0][0].insertId, type: 'severity'}}, function(err,httpResponse,body){ 
						if (!err && httpResponse.statusCode == 200) {
				    		console.log(body);
				    	}
					});
				});
				
                res.loc  = '/patients/'+ id + '/severity/' + result[0][0].insertId;
                res.modified = result[0][0].modified;
                next();
            }
        });
};
var commons = require('./controller_commons');
var respMessages = commons.respMsg("Severity");
exports.listSpec = {
    summary : "Get the Severity-History this Patient (Roles: doctor)",
    notes: "This Function lists all Severities for the given patient. <br>This function passes the parameters to the SP severityList. <br><br> <b>Parameters:</b> <br><br>  " +
    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " ,
    path : "/patients/{id}/severity",
    method: "GET",
    type : "ListSeverity",
    nickname : "listSeverity",
    parameters : [swagger.pathParam("id", "Patient", "string"),
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")],
    responseMessages: respMessages.list
};

exports.addSpec = {
    summary : "Add new Severity (Roles: doctor)",
    notes: "This Function creates a new Severity. If the Body contains patientId, its ignored and the id from the url is taken. Also it will set the date if date is null. <br>This function passes its parameters to the SP severityCreate. <br><br>" ,
    path : "/patients/{id}/severity",
    method: "POST",
    nickname : "addSeverity",
    parameters : [swagger.bodyParam("NewSeverity", "new Set of Daily Answers", "NewSeverity"), swagger.pathParam("id", "Patient", "string")],
    responseMessages: respMessages.add
};

exports.listOneSpec = {
    summary : "Get specific Severity Record of this Patient (Roles: doctor)",
    path : "/patients/{id}/severity/{rid}",
    notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP severityListOne. <br><br>" ,
    method: "GET",
    type : "Severity",
    nickname : "listOneSeverity",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string")],
    responseMessages: respMessages.listOne
};

exports.delSpec = {
    summary : "Delete specific Severity Record of this Patient (Roles: doctor)",
    notes: "This Function deletes a record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP severityDelete <br><br>" ,
    path : "/patients/{id}/severity/{rid}",
    method: "DELETE",
    nickname : "delSeverity",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string")],
    responseMessages: respMessages.del
};

var contents = {
    "patientId": {"type":"integer", "format": "int32", "description": "patientId"},
    "recordId":{"type":"integer","format": "int32","description": "Unique Identifier of this Record"},
    "validFrom":{"type":"string","format": "Date", "description": "Date this severity is valid from."},
    "comment":{"type":"string","description":"Comment why the severity changed."},
    "severity":{"type":"string","description":"The new severity.", "enum":["A", "B", "C", "D"]}
};

exports.models = {
    "Severity":{
        "id" : "Severity",
        "required": ["severity","patientId","recordId","validFrom", "comment"],
        "properties": contents
    },
    "NewSeverity":{
        "id" : "NewSeverity",
        "required": ["severity"],
        "properties": contents
    },
    "ListSeverity":{
        "id":"ListSeverity",
        "required": ["severity"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, severity : {"type" : "array", items : { "$ref" : "Severity"}}}

    }
};