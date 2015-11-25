/**
 * Controller: A
 *
 * Contains Methods to GET to /dataFields (list)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var ssl = require('../config.js').ssl.useSsl;
var commons = require('./../controller/controller_commons.js');

/**
 *  GET /analyserOperators
 *
 *  Steps:
 *  	1) Get DB Connection
 *  	2) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	3) create SQL Query from parameters
 *  	4) add links to result
 *  	5) send
 */
exports.list = function(req, res, next1){
    var connection = req.con;
    // query
    var qry = 'SELECT * FROM analyserField_view ORDER BY dataId ASC ';
    
    var pagination = commons.getPaginationInfos(req.query.page, req.query.pageSize);
    qry += pagination.qry;
	
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query(qry, function(err, rows) {
        connection.release();
        if (err) next1(err);
        else {
            var fullResult = {
                DataField : []
            };
            if (rows.length > 0){
                var result = [];
                for (var i = 0; i < rows.length; i++){
                    var o  = rows[i];
                    o._links = {};
                    o._links.dataField = {};
                    o._links.dataField.href = '/analyse/options/dataFields/'+rows[i].dataId;
                    result.push(o);
                }
                fullResult.DataField = result;

                var links = commons.generateCollectionLinks(req.originalUrl.split('?')[0], pagination.page, pagination.pageSize, rows.length);

                fullResult._links = links;
            }
            res.result = fullResult;
            next1();
        }
    });
};

exports.listSpec = {
    summary : "Get All Data fields of the logged-in User",
    notes: "This Function lists all Data Fields for the current user. <br> <br><br>" +

    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " ,
    path : "/analyse/options/dataFields",
    method: "GET",
    type : "ListDataFields",
    nickname : "listDataFields",
    parameters : [
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20")
    ],
    responseMessages : [
        {
            code: 200,
            message: "List of Data Fields is supplied. ",
            responseModel : "ListDataFields"
        },
        {
            code: 204,
            message: "List (or the current page) has no items"
        },
        {
            code: 500,
            message: "Internal Server Error",
            responseModel : "ErrorMsg"
        }
    ]
};

exports.models = {
    "DataField":{
        "id" : "DataField",
        "required": ["dataId","table","name","description"],
        "properties":{
            "dataId": {"type":"integer", "format": "int32", "description": "Identifier of the notification"},
			"table": {"type":"string","format": "DataTable", "description": "Name of the table"},
            "name": {"type":"string","format": "FieldName", "description": "Name of the field in table"},
			"description": {"type":"string","format": "Operator", "description": "Description of the data field"}
        }
    },
    "ListDataFields":{
        "id":"ListDataFields",
        "required": ["DataField"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, DataField : {"type" : "array", items : { "$ref" : "DataField"}}}

    }
};