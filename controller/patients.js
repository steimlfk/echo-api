/**
 * Controller: Patients
 *
 * Contains Methods to GET and POST to /accounts (list and add)
 * And Methodes to GET, PUT and DELETE /accounts/id (listOne, update and del)
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var commons = require('./controller_commons.js');

/**
 *  GET /patients
 *
 *  Steps:
 *  	1) Role Check
 *  	2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.list = function(req,res,next1){
    var connection = req.con;
    // 3) create SQL Query from parameters
    // set base statement
    var qry = 'SELECT * FROM patients_view WHERE enabled=1';
    // extending statement if req.query.sortBy (/accounts?sortBy=<sort>) contains a vaild value
    // if its not valid: set it to primary key
    var sort = 'patientId';
    var order = 'ASC';
    if (req.query.sortBy){
        switch (req.query.sortBy){
            case 'email': sort = 'email'; break;
        }
        qry += ' ORDER BY ' + sort + ' ';
        if (req.query.order){
            if (req.query.order.toLowerCase() == 'desc') order = 'DESC';
        }
        qry += order;
    }

    var pagination = commons.getPaginationInfos(req.query.page, req.query.pageSize);
    qry += pagination.qry;

    // execute query
    connection.query(qry, function(err, rows) {
        connection.release();
        if (err) next1(err);
        else {
            var fullResult = {
                patients:[]
            };
            // is there any result?
            if (rows.length > 0) {
                var result = [];
                for (var i = 0; i < rows.length; i++) {
                    var o = rows[i];
                    o._links = {};
                    // create self link
                    o._links.self = {};
                    o._links.self.href = '/patients/' + rows[i].patientId;
                    result.push(o);
                }
                fullResult.patients = result;

                var links = commons.generateCollectionLinks(req.originalUrl.split('?')[0], pagination.page, pagination.pageSize, rows.length);
                if  (req.query.sortBy) {
                    if (links.self) links.self += '&sortBy=' + sort;
                    if (links.first) links.first += '&sortBy=' + sort;
                    if (links.next) links.next += '&sortBy=' + sort;
                    if (links.back) links.back += '&sortBy=' + sort;
                    if (req.query.order) {
                        if (links.self) links.self += '&order=' + order;
                        if (links.first) links.first += '&order=' + order;
                        if (links.next) links.next += '&order=' + order;
                        if (links.back) links.back += '&order=' + order;
                    }
                }
                fullResult._links = links;
            }
            res.result = fullResult;
            next1();
        }
    });
};

/**
 *  GET /patients/id
 *    Steps:
 *    	1) Role Check
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.listOne = function(req,res,next){
    var connection = req.con;
    // 3) create SQL Query from parameters
    var qry =  'SELECT * FROM patients_view where patientId=?';
    // query db
    // ? from query will be replaced by values in [] - including escaping!
    connection.query(qry, [req.params.id], function(err, rows) {
        connection.release();
        if (err) next(err);
        else {// there was a matching patient
            var fullResult = {};
            if (rows.length > 0) {
                var o = rows[0];
                o._links = {};
                // add self link
                o._links.self = {};
                o._links.self.href = '/patients/' + rows[0].patientId;
                fullResult = o;
            }
            res.result = fullResult;
            next();

        }
    });

};

/**
 *  POST /patients
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
    // set doctor id to current user if current user is doctor
    var doc_id = i.doctorId;
    if (req.user.role == 'doctor') doc_id = req.user.accountId;
    connection.query('CALL patientsCreate(?,?,?,?,?,?,?,?,?,?,?,?)', [i.accountId, doc_id, i.firstName, i.lastName, i.secondName, i.socialId, i.sex, i.dateOfBirth, i.firstDiagnoseDate, i.fileId, i.fullAddress, i.landline], function(err, result) {
        connection.release();
        if (err) next(err);
        else {
            res.loc = '/patients/' + i.accountId;
            res.modified = result[0][0].modified;
            next();
        }
    });
};

/**
 *  DELETE /patients/id
 *  Steps:
 *  	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create and execute SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.del =   function(req,res,next){

    var connection = req.con;
    // 4) create and execute SQL Query from parameters,
    // ? from query will be replaced by values in [] - including escaping!
    connection.query('CALL patientsDelete(?)', req.params.id, function(err, result) {
        connection.release();
        if (err) next(err);
        else {
            res.affectedRows = result[0][0].affected_rows > 0;
            next();
        }
    });

};

/**
 *  PUT /patients/id
 *  Steps:
 *  	1) Validate Role
 *  	2) Get DB Connection
 *  	3) Change connected user to currently loggend in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.update = function(req,res,next){
    var connection = req.con;
    // 4) create SQL Query from parameters
    var i = req.body;
    if (JSON.stringify(req.body) == '{}') {
        connection.release();
        next({code:'ER_BAD_NULL_ERROR'})
    } else {
        connection.query('Call patientsRessourceUpdate(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [req.params.id, i.doctorId, i.firstName, i.lastName, i.secondName, i.socialId, i.sex, i.dateOfBirth,
                i.firstDiagnoseDate, i.fileId, i.fullAddress, i.landline, i.email, i.mobile], function (err, result) {
                connection.release();
                if (err) next(err);
                else {
                    res.affectedRows = result[0][0].affected_rows;
                    next();
                }
            });
    }
};


exports.listSpec = {
    summary : "List All enabled Patients (Roles: doctor and admin)",
    notes: "This Function lists all Patients which are visible to the logged in user and are enabled. <br>This function constructs a sql query from the parameters and executes it on patients_view. <br><br> <b>Parameters:</b> <br><br>  " +
    "<b>Pagination</b>: If you provide a page and a pageSize, the result is only the requested part of the list. If the value of page is too big, an empty list is returned. If you provide a Pagecount without Pagesize, Pagesize is 20. <br> " +
    "<b>Sorting</b>: If a valid column (patientId or email) is provided the result will be ordered after that column. If the role is not valid, the parameter is set to patientId.<br><br>",
    path : "/patients",
    method: "GET",
    type : "ListPatient",
    nickname : "listPatients",
    parameters : [
        swagger.queryParam("page", "Page Count for Pagination", "string", false, null, "1"),
        swagger.queryParam("pageSize", "Page Size for Pagination. Default is 20", "string", false, null, "20"),
        swagger.queryParam("sortBy", "Name of the Column to sort after", "string",false, ["patientId","email"]),
        swagger.queryParam("order", "ASCending or DESCending", "string", false, ["asc","desc"])
    ],
    responseMessages :
        [
            {
                code: 200,
                message: "List of Patients is supplied.",
                responseModel : "ListPatient"
            },
            {
                code: 204,
                message: "List (or the current page) has no items"
            },
            {
                code: 401,
                message: "The logged-in user isnt allowed to use this function ",
                responseModel : "ErrorMsg"
            },
            {
                code: 500,
                message: "Internal Server Error",
                responseModel : "ErrorMsg"
            }
        ]

};
exports.listOneSpec = {
    summary : "Get specific Patient (Roles: doctor and admin)",
    notes: "This Function returns the requested Patient, if it exists and is visible to the current user. <br>This function constructs a sql query from the parameters and executes it on patients_view. <br><br>" ,
    path : "/patients/{id}",
    method: "GET",
    type : "Patient",
    nickname : "listOnePatient",
    parameters : [swagger.pathParam("id", "ID of the patient which needs to be fetched", "string")],
    responseMessages : [
        {
            code: 200,
            message: "Patient is supplied.",
            responseModel : "Patient"
        },
        {
            code: 404,
            message: "The requested patient doesnt exist or the current user isnt allowed to view it.."
        },
        {
            code: 401,
            message: "The logged-in user isnt allowed to use this function ",
            responseModel : "ErrorMsg"
        },
        {
            code: 500,
            message: "Internal Server Error",
            responseModel : "ErrorMsg"
        }
    ]

};

exports.addSpec = {
    summary : "Create Patient (Roles: doctor and admin)",
    notes: "This Function creates an new Patient. <br>This function passes its parameters to the SP patientsCreate <br><br>" ,
    path : "/patients",
    method: "POST",
    nickname : "addPatient",
    parameters : [swagger.bodyParam("Patient", "new Patient Record", "NewPatient")],
    responseMessages : [
        {
            code: 201,
            message: "Patient is created and the location is returned in the Location Header"
        },
        {
            code: 400,
            message: " The provided data contains errors, e.g. SocialID or FileID are not unique. s",
            responseModel : "ErrorMsg"
        },
        {
            code: 401,
            message: "The logged-in user isnt allowed to use this function ",
            responseModel : "ErrorMsg"
        },
        {
            code: 500,
            message: "Internal Server Error",
            responseModel : "ErrorMsg"
        }
    ]

};

exports.delSpec = {
    summary : "Delete specific Patient (Roles: doctor and admin)",
    notes: "This Function deletes a Patients Record, which is specified by the url.  <br>This function passes its parameters to the SP patientsDelete <br><br>" ,
    path : "/patients/{id}",
    method: "DELETE",
    nickname : "delPatient",
    parameters : [swagger.pathParam("id", "Patient to delete", "string")],
    responseMessages :
        [
            {
                code: 204,
                message: "Patient was deleted"
            },
            {
                code: 404,
                message: "Patient is either not visible to the current user or doesnt exist.",
                responseModel : "ErrorMsg"
            },
            {
                code: 401,
                message: "The logged-in user isnt allowed to use this function ",
                responseModel : "ErrorMsg"
            },
            {
                code: 500,
                message: "Internal Server Error",
                responseModel : "ErrorMsg"
            }
        ]

};
exports.updateSpec = {
    summary : "Update specific Patient (Roles: doctor and admin)",
    notes: "This Function updates a Patients record, which is specified by the url. An accountId in the Message Body is ignored. <br>This function passes its parameters to the SP patientsUpdate <br><br>" ,
    path : "/patients/{id}",
    method: "PUT",
    nickname : "updatePatient",
    parameters : [swagger.pathParam("id", "Patient to update", "string"),swagger.bodyParam("Patient", "updated Patient Record", "Patient")],
    responseMessages : [
        {
            code: 204,
            message: "Patient was updated"
        },
        {
            code: 400,
            message: " Patient cant be updated using the provided data since the provided data contains errors, e.g. SocialID or FileID are not unique.",
            responseModel : "ErrorMsg"
        },
        {
            code: 403,
            message: "The current user isnt allowed to alter the specified patient.",
            responseModel : "ErrorMsg"
        },
        {
            code: 401,
            message: "The logged-in user isnt allowed to use this function ",
            responseModel : "ErrorMsg"
        },
        {
            code: 500,
            message: "Internal Server Error",
            responseModel : "ErrorMsg"
        }
    ]

};

var  contents =  {
    "doctorId": {"type":"integer", "format" : "int32", "description": "Identifier of the Responsible Doctor"},
    "accountId": { "type":"integer","format": "int32","description": "Unique Identifier and ID of the corresponding Account"},
    "lastName": {"type":"string","description": "Patients Last Name"},
    "firstName": {"type":"string","description": "Patient's first Name"},
    "secondName": {"type":"string","description": "Patients second Name"},
    "dateOfBirth": {"type":"string","format":"date","description": "Date of Birth"},
    "sex": {"type":"string","enum": ["0","1"] ,"description": "Sex (1 is male)"},
    "firstDiagnoseDate": {"type":"string","format":"date","description": "Date of First Diagnose"},
    "socialId": {"type":"string","description": "Patients social ID"},
    "fileId": {"type":"string","description": "Patient File Id"},
    "fullAddress": {"type":"string","description": "Patients address"},
    "landline": {"type":"string","description": "Patients phone number"},
    "currentSeverity":{"type":"string","description":"current severity level.", "enum":["A", "B", "C", "D"]}
};
exports.contents = contents;

exports.models = {
    "Patient":{
        "id": "Patient",
        "required":["dateOfBirth", "doctorId","accountId", "firstDiagnoseDate", "firstName","lastName","secondName","sex","fileId", "mobile", "email", "fullAddress", "socialId", "landline"],
        "properties": contents
    },
    "NewPatient":{
        "id": "Patient",
        "required":["dateOfBirth","accountId","doctorId","firstDiagnoseDate", "firstName","lastName","sex","fileId", "fullAddress", "socialId"],
        "properties":contents
    },
    "ListPatient":{
        "id":"ListPatient",
        "required": ["patients"],
        "properties": { _links : { "$ref" : "CollectionLinks"}, patients : {"type" : "array", items : { "$ref" : "Patient"}}}

    }
};

