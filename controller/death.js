/**
 * Controller: Death Reports
 *
 * Contains Methods to GET, POST, PUT and DELETE to /patients/id/death
 *
 * Contains swagger specs and models
 */
var swagger = require('swagger-node-express');
var request = require('request');
var ssl = require('../config.js').ssl.useSsl;

/**
 *  GET /patients/id/death
 *    Steps:
 *    	1) Validate Role!
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.list = function(req, res, next){
    var connection = req.con;
    // query
    var qry = 'call deathGet(?)';
    connection.query(qry, [req.params.id], function(err, rows) {
        connection.release();
        if (err) next(err);
        else {
            var fullResult = {};
            // row found
            if (rows[0].length > 0){
                var host = ((ssl)?'https://':'http://')+req.headers.host;
                var o  = rows[0][0];
                o._links = {};
                // add self link
                o._links.self = {};
                o._links.self.href = host+'/patients/'+req.params.id+'/death';
                // add patients link
                o._links.patient = {};
                o._links.patient.href = host+'/patients/'+req.params.id;
                fullResult = o;
            }
            res.result = fullResult;
            next();
        }
    });
};

/**
 *  DELETE /patients/id/death
 *    Steps:
 *      1) Validate Role
 *  	2) Get DB Connection
 *  	3) Change connected user to currently logged in user (found via req.user, which was populated by passport)
 *  	4) create SQL Query from parameters
 *  	5) add links to result
 *  	6) send
 */
exports.del = function(req, res, next, exam){
    var connection = req.con;
    // query
    var i = req.body;
    var id = parseInt(req.params.id);
    connection.query('call deathDelete(?)', [id], function(err, result) {
        connection.release();
        if (err) next(err);
        else {
            res.affectedRows = result[0][0].affected_rows > 0;
            next();
        }
    });
};

/**
 *  PUT /patients/id/death
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
    // query
    var i = req.body;
    var id = parseInt(req.params.id);
    // set date to null if date not set, so db can set it
    var date = i.diagnoseDate || null;
    connection.query('call deathUpdate(?,?,?, ?,?,?,?)',
        [id, date,i.cardiovascular,i.respiratory,i.infectious_disease,i.malignancy,i.other], function(err, result) {
            connection.release();
            if (err) next(err);
            else {
				
				// Notify flow engine
				process.nextTick (function (){
					request.post({url:'http://localhost:1880/analyzer/new_report', form: {url:'/patients/'+ id + '/death', type: 'death'}}, function(err,httpResponse,body){ 
						if (!err && httpResponse.statusCode == 200) {
				    		console.log(body);
				    	}
					});
				});
				
                res.affectedRows = result[0][0].affected_rows > 0;
                next();
            }
        });
};

/**
 *  POST /patients/id/death
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
    // query
    var i = req.body;
    var id = parseInt(req.params.id);
    // set date to null if date not set, so db can set it
    var date = i.diagnoseDate || null;
    connection.query('call deathCreate(?,?,?, ?,?,?,?)',
        [id, date, i.cardiovascular,i.respiratory,i.infectious_disease,i.malignancy,i.other], function(err, result) {
            connection.release();
            if (err) next(err);
            else {
				
				// Notify flow engine
				process.nextTick (function (){
					request.post({url:'http://localhost:1880/analyzer/new_report', form: {url:'/patients/'+ id + '/death', type: 'death'}}, function(err,httpResponse,body){ 
						if (!err && httpResponse.statusCode == 200) {
				    		console.log(body);
				    	}
					});
				});
				
                res.loc = '/patients/'+ id + '/death';
                res.modified = result[0][0].modified;
                next();
            }
        });
};
var commons = require('./controller_commons');
var respMessages = commons.respMsg("Death");
exports.listSpec = {
    summary : "Get Death Record of this Patient (Roles: doctor)",
    notes: "This Function returns the requested record, if it exists and is visible to the current user. <br>This function passes the parameters to the SP deathGet. <br><br>" ,
    path : "/patients/{id}/death",
    method: "GET",
    type : "Death",
    nickname : "listDeath",
    parameters : [swagger.pathParam("id", "Patient where the records belong to", "string")],
    responseMessages: respMessages.listOne

};


exports.addSpec = {
    summary : "Add  Death Records (Roles: doctor)",
    notes: "This Function creates an new Death Record. (if the Body contains patientId, its ignored) <br>This function passes its parameters to the SP deathCreate. <br><br>" ,
    path : "/patients/{id}/death",
    method: "POST",
    nickname : "addDeath",
    parameters : [swagger.bodyParam("Death", "new Record", "Death"),
        swagger.pathParam("id", "Patient where the records belong to", "string")],
    responseMessages: respMessages.add

};

exports.delSpec = {
    summary : "Delete Death Record of this Patient (Roles: doctor)",
    notes: "This Function deletes the death record, which is specified by the url. (if the Body contains ids, theyre ignored) <br>This function passes its parameters to the SP deathDelete <br><br>" ,
    path : "/patients/{id}/death",
    method: "DELETE",
    nickname : "delDeath",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string")],
    responseMessages: respMessages.del

};

exports.updateSpec = {
    summary : "Update specific Death Record of this Patient (Roles: doctor)",
    notes: "This Function updates the death record, which is specified by the url. Any IDs in the Message Body are ignored. Instead the ids in the url are used. <br>This function passes its parameters to the SP deathUpdate. <br><br>" ,
    path : "/patients/{id}/death/",
    method: "PUT",
    nickname : "updateDeath",
    parameters : [swagger.pathParam("id", "ID of the Patient", "string"),
        swagger.bodyParam("Death", "updated Treatment Record", "Death")],
    responseMessages: respMessages.update
};


exports.models = {
    "Death":{
        "id":"Death",
        "required": ["date","cardiovascular","respiratory","infectious_disease","malignancy","other"],
        "properties":{
            "patientId": {"type":"integer", "format": "int32", "description": "patientId"},
            "date":{"type":"string","format": "Date", "description": "Date of Diagnose"},
            "cardiovascular":{"type":"boolean","description": "cardiovascular"},
            "respiratory":{"type":"boolean","description": "respiratory"},
            "infectious_disease":{"type":"boolean","description": "infectious_disease"},
            "malignancy":{"type":"boolean","description": "malignancy"},
            "other":{"type":"string","description" : "other cause"}
        }
    }
};


