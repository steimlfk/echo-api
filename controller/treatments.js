/**
 * Controller: Treatment Records
 *
 * Contains Methods to GET (imported from commons) and POST to /patients/id/treatments (list and add)
 * And Methodes to GET (imported from commons), PUT and DELETE (imported from commons) /patients/id/treatments/recordid (listOne, update and del)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var commons = require('./controller_commons.js');

/**
 *  GET /patients/id/treatments
 */
exports.list = function(req,res,next){
    commons.list(req,res,next,'treatments');
};

/**
 * GET /patients/id/treatments/recordid
 */
exports.listOne = function(req,res,next){
    commons.listOne(req,res,next,'treatments');
};

/**
 *  DELETE /patients/id/treatments/recordid
 */
exports.del = function(req,res,next){
    commons.del(req,res,next,'treatments');
};

/**
 *  POST /patients/id/treatments
 *  Steps:
 *  	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
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
    connection.query('call treatmentCreate(?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?,?)',
        [id, date,status,i.antibiotics,i.antiflu,i.antipneum,i.lama,i.longActingB2,
            i.ltot,i.ltotDevice,i.ltotStart,i.mycolytocis,i.niv,i.pdef4Inhalator,i.sama,i.shortActingB2,
            i.steroidsInhaled,i.steroidsOral,i.theophyline,i.ultraLongB2,i.ventilationDevice,i.ventilationStart, i.other],
        function(err, result) {
            connection.release();
            if (err) next(err);
            else {
                var analyzer = require('./notify.js');
                var dailyAnalyzer = new analyzer();
                // this postpones the analysis of the data until the POST is completely processed
                process.nextTick (function (){
                    dailyAnalyzer.emit('goldAnalyzes', id);
                });
                // resource was created
                // link will be provided in location header
                res.loc = '/patients/'+ id + '/treatments/' + result[0][0].insertId;
                next();
            }
        });
};

/**
 *  PUT /patients/id/treatments/recordid
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
    connection.query('call treatmentUpdate(?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?,?,?)',
        [rid, id, date,status,i.antibiotics,i.antiflu,i.antipneum,i.lama,i.longActingB2,
            i.ltot,i.ltotDevice,i.ltotStart,i.mycolytocis,i.niv,i.pdef4Inhalator,i.sama,i.shortActingB2,
            i.steroidsInhaled,i.steroidsOral,i.theophyline,i.ultraLongB2,i.ventilationDevice,i.ventilationStart, i.other],
        function(err, result) {
            connection.release();
            if (err) next(err);
            else {
                res.affectedRows = result[0][0].affected_rows;
                next();
            }
        });
};

exports.listSpec = {
    summary : "Get Treatment Records of this Patient (Roles: doctor)",
    notes: "This Function lists all Treatment Records for the given patient. <br>This function passes the parameters to the SP listExams. <br><br> <b>Parameters:</b> <br><br>  " +
    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " +
    "<b>Possible Results</b>: <br>" +
    " <b>200</b>  List of Readings is supplied. Format cats: [Array of treatments Model] <br>" +
    " <b>204</b>  List (or the current page) is currently empty <br>" +
    " <b>403</b>  The current user isnt allowed to access the data of the given patient <br>" +
    " <b>500</b> Internal Server Error",
    path : "/patients/{id}/treatments",
    method: "GET",
    type : "ListTreatment",
    nickname : "listTreatment",
    parameters : [swagger.pathParam("id", "Patient where the records belong to", "string"),
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")]
};


exports.addSpec = {
    summary : "Add  Treatment Records (Roles: doctor)",
    notes: "This Function creates an new Catscale Record. (if the Body contains patientId, its ignored) <br>This function passes its parameters to the SP treamtentCreate. <br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>201</b>  Record is created and the location is returned in the Location Header <br>" +
    " <b>400</b>  The provided data contains errors, e.g. a invalid value for status <br>" +
    " <b>403</b>  The logged in user isnt allowed to create a record with this data.<br>"+
    " <b>500</b> Internal Server Error",
    path : "/patients/{id}/treatments",
    method: "POST",
    nickname : "addTreatment",
    parameters : [swagger.bodyParam("Treatment", "new Record", "NewTreatment"),
        swagger.pathParam("id", "Patient where the records belong to", "string")]

};

exports.listOneSpec = {
    summary : "Get specific Treatment Record of this Patient (Roles: doctor)",
    notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP listSingleExams. <br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>200</b>  Record is supplied <br>" +
    " <b>403</b>  The current user isnt allowed to access the data of the given patient <br>" +
    " <b>404</b>  The requested record doesnt exist. <br>" +
    " <b>500</b> Internal Server Error",
    path : "/patients/{id}/treatments/{rid}",
    method: "GET",
    type : "Treatment",
    nickname : "listOneTreatment",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string")]

};


exports.delSpec = {
    summary : "Delete specific Treatment Record of this Patient (Roles: doctor)",
    notes: "This Function deletes a record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP deleteExamRecord <br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>204</b>  Record was deleted. <br>" +
    " <b>404</b>  Record is either not visible to the current user or doesnt exist. <br>" +
    " <b>500</b> Internal Server Error",
    path : "/patients/{id}/treatments/{rid}",
    method: "DELETE",
    nickname : "delTreatment",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string")]

};

exports.updateSpec = {
    summary : "Update specific Treatment Record of this Patient (Roles: doctor)",
    path : "/patients/{id}/treatments/{rid}",
    notes: "This Function updates an Account, which is specified by the url. The accountId in the Message Body is ignored. <br>This function passes its parameters to the SP treatmentUpdate. <br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>204</b>  Record was updated. <br>" +
    " <b>400</b>  The provided data contains errors, e.g. a invalid value for status <br>" +
    " <b>404</b>  Record is either not visible to the current user or doesnt exist. <br>" +
    " <b>500</b> Internal Server Error",
    method: "PUT",
    nickname : "updateTreatment",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string") ,
        swagger.bodyParam("Treatment", "updated Treatment Record", "NewTreatment")]
};

var contents = {
    "patientId": {"type":"integer", "format": "int32", "description": "patientId"},
    "recordId":{"type":"integer","format": "int32","description": "Unique Identifier of this Record"},
    "diagnoseDate":{"type":"string","format": "Date", "description": "Date of Diagnose"},
    "status":{"type":"string","description" : "Status","enum":[ "baseline", "exacerbation"]},
    "antibiotics":{"type":"boolean","description": "antibiotics"},
    "antiflu":{"type":"boolean","description": "antiflu"},
    "antipneum":{"type":"boolean","description": "antipneum"},
    "lama":{"type":"boolean","description": "lama"},
    "longActingB2":{"type":"boolean","description": "longActingB2"},
    "ltot":{"type":"boolean","description": "ltot"},
    "ltotDevice":{"type":"string","description" : "LTOT Device","enum":[ "none", "Concetrator", "Cylinder", "Liquid"]},
    "ltotStartDate":{"type":"string","format": "Date", "description": "Date of LTOT Start"},
    "mycolytocis":{"type":"boolean","description": "mycolytocis"},
    "niv":{"type":"boolean","description": "niv"},
    "pdef4Inhalator":{"type":"boolean","description": "pdef4Inhalator"},
    "sama":{"type":"boolean","description": "sama"},
    "shortActingB2":{"type":"boolean","description": "shortActingB2"},
    "steroidsInhaled":{"type":"boolean","description": "steroidsInhaled"},
    "steroidsOral":{"type":"boolean","description": "steroidsOral"},
    "theophyline":{"type":"boolean","description": "theophyline"},
    "ultraLongB2":{"type":"boolean","description": "ultraLongB2"},
    "ventilationDevice":{"type":"string","description" : "Ventilation Device","enum":[ "none", "CPAP", "BiPAP"]},
    "ventilationStart":{"type":"string","format": "Date", "description": "Date of Ventilation Start"},
    "other": {"type":"string","description" : "Other notes about treatment"}
};

exports.models = {
    "Treatment":{
        "id":"Treatment",
        "required": ["patientId","recordId","diagnoseDate","status","antibiotics","antiflu","antipneum","lama","longActingB2","ltot",
            "ltotDevice","ltotStart","mycolytocis","niv","pdef4Inhalator","sama","shortActingB2","steroidsInhaled",
            "steroidsOral","theophyline","ultraLongB2","ventilationDevice","ventilationStart", "other"],
        "properties": contents
    },
    "NewTreatment":{
        "id":"NewTreatment",
        "required": ["patientId","diagnoseDate","status","antibiotics","antiflu","antipneum","lama","longActingB2","ltot",
            "ltotDevice","ltotStart","mycolytocis","niv","pdef4Inhalator","sama","shortActingB2","steroidsInhaled",
            "steroidsOral","theophyline","ultraLongB2","ventilationDevice","ventilationStart", "other"],
        "properties": contents
    },
    "ListTreatment":{
        "id":"ListTreatment",
        "required": ["treatments"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, treatments : {"type" : "array", items : { "$ref" : "Treatment"}}}

    }
};
