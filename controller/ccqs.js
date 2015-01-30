/**
 * Controller: CCQ Records
 *
 * Contains Methods to GET (imported from commons) and POST to /patients/id/ccqs (list and add)
 * And Methodes to GET (imported from commons), PUT and DELETE (imported from commons) /patients/id/ccqs/recordid (listOne, update and del)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var mysql = require('../config/mysql');
var db = mysql.db;
var config = require('../config/config.js');
var commons = require('./controller_commons.js');

/**
 *  GET /patients/id/ccqs
 */
exports.list = function(req,res,next){
    commons.list(req,res,next,'ccqs');
};

/**
 * GET /patients/id/ccqs/recordid
 */
exports.listOne = function(req,res,next){
    commons.listOne(req,res,next,'ccqs');
};

/**
 *  DELETE /patients/id/ccqs/recordid
 */
exports.del = function(req,res,next){
    commons.del(req,res,next,'ccqs');
};

/**
 *  POST /patients/id/ccqs
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
    // 4) create SQL Query from parameters
    var i = req.body;
    // any given ID in the body will be ignored and the ids from the url are used!
    var id = parseInt(req.params.id);
    // if no date is given make it null, so the trigger can set the date
    var date = i.diagnoseDate || null;
    // make status lower case so the db triggers can validate the value (valid are baseline and exacerbation)
    var status = (i.status)? i.status.toLowerCase() : "";
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query('call ccqCreate(?,?,?,?,?,?,?,?,?,?,?,?,?)', [id, date, status, i.q1, i.q2, i.q3, i.q4, i.q5, i.q6, i.q7, i.q8, i.q9, i.q10], function(err, result) {
        if (err) {
            next(err);

        } else {
            // resource was created
            // link will be provided in location header
            res.statusCode = 201;
            res.location('/patients/'+ id + '/ccqs/' + result[0][0].insertId);
            res.send();
        }
        connection.release();
    });
};

/**
 *  PUT /patients/id/cats/recordid
 *  Steps:
 *  	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.update = function(req,res,next){
    var connection = req.con;
    // 3) create SQL Query from parameters }
    var i = req.body;
    // any given ID in the body will be ignored and the ids from the url are used!
    var id = parseInt(req.params.id);
    var rid = parseInt(req.params.rid);
    // if no date is given make it null, so the trigger can set the date
    var date = i.diagnoseDate || null;
    // make status lower case so the db triggers can validate the value (valid are baseline and exacerbation)
    var status = (i.status)? i.status.toLowerCase() : "";
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query('call ccqUpdate(?, ?,?,?,?,?,?,?,?,?,?,?, ?, ?)', [rid, id, date, status, i.q1, i.q2, i.q3, i.q4, i.q5, i.q6, i.q7, i.q8,i.q9, i.q10], function(err, result) {
        if (err) {
            next(err);
        } else {
            // record  was updated
            if (result[0][0].affected_rows > 0){
                res.statusCode = 204;
                res.send();
            }
            // record wasnt updated since it doesnt exist or isnt visible to the current user
            else {
                res.statusCode = 404;
                res.send();
            }
        }
        connection.release();
    });
};



exports.listSpec = {
    summary : "Get All CCQ Records of this Patient (Roles: doctor)",
    notes: "This Function lists all COPD Clinical Questionnaires for the given patient. <br>This function passes the parameters to the SP listExams. <br><br> <b>Parameters:</b> <br><br>  " +
    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " +
    "<b>Possible Results</b>: <br>" +
    " <b>200</b>  List of CCQs is supplied. Format cats: [Array of ccq Model] <br>" +
    " <b>204</b>  List (or the current page) is currently empty <br>" +
    " <b>403</b>  The current user isnt allowed to access the data of the given patient <br>" +
    " <b>500</b> Internal Server Error",
    path : "/patients/{id}/ccqs",
    method: "GET",
    type : "ListCCQ",
    nickname : "listCCQ",
    parameters : [swagger.pathParam("id", "Patient where the records belong to", "string"),
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")]

};


exports.addSpec = {
    summary : "Add CCQ Records (Roles: doctor)",
    notes: "This Function creates a new CCQ Record. If the Body contains patientId, its ignored. The totalX Values are computed by the database and the db will also set the date if none is provided. <br>This function passes its parameters to the SP ccqCreate. <br> The Score Values don't have to be provided. The Database will calculate them. The DB also sets the date<br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>201</b>  Record is created and the location is returned in the Location Header <br>" +
    " <b>400</b>  The provided data contains errors, e.g. a invalid value for status <br>" +
    " <b>403</b>  The logged in user isnt allowed to create a record with this data.<br>"+
    " <b>500</b> Internal Server Error",
    path : "/patients/{id}/ccqs",
    method: "POST",
    nickname : "addCCQ",
    parameters : [swagger.bodyParam("CCQ", "new Record", "NewCCQ"), swagger.pathParam("id", "Patient where the records belong to", "string")]
};


exports.listOneSpec = {
    summary : "Get specific CCQ Record of this Patient (Roles: doctor)",
    notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP listSingleExams. <br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>200</b>  Record is supplied <br>" +
    " <b>403</b>  The current user isnt allowed to access the data of the given patient <br>" +
    " <b>404</b>  The requested record doesnt exist. <br>" +
    " <b>500</b> Internal Server Error",
    path : "/patients/{id}/ccqs/{rid}",
    method: "GET",
    type : "CCQ",
    nickname : "listOneCCQ",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string")]
};


exports.delSpec = {
    summary : "Delete specific CCQ Record of this Patient (Roles: doctor)",
    notes: "This Function deletes a record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP deleteExamRecord <br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>204</b>  Record was deleted. <br>" +
    " <b>404</b>  Record is either not visible to the current user or doesnt exist. <br>" +
    " <b>500</b> Internal Server Error",
    path : "/patients/{id}/ccqs/{rid}",
    method: "DELETE",
    nickname : "delCCQ",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string")]
};

exports.updateSpec = {
    summary : "Update specific CCQ Record of this Patient (Roles: doctor)",
    notes: "This Function updates a record, which is specified by the url. Any IDs in the Message Body are ignored. Instead the ids in the url are used. <br>This function passes its parameters to the SP ccqUpdate. <br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>204</b>  Record was updated. <br>" +
    " <b>400</b>  The provided data contains errors, e.g. a invalid value for status <br>" +
    " <b>404</b>  Record is either not visible to the current user or doesnt exist. <br>" +
    " <b>500</b> Internal Server Error",
    path : "/patients/{id}/ccqs/{rid}",
    method: "PUT",
    nickname : "updateCCQ",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string") ,swagger.bodyParam("CCQ", "updated CCQ Record", "NewCCQ")]
};

var ccqAnswer = {
    "type":"integer",
    "format": "int32",
    "description": "CCQ Answer Value",
    "minimum": "0",
    "maximum" : "5"
};

var contents = {
    "patientId":{
        "type":"integer",
        "format": "int32",
        "description": "Unique Identifier of the Patient"
    },
    "recordId":{
        "type":"integer",
        "format": "int32",
        "description": "Unique Identifier of this Record"
    },
    "diagnoseDate":{
        "type":"string",
        "format": "Date",
        "description": "Date of Diagnose"
    },
    "status":{
        "type":"string",
        "description" : "Status",
        "enum":[
            "baseline",
            "exacerbation"
        ]
    },
    "q1":ccqAnswer,
    "q2":ccqAnswer,
    "q3":ccqAnswer,
    "q4":ccqAnswer,
    "q5":ccqAnswer,
    "q6":ccqAnswer,
    "q7":ccqAnswer,
    "q8":ccqAnswer,
    "q9":ccqAnswer,
    "q10":ccqAnswer,
    "totalCCQScore":{
        "type":"number",
        "format": "float",
        "description": "Total CCQ Score"
    },
    "symptomScore":{
        "type":"number",
        "format": "float",
        "description": "Symptom Score"
    },
    "mentalStateScore":{
        "type":"number",
        "format": "float",
        "description": "Mental State Score"
    },
    "functionalStateScore":{
        "type":"number",
        "format": "float",
        "description": "Functional State Score"
    }

};

exports.models = {
    "CCQ":{
        "id":"CCQ",
        "required": ["patientId","recordId", "diagnoseDate", "status", "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "totalCCQScore", "symptomScore", "mentalStateScore", "functionalStateScore"],
        "properties" : contents
    },
    "NewCCQ":{
        "id":"NewCCQ",
        "required": ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10", "status"],
        "properties": contents
    },
    "ListCCQ":{
        "id":"ListCCQ",
        "required": ["ccqs"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, ccqs : {"type" : "array", items : { "$ref" : "CCQ"}}}

    }
};


