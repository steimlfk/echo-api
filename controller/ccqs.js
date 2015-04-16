/**
 * Controller: CCQ Records
 *
 * Contains Methods to GET (imported from commons) and POST to /patients/id/ccqs (list and add)
 * And Methodes to GET (imported from commons), PUT and DELETE (imported from commons) /patients/id/ccqs/recordid (listOne, update and del)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var commons = require('./controller_commons.js');
var analyzer = require('./notify.js');
var dailyAnalyzer = new analyzer();

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
        connection.release();
        if (err) next(err);
        else {
            // this postpones the analysis of the data until the POST is completely processed
            process.nextTick (function (){
                dailyAnalyzer.emit('goldAnalyzes', id);
            });
            // resource was created
            // link will be provided in location header
            res.loc='/patients/'+ id + '/ccqs/' + result[0][0].insertId;
            res.modified = result[0][0].modified;
            next();
        }

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
        connection.release();
        if (err) next(err);
        else {
            res.affectedRows = result[0][0].affected_rows;
            next();
        }
    });
};


var respMessages = commons.respMsg("CCQ");
exports.listSpec = {
    summary : "Get All CCQ Records of this Patient (Roles: doctor)",
    notes: "This Function lists all COPD Clinical Questionnaires for the given patient. <br>This function passes the parameters to the SP listExams. <br><br> <b>Parameters:</b> <br><br>  " +
    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> ",
    path : "/patients/{id}/ccqs",
    method: "GET",
    type : "ListCCQ",
    nickname : "listCCQ",
    parameters : [swagger.pathParam("id", "Patient where the records belong to", "string"),
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")],
    responseMessages: respMessages.list
};


exports.addSpec = {
    summary : "Add CCQ Records (Roles: doctor)",
    notes: "This Function creates a new CCQ Record. If the Body contains patientId, its ignored. The totalX Values are computed by the database and the db will also set the date if none is provided. <br>This function passes its parameters to the SP ccqCreate. <br> The Score Values don't have to be provided. The Database will calculate them. The DB also sets the date<br><br>" ,
    path : "/patients/{id}/ccqs",
    method: "POST",
    nickname : "addCCQ",
    parameters : [swagger.bodyParam("CCQ", "new Record", "NewCCQ"), swagger.pathParam("id", "Patient where the records belong to", "string")],
    responseMessages: respMessages.add
};


exports.listOneSpec = {
    summary : "Get specific CCQ Record of this Patient (Roles: doctor)",
    notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP listSingleExams. <br><br>" ,
    path : "/patients/{id}/ccqs/{rid}",
    method: "GET",
    type : "CCQ",
    nickname : "listOneCCQ",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string")],
    responseMessages: respMessages.listOne
};


exports.delSpec = {
    summary : "Delete specific CCQ Record of this Patient (Roles: doctor)",
    notes: "This Function deletes a record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP deleteExamRecord <br><br>" ,
    path : "/patients/{id}/ccqs/{rid}",
    method: "DELETE",
    nickname : "delCCQ",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string")],
    responseMessages: respMessages.del
};

exports.updateSpec = {
    summary : "Update specific CCQ Record of this Patient (Roles: doctor)",
    notes: "This Function updates a record, which is specified by the url. Any IDs in the Message Body are ignored. Instead the ids in the url are used. <br>This function passes its parameters to the SP ccqUpdate. <br><br>" ,
    path : "/patients/{id}/ccqs/{rid}",
    method: "PUT",
    nickname : "updateCCQ",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string") ,swagger.bodyParam("CCQ", "updated CCQ Record", "NewCCQ")],
    responseMessages: respMessages.update
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


