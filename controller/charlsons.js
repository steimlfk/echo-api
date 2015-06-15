/**
 * Controller: Charlson Records
 *
 * Contains Methods to GET (imported from commons) and POST to /patients/id/charlsons (list and add)
 * And Methodes to GET (imported from commons), PUT and DELETE (imported from commons) /patients/id/charlsons/recordid (listOne, update and del)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var commons = require('./controller_commons.js');

/**
 *  GET /patients/id/charlsons
 */
exports.list = function(req,res,next){
    commons.list(req,res,next,'charlsons');
};
/**
 * GET /patients/id/charlsons/recordid
 */
exports.listOne = function(req,res,next){
    commons.listOne(req,res,next,'charlsons');
};
/**
 *  DELETE /patients/id/charlsons/recordid
 */
exports.del = function(req,res,next){
    commons.del(req,res,next,'charlsons');
};

/**
 *  POST /patients/id/charlsons
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
    // 4) create SQL Query from parameters }
    var i = req.body;
    // any given ID in the body will be ignored and the ids from the url are used!
    var id = parseInt(req.params.id);
    // if no date is given make it null, so the trigger can set the date
    var date = i.diagnoseDate || null;
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query('call charlsonCreate(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [id, date, i.aids, i.anyTumor, i.cerebrovascularDisease,
            i.chronicPulmonaryDiasease, i.congestiveHeartFailure, i.connectiveTissueDisease, i.dementia,
            i.diabetes, i.diabetesWithEndOrganDamage, i.hemiplegia, i.leukemia, i.liverDiseaseMild,
            i.liverDiseaseModerateOrSevere, i.malignantLymphoma, i.metastaticSolidMalignancy,
            i.myocardialInfarction, i.peripheralVascularDisease, i.renalDiseaseModerateOrSevere,
            i.ulcerDisease, i.noConditionAvailable], function (err, result) {
            connection.release();
            if (err) next(err);
            else {
                res.loc = '/patients/' + id + '/charlsons/' + result[0][0].insertId;
                next();
            }
        });
};

/**
 *  PUT /patients/id/charlsons/recordid
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
    connection.query('call charlsonUpdate(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [rid, id, date, i.aids, i.anyTumor, i.cerebrovascularDisease,
            i.chronicPulmonaryDiasease, i.congestiveHeartFailure, i.connectiveTissueDisease, i.dementia,
            i.diabetes, i.diabetesWithEndOrganDamage, i.hemiplegia, i.leukemia, i.liverDiseaseMild,
            i.liverDiseaseModerateOrSevere, i.malignantLymphoma, i.metastaticSolidMalignancy,
            i.myocardialInfarction, i.peripheralVascularDisease, i.renalDiseaseModerateOrSevere,
            i.ulcerDisease, i.noConditionAvailable], function (err, result) {
            connection.release();
            if (err) next(err);
            else {
                // record  was updated
                res.affectedRows = result[0][0].affected_rows > 0;
                next();
            }
        });
};

var respMessages = commons.respMsg("Charlson");
exports.listSpec = {
    summary : "Get Charlson Records of this Patient (Roles: doctor)",
    notes: "This Function lists all Charlson Tests for the given patient. <br>This function passes the parameters to the SP listExams. <br><br> <b>Parameters:</b> <br><br>  " +
    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> ",
    path : "/patients/{id}/charlsons",
    method: "GET",
    type : "ListCharlson",
    nickname : "listCharlson",
    parameters : [swagger.pathParam("id", "Patient where the records belong to", "string"),
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")],
    responseMessages: respMessages.list
};


exports.addSpec = {
    summary : "Add  Charlson Records (Roles: doctor)",
    notes: "This Function creates a new Charlsons Record. If the Body contains patientId, its ignored. The Score Value don't has to be provided as the Database will calculate it. Also it will set the date if date is null. <br>This function passes its parameters to the SP charlsonCreate. <br><br>" ,
    path : "/patients/{id}/charlsons",
    method: "POST",
    nickname : "addCharlson",
    parameters : [swagger.bodyParam("Charlson", "new Record", "NewCharlson"), swagger.pathParam("id", "Patient where the records belong to", "string")],
    responseMessages: respMessages.add
};

exports.listOneSpec = {
    summary : "Get specific Charlson Record of this Patient (Roles: doctor)",
    notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP listSingleExams. <br><br>" ,
    path : "/patients/{id}/charlsons/{rid}",
    method: "GET",
    type : "Charlson",
    nickname : "listOneCharlson",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string")],
    responseMessages: respMessages.listOne
};


exports.delSpec = {
    summary : "Delete specific Charlson Record of this Patient (Roles: doctor)",
    notes: "This Function deletes a record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP deleteExamRecord <br><br>" ,
    path : "/patients/{id}/charlsons/{rid}",
    method: "DELETE",
    nickname : "delCharlson",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string")],
    responseMessages: respMessages.del
};

exports.updateSpec = {
    summary : "Update specific Charlson Record of this Patient (Roles: doctor)",
    notes: "This Function updates a record, which is specified by the url. The accountId in the Message Body is ignored. <br>This function passes its parameters to the SP charlsonUpdate. <br><br>" ,
    path : "/patients/{id}/charlsons/{rid}",
    method: "PUT",
    nickname : "updateCharlson",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"), swagger.pathParam("rid", "ID of the Record", "string") ,swagger.bodyParam("Charlson", "updated Charlson Record", "NewCharlson")],
    responseMessages: respMessages.update
};


var contents = {
    "patientId":{
        "type":"integer",
        "format": "int32",
        "description": "Unique Identifier of the Patient"
    },
    "diagnoseDate":{
        "type":"string",
        "format": "Date",
        "description": "Date of Diagnose"
    },
    "recordId":{
        "type":"integer",
        "format": "int32",
        "description": "Unique Identifier of this Record"
    },
    "myocardialInfarction":{
        "type":"boolean","description": "Value for given Answer"
    },
    "congestiveHeartFailure":{
        "type":"boolean","description": "Value for given Answer"
    },
    "peripheralVascularDisease":{
        "type":"boolean","description": "Value for given Answer"
    },
    "cerebrovascularDisease":{
        "type":"boolean","description": "Value for given Answer"
    },
    "dementia":{
        "type":"boolean","description": "Value for given Answer"
    },
    "chronicPulmonaryDiasease":{
        "type":"boolean","description": "Value for given Answer"
    },
    "connectiveTissueDisease":{
        "type":"boolean","description": "Value for given Answer"
    },
    "ulcerDisease":{
        "type":"boolean","description": "Value for given Answer"
    },
    "liverDiseaseMild":{
        "type":"boolean","description": "Value for given Answer"
    },
    "diabetes":{
        "type":"boolean","description": "Value for given Answer"
    },
    "hemiplegia":{
        "type":"boolean","description": "Value for given Answer"
    },
    "renalDiseaseModerateOrSevere":{
        "type":"boolean","description": "Value for given Answer"
    },
    "diabetesWithEndOrganDamage":{
        "type":"boolean","description": "Value for given Answer"
    },
    "anyTumor":{
        "type":"boolean","description": "Value for given Answer"
    },
    "metastaticSolidMalignancy":{
        "type":"boolean","description": "Value for given Answer"
    },
    "leukemia":{
        "type":"boolean","description": "Value for given Answer"
    },
    "malignantLymphoma":{
        "type":"boolean","description": "Value for given Answer"

    },
    "liverDiseaseModerateOrSevere":{
        "type":"boolean","description": "Value for given Answer"
    },
    "aids":{
        "type":"boolean","description": "Value for given Answer"
    },
    "noConditionAvailable":{
        "type":"boolean","description": "Value for given Answer"
    },
    "totalCharlson":{
        "type":"integer", "format": "int32","description": "Value for given Answer"
    }
};

exports.models = {
    "Charlson":{
        "id":"Charlson",
        "required": ["patientId","recordId","diagnoseDate","myocardialInfarction","congestiveHeartFailure","peripheralVascularDisease",
            "cerebrovascularDisease","dementia","chronicPulmonaryDiasease","connectiveTissueDisease","ulcerDisease","liverDiseaseMild",
            "diabetes","hemiplegia","renalDiseaseModerateOrSevere","diabetesWithEndOrganDamage","anyTumor","leukemia","malignantLymphoma",
            "liverDiseaseModerateOrSevere","metastaticSolidMalignancy","aids","noConditionAvailable","totalCharlson"],
        "properties": contents
    },
    "NewCharlson":{
        "id":"NewCharlson",
        "required": ["myocardialInfarction","congestiveHeartFailure","peripheralVascularDisease",
            "cerebrovascularDisease","dementia","chronicPulmonaryDiasease","connectiveTissueDisease","ulcerDisease","liverDiseaseMild",
            "diabetes","hemiplegia","renalDiseaseModerateOrSevere","diabetesWithEndOrganDamage","anyTumor","leukemia","malignantLymphoma",
            "liverDiseaseModerateOrSevere","metastaticSolidMalignancy","aids","noConditionAvailable"],
        "properties": contents
    },
    "ListCharlson":{
        "id":"ListCharlson",
        "required": ["charlsons"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, charlsons : {"type" : "array", items : { "$ref" : "Charlson"}}}

    }
};


