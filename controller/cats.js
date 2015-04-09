/**
 * Controller: CAT Records
 *
 * Contains Methods to GET (imported from commons) and POST to /patients/id/cats (list and add)
 * And Methodes to GET (imported from commons), PUT and DELETE (imported from commons) /patients/id/cats/recordid (listOne, update and del)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var commons = require('./controller_commons.js');
var analyzer = require('./notify.js');
var dailyAnalyzer = new analyzer();

/**
 *  GET /patients/id/cats
 */
exports.list = function(req,res,next){
    commons.list(req,res,next,'cats');
};

/**
 * GET /patients/id/cats/recordid
 */
exports.listOne = function(req,res,next){
    commons.listOne(req,res,next,'cats');
};

/**
 *  DELETE /patients/id/cats/recordid
 */
exports.del = function(req,res,next){
    commons.del(req,res,next,'cats');
};

/**
 *  POST /patients/id/cats
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
    var id = parseInt(req.params.id);
    // if no date is given make it null, so the trigger can set the date
    var date = (i.diagnoseDate || i.diagnoseDate != "")? i.diagnoseDate : null;
    // make status lower case so the db triggers can validate the value (valid are baseline and exacerbation)
    var status = (i.status)? i.status.toLowerCase() : "";
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    // any given ID in the body will be ignored and the ids from the url are used!
    connection.query('call catCreate(?,?,?,?,?,?,?,?,?,?,?)',
        [id, date, status,	i.q1, i.q2, i.q3, i.q4, i.q5, i.q6, i.q7, i.q8], function(err, result) {
            connection.release();
            if (err) next(err);
            else {
                // this postpones the analysis of the data until the POST is completely processed
                process.nextTick (function (){
                    dailyAnalyzer.emit('goldAnalyzes', id);
                });
                // resource was created
                // link will be provided in location header
                res.loc = '/patients/'+ id + '/cats/' + result[0][0].insertId;
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
    // 3) create SQL Query from parameters
    var i = req.body;
    // any given ID in the body will be ignored and the ids from the url are used!
    var id = parseInt(req.params.id);
    var rid = parseInt(req.params.rid);
    // if no date is given make it null, so the trigger can set the date
    var date = (i.diagnoseDate || i.diagnoseDate != "")? i.diagnoseDate : null;
    // make status lower case so the db triggers can validate the value (valid are baseline and exacerbation)
    var status = (i.status)? i.status.toLowerCase() : "";
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query('call catUpdate(?, ?,?,?,?,?,?,?,?,?,?,?)',  [rid, id, date, status, i.q1, i.q2, i.q3, i.q4, i.q5, i.q6, i.q7, i.q8], function(err, result) {
        connection.release();
        if (err) next(err);
        else {
            res.affectedRows = result[0][0].affected_rows;
            next();
        }
    });
};

var respMessages = commons.respMsg("Catscale");
exports.listSpec =  {
    summary : "Get All Catscale Records of this Patient (Roles: doctor)",
    notes: "This Function lists all COPD Assessment Test for the given patient. <br>This function passes the parameters to the SP listExams. <br><br> <b>Parameters:</b> <br><br>  " +
    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20.",
    path : "/patients/{id}/cats",
    method: "GET",
    type : "ListCatscale",
    nickname : "listCatscale",
    parameters : [swagger.pathParam("id", "Patient where the records belong to", "string"),
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")],
    responseMessages: respMessages.list
};


exports.listOneSpec = {
    summary : "Get specific Catscale Record of this Patient (Roles: doctor)",
    notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP listSingleExams. <br><br>" ,
    path : "/patients/{id}/cats/{rid}",
    method: "GET",
    type : "Catscale",
    nickname : "listOneCatscale",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string")],
    responseMessages: respMessages.listOne
};


exports.addSpec = {
    summary : "Add Catscale Records (Roles: doctor)",
    notes: "This Function creates an new Catscale Record. (if the Body contains patientId, its ignored) <br>This function passes its parameters to the SP catsCreate. <br>Total Catscale Value will be computed from q*; if no diagnoseDate is supplied current date will be used;<br><br>" ,
    path : "/patients/{id}/cats",
    method: "POST",
    nickname : "addCatscale",
    parameters : [swagger.bodyParam("Catscale", "new Record", "NewCatscale"), swagger.pathParam("id", "Patient where the records belong to", "string")],
    responseMessages: respMessages.add

};


exports.delSpec = {
    summary : "Delete specific Catscale Record of this Patient (Roles: doctor)",
    notes: "This Function deletes a record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP deleteExamRecord <br><br>" ,
    path : "/patients/{id}/cats/{rid}",
    method: "DELETE",
    nickname : "delCatscale",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string")],
    responseMessages: respMessages.del

};

exports.updateSpec = {
    summary : "Update specific Catscale Record of this Patient (Roles: doctor)",
    notes: "This Function updates a record, which is specified by the url. Any IDs in the Message Body are ignored. Instead the ids in the url are used. <br>This function passes its parameters to the SP catsUpdate. <br><br>" ,
    path : "/patients/{id}/cats/{rid}",
    method: "PUT",
    nickname : "updateCatscale",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string") ,swagger.bodyParam("Catscale", "updated Catscale Record", "NewCatscale")],
    responseMessages: respMessages.update
};

var catAnswer = {
    "type":"integer",
    "format": "int32",
    "description": "Catscale Answer Value",
    "minimum" : "0",
    "maximum" : "5"
};

var contents ={
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
    "totalCatscale":{
        "type":"integer",
        "format": "int32",
        "description": "Catscale Score"
    },
    "q1": catAnswer,
    "q2": catAnswer,
    "q3": catAnswer,
    "q4": catAnswer,
    "q5": catAnswer,
    "q6": catAnswer,
    "q7": catAnswer,
    "q8": catAnswer,
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
    }

};

exports.models = {
    "Catscale":{
        "id":"Catscale",
        "required": ["q1","q2","q3","q4","q5","q6","q7","q8","totalCatscale","patientId","recordId","diagnoseDate","status" ],
        properties: contents
    },
    "NewCatscale":{
        "id":"NewCatscale",
        "required": ["q1","q2","q3","q4","q5","q6","q7","q8","status" ],
        "properties": contents
    },
    "ListCatscale":{
        "id":"ListCatscale",
        "required": ["cats"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, cats : {"type" : "array", items : { "$ref" : "Catscale"}}}

    }
};


