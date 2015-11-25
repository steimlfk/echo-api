/**
 * Created by armin on 25.03.15.
 */
var commons = require('./controller_commons');
var swagger = require('swagger-node-express');

exports.list = function(req, res, next) {
    commons.list(req,res,next,'exacerbations');
};

exports.listOne = function(req, res, next) {
    commons.listOne(req, res, next, 'exacerbations');
};

exports.del = function(req,res,next){
    commons.del(req,res,next,'exacerbations');
};

exports.add = function(req,res,next) {
    var connection = req.con;
    // 4) create SQL Query from parameters
    var i = req.body;
    // any given ID in the body will be ignored and the ids from the url are used!
    var id = parseInt(req.params.id);
    // if no date is given make it null, so the trigger can set the date
    var date = i.diagnoseDate || null;
    console.log(i);
    console.log(date);
    // if no comment is given make it null.
    var hospitalization = i.hospitalization || null;
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query('call exacerbationCreate(?,?,?)',
        [id, date, hospitalization],
        function (err, result) {
            connection.release();
            if (err) next(err);
            else {
                res.loc  = '/patients/'+ id + '/exacerbations/' + result[0][0].insertId;
                res.modified = result[0][0].modified;
                next();
            }
        });
};

var respMessages = commons.respMsg("Exacerbation");
exports.listSpec = {
    summary : "Get the Exacerbation-History this Patient (Roles: doctor)",
    notes: "This Function lists all Exacerbation-Events for the given patient. <br>This function passes the parameters to the SP listExams. <br><br>   " +
    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " ,
    path : "/patients/{id}/exacerbations",
    method: "GET",
    type : "Exacerbations",
    nickname : "listExacerbations",
    parameters : [swagger.pathParam("id", "Patient", "string"),
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")],
    responseMessages: respMessages.list
};

exports.addSpec = {
    summary : "Add new Exacerbation-Event (Roles: doctor)",
    notes: "This Function creates a new exacerbations event. If the Body contains patientId, its ignored and the id from the url is taken. Also it will set the date if date is null. <br>This function passes its parameters to the SP exaCreate. <br><br>" ,
    path : "/patients/{id}/exacerbations",
    method: "POST",
    nickname : "addExacerbations",
    parameters : [swagger.bodyParam("NewExacerbation", "new Exacerbation", "NewExacerbations"), swagger.pathParam("id", "Patient", "string")],
    responseMessages: respMessages.add
};

exports.listOneSpec = {
    summary : "Get specific Severity Record of this Patient (Roles: doctor)",
    path : "/patients/{id}/exacerbations/{rid}",
    notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP listSingleExam. <br><br>" ,
    method: "GET",
    type : "Exacerbation",
    nickname : "listOneexacerbation",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string")],
    responseMessages: respMessages.listOne
};

exports.delSpec = {
    summary : "Delete specific Exacerbation Event of this Patient (Roles: doctor)",
    notes: "This Function deletes a record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP severityDelete <br><br>" ,
    path : "/patients/{id}/exacerbations/{rid}",
    method: "DELETE",
    nickname : "delRxacerbation",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.pathParam("rid", "ID of the Record", "string")],
    responseMessages: respMessages.del
};

var contents = {
    "patientId": {"type":"integer", "format": "int32", "description": "patientId"},
    "recordId":{"type":"integer","format": "int32","description": "Unique Identifier of this Record"},
    "date":{"type":"string","format": "Date", "description": "Date of this exacerbation."},
    "hospitalization":{"type":"boolean","description":"Was hospitalization necessary."},
};

exports.models = {
    "Exacerbation":{
        "id" : "Exacerbation",
        "required": ["patientId","recordId","date", "hospitalization"],
        "properties": contents
    },
    "NewExacerbation":{
        "id" : "NewExacerbation",
        "required": ["hospitalization"],
        "properties": contents
    },
    "ListExacerbation":{
        "id":"ListExacerbation",
        "required": ["exacerbations"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, exacerbation : {"type" : "array", items : { "$ref" : "Exacerbation"}}}
    }
};