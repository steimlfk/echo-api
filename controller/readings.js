/**
 * Controller: Readings Records
 *
 * Contains Methods to GET (imported from commons) and POST to /patients/id/readings (list and add)
 * And Methodes to GET (imported from commons), PUT and DELETE (imported from commons) /patients/id/readings/recordid (listOne, update and del)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var commons = require('./controller_commons.js');
var analyzer = require('./notify.js');
var dailyAnalyzer = new analyzer();

/**
 *  GET /patients/id/readings
 */
exports.list = function(req,res,next){
    commons.list(req,res,next,'readings');
};

/**
 * GET /patients/id/readings/recordid
 */
exports.listOne = function(req,res,next){
    commons.listOne(req,res,next,'readings');
};

/**
 *  DELETE /patients/id/readings/recordid
 */
exports.del = function(req,res,next){
    commons.del(req,res,next,'readings');
};


/**
 *  POST /patients/id/readings
 *  Steps:
 *  	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.add = function(req,res,next) {
    var connection = req.con;
    // 4) create SQL Query from parameters
    var i = req.body;
    // any given ID in the body will be ignored and the ids from the url are used!
    var id = parseInt(req.params.id);
    // if no date is given make it null, so the trigger can set the date
    var date = i.diagnoseDate || null;

    if (req.body.status == undefined) {
        connection.release();
        next({code:'ER_BAD_NULL_ERROR'})
    } else {
        // query db
        // ? from query will be replaced by values in [] - including escaping!
        connection.query('call readingsCreate(?,?,?,?,?, ?,?,?,?,?,'
            + '?,?,?,?,?, ?,?,?,?,?,'
            + '?,?,?,?,?, ?,?,?,?,?,'
            + '?,?,?,?,?, ?,?,?,?,?,'
            + '?,?,?,?,?,?)',
            [id, date, i.status, i.del_fef25_75_pro, i.del_fev1_post,
                i.del_fvc_pro, i.del_pef_pro, i.dlco_pro, i.fef25_75_pre_pro, i.fev1,
                i.fev1_fvc, i.fev1_fvc_pre, i.fev1_post, i.fev1_pre, i.fev1_pre_pro,
                i.fev1_pro, i.frc_pre, i.frc_pre_pro, i.fvc, i.fvc_post,
                i.fvc_pre, i.fvc_pre_pro, i.fvc_pro, i.hco3, i.height,
                i.hematocrit, i.kco_pro, i.mmrc, i.notes, i.paco2,
                i.pao2, i.pef_pre_pro, i.pH, i.pxy, i.rv,
                i.rv_pre, i.rv_pre_pro, i.rv_pro, i.rv_tlc, i.satO2_pro,
                i.smoker, i.tlc, i.tlc_pre, i.tlc_pre_pro, i.tlc_pro,
                i.weight],
            function (err, result) {
                connection.release();
                if (err) next(err);
                else {
                    var analyzer = require('./notify.js');
                    var dailyAnalyzer = new analyzer();
                    // this postpones the analysis of the data until the POST is completely processed
                    process.nextTick(function () {
                        dailyAnalyzer.emit('goldAnalyzes', id);
                    });
                    // resource was created
                    // link will be provided in location header
                    res.loc = '/patients/' + id + '/readings/' + result[0][0].insertId;
                    next()
                }
            });
    }
};

/**
 *  PUT /patients/id/readings/recordid
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
    // any given ID in the body will be ignored and the ids from the url are used!
    var id = parseInt(req.params.id);
    var rid = parseInt(req.params.rid);
    // if no date is given make it null, so the trigger can set the date
    var date = i.diagnoseDate || null;
    if (JSON.stringify(req.body) == '{}') {
        connection.release();
        next({code:'ER_BAD_NULL_ERROR'})
    } else {
        // query db
        // ? from query will be replaced by values in [] - including escaping!
        connection.query('call readingsUpdate(?,?,?,?,?, ?,?,?,?,?,'
            + '?,?,?,?,?, ?,?,?,?,?,'
            + '?,?,?,?,?, ?,?,?,?,?,'
            + '?,?,?,?,?, ?,?,?,?,?,'
            + '?,?,?,?,?, ?,?)',
            [rid, id, date, i.status, i.del_fef25_75_pro, i.del_fev1_post, i.del_fvc_pro,
                i.del_pef_pro, i.dlco_pro, i.fef25_75_pre_pro, i.fev1, i.fev1_fvc,
                i.fev1_fvc_pre, i.fev1_post, i.fev1_pre, i.fev1_pre_pro, i.fev1_pro,
                i.frc_pre, i.frc_pre_pro, i.fvc, i.fvc_post, i.fvc_pre,
                i.fvc_pre_pro, i.fvc_pro, i.hco3, i.height, i.hematocrit,
                i.kco_pro, i.mmrc, i.notes, i.paco2, i.pao2,
                i.pef_pre_pro, i.pH, i.pxy, i.rv, i.rv_pre,
                i.rv_pre_pro, i.rv_pro, i.rv_tlc, i.satO2_pro, i.smoker,
                i.tlc, i.tlc_pre, i.tlc_pre_pro, i.tlc_pro, i.weight],
            function (err, result) {
                connection.release();
                if (err) next(err);
                else {
                    res.affectedRows = result[0][0].affected_rows;
                    next();
                }
            });
    }
};

var respMessages = commons.respMsg("Readings");
exports.listSpec = {
    summary : "Get Readings Records of this Patient (Roles: doctor)",
    notes: "This Function lists all Readings for the given patient. <br>This function passes the parameters to the SP listExams. <br><br> <b>Parameters:</b> <br><br>  " +
    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> ",
    path : "/patients/{id}/readings",
    method: "GET",
    type : "ListReadings",
    nickname : "listReadings",
    parameters : [swagger.pathParam("id", "Patient where the records belong to", "string"),
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")],
    responseMessages: respMessages.list
};


exports.addSpec = {
    summary : "Add Readings Records (Roles: doctor)",
    notes: "This Function creates an new Readings Record. (if the Body contains patientId, its ignored) <br>This function passes its parameters to the SP readingsCreate. <br><br>" ,
    path : "/patients/{id}/readings",
    method: "POST",
    nickname : "addReadings",
    parameters : [swagger.bodyParam("Readings", "new Record", "NewReadings"),
        swagger.pathParam("id", "Patient where the records belong to", "string")],
    responseMessages: respMessages.add
};

exports.listOneSpec = {
    summary : "Get specific Readings Record of this Patient (Roles: doctor)",
    notes: "This Function returns the requested Readings record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP listSingleExams. <br><br>" ,
    path : "/patients/{id}/readings/{rid}",
    method: "GET",
    type : "Readings",
    nickname : "listOneReadings",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string")],
    responseMessages: respMessages.listOne
};


exports.delSpec = {
    summary : "Delete specific Readings Record of this Patient (Roles: doctor)",
    notes: "This Function deletes a record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP deleteExamRecord <br><br>" ,
    path : "/patients/{id}/readings/{rid}",
    method: "DELETE",
    nickname : "delReadings",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string")],
    responseMessages: respMessages.del
};

exports.updateSpec = {
    summary : "Update specific Readings Record of this Patient (Roles: doctor)",
    notes: "This Function updates a record, which is specified by the url. Any IDs in the Message Body are ignored. Instead the ids in the url are used. <br>This function passes its parameters to the SP readingsUpdate. <br><br>" ,
    path : "/patients/{id}/readings/{rid}",
    method: "PUT",
    nickname : "updateReadings",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string") ,
        swagger.bodyParam("Readings", "updated Readings Record", "NewReadings")],
    responseMessages: respMessages.update
};

var contents = {
    "patientId": {"type":"integer", "format": "int32", "description": "patientId"},
    "recordId":{"type":"integer","format": "int32","description": "Unique Identifier of this Record"},
    "diagnoseDate":{"type":"string","format": "Date", "description": "Date of Diagnose"},
    "status":{"type":"string","description" : "Status","enum":[ "baseline", "exacerbation"]},
    "del_fef25_75_pro": {"type":"number", "format": "float", "description": "del_fef25_75_pro"},
    "del_fev1_post": {"type":"number", "format": "float", "description": "del_fev1_post"},
    "del_fvc_pro": {"type":"number", "format": "float", "description": "del_fvc_pro"},
    "del_pef_pro": {"type":"number", "format": "float", "description": "del_pef_pro"},
    "dlco_pro": {"type":"number", "format": "float", "description": "dlco_pro"},
    "fef25_75_pre_pro": {"type":"number", "format": "float", "description": "fef25_75_pre_pro"},
    "fev1": {"type":"number", "format": "float", "description": "fev1"},
    "fev1_fvc": {"type":"number", "format": "float", "description": "fev1_fvc"},
    "fev1_fvc_pre": {"type":"number", "format": "float", "description": "fev1_fvc_pre"},
    "fev1_post": {"type":"number", "format": "float", "description": "fev1_post"},
    "fev1_pre": {"type":"number", "format": "float", "description": "fev1_pre"},
    "fev1_pre_pro": {"type":"number", "format": "float", "description": "fev1_pre_pro"},
    "fev1_pro": {"type":"number", "format": "float", "description": "fev1_pro"},
    "frc_pre": {"type":"number", "format": "float", "description": "frc_pre"},
    "frc_pre_pro": {"type":"number", "format": "float", "description": "frc_pre_pro"},
    "fvc": {"type":"number", "format": "float", "description": "fvc"},
    "fvc_post": {"type":"number", "format": "float", "description": "fvc_post"},
    "fvc_pre": {"type":"number", "format": "float", "description": "fvc_pre"},
    "fvc_pre_pro": {"type":"number", "format": "float", "description": "fvc_pre_pro"},
    "fvc_pro": {"type":"number", "format": "float", "description": "fvc_pro"},
    "hco3": {"type":"number", "format": "float", "description": "hco3"},
    "height": {"type":"integer", "format": "int32", "description": "height"},
    "hematocrit": {"type":"number", "format": "float", "description": "hematocrit"},
    "kco_pro": {"type":"number", "format": "float", "description": "kco_pro"},
    "mmrc": {"type":"integer", "format": "int32", "description": "mmrc"},
    "notes":{"type":"string","description" : "Notes"},
    "paco2": {"type":"number", "format": "float", "description": "paco2"},
    "pao2": {"type":"number", "format": "float", "description": "pao2"},
    "pef_pre_pro": {"type":"number", "format": "float", "description": "pef_pre_pro"},
    "pH": {"type":"number", "format": "float", "description": "pH"},
    "pxy": {"type":"integer", "format": "int32", "description": "pxy"},
    "rv": {"type":"number", "format": "float", "description": "rv"},
    "rv_pre": {"type":"number", "format": "float", "description": "rv_pre"},
    "rv_pre_pro": {"type":"number", "format": "float", "description": "rv_pre_pro"},
    "rv_pro": {"type":"number", "format": "float", "description": "rv_pro"},
    "rv_tlc": {"type":"number", "format": "float", "description": "rv_tlc"},
    "satO2_pro": {"type":"number", "format": "float", "description": "satO2_pro"},
    "smoker": {"type":"integer", "format": "int32", "description": "smoker"},
    "tlc": {"type":"number", "format": "float", "description": "tlc"},
    "tlc_pre": {"type":"number", "format": "float", "description": "tlc_pre"},
    "tlc_pre_pro": {"type":"number", "format": "float", "description": "tlc_pre_pro"},
    "tlc_pro": {"type":"number", "format": "float", "description": "tlc_pro"},
    "weight": {"type":"integer", "format": "int32", "description": "weight"}
};

exports.models = {
    "Readings":{
        "id":"Readings",
        "required": ["patientId","recordId","diagnoseDate","status","del_fef25_75_pro","del_fev1_post","del_fvc_pro","del_pef_pro","dlco_pro",
            "fef25_75_pre_pro","fev1","fev1_fvc","fev1_fvc_pre","fev1_post","fev1_pre","fev1_pre_pro","fev1_pro","frc_pre",
            "frc_pre_pro","fvc","fvc_post","fvc_pre","fvc_pre_pro","fvc_pro","hco3","height","hematocrit","kco_pro",
            "mmrc","notes","paco2","pao2","pef_pre_pro","pH","pxy","rv","rv_pre","rv_pre_pro","rv_pro","rv_tlc",
            "satO2_pro","smoker","tlc","tlc_pre","tlc_pre_pro","tlc_pro","weight"],
        "properties": contents
    },
    "NewReadings":{
        "id":"NewReadings",
        "required": ["status","del_fef25_75_pro","del_fev1_post","del_fvc_pro","del_pef_pro","dlco_pro",
            "fef25_75_pre_pro","fev1","fev1_fvc","fev1_fvc_pre","fev1_post","fev1_pre","fev1_pre_pro","fev1_pro","frc_pre",
            "frc_pre_pro","fvc","fvc_post","fvc_pre","fvc_pre_pro","fvc_pro","hco3","height","hematocrit","kco_pro",
            "mmrc","notes","paco2","pao2","pef_pre_pro","pH","pxy","rv","rv_pre","rv_pre_pro","rv_pro","rv_tlc",
            "satO2_pro","smoker","tlc","tlc_pre","tlc_pre_pro","tlc_pro","weight"],
        "properties":contents
    },
    "ListReadings":{
        "id":"ListReadings",
        "required": ["readings"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, readings : {"type" : "array", items : { "$ref" : "Readings"}}}

    }
};


