/**
 * Controller: Analysers rules
 *
 * Contains Methods to GET and POST to /analyser/{id}/rules (list and add)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var ssl = require('../config.js').ssl.useSsl;
var commons = require('./../controller/controller_commons.js');


/**
 *  GET /analyser/{id}/rules
 *    Steps:
 *      1) Validate Role
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.listOne = function(req,res,next){
    var connection = req.con;
    var id = req.params.id;
    var qry = 'call analyserRulesListOne(?, ?, ?)';
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    var pagination = commons.getPaginationInfos(req.query.page, req.query.pageSize);

    //query db
    connection.query(qry, [id, pagination.page, pagination.pageSize], function(err, rows) {
        connection.release();
        if (err) next(err);
        else {
            var fullResult = {
                analyserRules : []
            };
            // is there any result?
            if (rows[0].length > 0){
                var result = [];
                for (var i = 0; i < rows[0].length; i++){
                    var o  = rows[0][i];
                    // add "self" to all resources
                    o._links = {};
                    o._links.analyserId = {};
                    o._links.analyserId.href = '/analyse/analyser/'+rows[0][i].analyserId;
                    // create corresponding patients link
                    o._links.accountId = {};
                    o._links.accountId.href = '/account/'+rows[0][i].accountId;
                    result.push(o);
                }
                fullResult.analyserRules = result;

                var links = commons.generateCollectionLinks(req.originalUrl.split('?')[0], pagination.page, pagination.pageSize, rows.length);

                fullResult._links = links;
            }
            res.result = fullResult;
            next();
        }
    });
};

var respMessages = commons.respMsg("AnalyserRules");
exports.listOneSpec = {
    summary : "Get specific Analyser of this Account (Roles: admin, doctor and patient)",
    path : "/analyse/analyser/{id}/rules",
    notes: "This Function returns the requested analyser, if it exists and is visible to the current user. <br>This function passes the parameters to the SP analyserListOne. <br><br>" ,
    method: "GET",
    type : "ListAnalyserRules",
    nickname : "listAnalyserRules",
    parameters : [swagger.pathParam("id", "ID of the Analyser", "string")],
    responseMessages : respMessages.list
};


exports.models = {
    "AnalyserRule":{
        "id" : "AnalyserRule",
        "required": ["ruleId", "analyserId","accountId","operator","expression", "dataTable", "dataField", "searchValue", "rangeValue"],
        "properties":{
			"ruleId": {"type":"integer", "format": "int32", "description": "Identifier of the rule"},
            "analyserId": {"type":"integer", "format": "int32", "description": "Identifier of the analyser"},
			"accountId": {"type":"integer", "format": "int32", "description": "Identifier owner account"},
            "operator": {"type":"string","format": "Date", "description": "Type of the operator"},
			"expression": {"type":"string","format": "Date", "description": "Type of the expression"},
			"dataTable": {"type":"string","format": "Date", "description": "Name of the data table"},
			"dataField": {"type":"string","format": "Date", "description": "Field of the data value"},
			"searchValue": {"type":"string","format": "Date", "description": "Value of the analyser rule"},
			"rangeValue": {"type":"integer","format": "int32","description": "Value of selected data records"}
        }
    },
    "ListAnalyserRules":{
        "id":"ListAnalyserRules",
        "required": ["analysers"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, notifications : {"type" : "array", items : { "$ref" : "AnalyserRule"}}}

    }
};