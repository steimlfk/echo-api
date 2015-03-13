/**
 * Command Ressources
 */
var swagger = require('swagger-node-express');
var config = require('../config.js');
var utils = require('../utils.js');
var async = require('async');


exports.createPatientAndAccount = function(req,res,next) {
    var connection = req.con;

    // check if account and patient data was submitted
    if (req.body.account && req.body.patient) {

        // since its not possible to "really" delete a created account
        // it was necessary to write a new SP to create a patient and an account
        async.waterfall([
                function(ccb){
                    // 4) create SQL Query from parameters
                    var i = req.body.account;
                    // make NotificationMode and role lower case so the db triggers can validate the value
                    var mode = i.notificationMode.toLowerCase();
                    var role = i.role.toLowerCase();

                    async.parallel([
                        function (cb) {
                            utils.cryptPassword(i.password, cb);
                        },
                        function (cb) {
                            connection.query('CALL accountsCreate(?,?,?,?,?,?, ?,?,?,?)' ,
                                [config.db_pw_prefix, i.username," ", i.email, role, i.enabled, i.reminderTime, i.notificationEnabled, mode, i.mobile], cb);
                        }
                    ], function (err, result){
                        if (err) {
                            ccb(err);
                        } else {
                            var newId = result[1][0][0][0].location;
                            connection.changeUser({user: 'echo_db_usr', password: config.db.pwd}, function (err){
                                if (err) ccb(err);
                                else {
                                    async.parallel([
                                        function (cb) {
                                            connection.query('UPDATE accounts SET password = ? WHERE accountId = ?', [result[0], newId], cb);
                                        },
                                        function (cb) {
                                            connection.query('CALL grantRolePermissions(?, ?)', [newId, i.role], cb);
                                        }
                                    ], function (err, res0) {
                                        if (err) {
                                            // Something went wrong - shouldnt happen
                                            next(err);
                                        }
                                        else {
                                            ccb(null, newId);
                                        }
                                    });
                                }
                            });
                        };
                    });
                },
                function(arg1, ccb){
                    connection.changeUser({user: req.user.accountId, password: utils.calculatePW(req.user.accountId)}, function (err){
                        if (err) ccb(err);
                        else {
                            var i = req.body.patient;
                            // set doctor id to current user if current user is doctor
                            var doc_id = i.doctorId;
                            if (req.user.role == 'doctor') doc_id = req.user.accountId;
                            connection.query('CALL patientsCreate(?,?,?,?,?,?,?,?,?,?,?,?)', [arg1, doc_id, i.firstName, i.lastName, i.secondName, i.socialId, i.sex, i.dateOfBirth, i.firstDiagnoseDate, i.fileId, i.fullAddress, i.landline], ccb);
                        };


                    });
                }
            ],
            // optional callback
            function(err, re1){
                if (err) {
                    next(err);
                } else {
                    // resource was created
                    // link will be provided in location header
                    res.statusCode = 201;
                    res.location('/patients/'+re1[0][0].insertId);
                    res.send();
                }
                connection.release();
            }
        );
    }
};


exports.changeDoctor = function(req,res,next){
    var connection = req.con;
    var pid = req.body.patientId;
    var did = req.body.newDoctorId;
    connection.query('call patientsChangeDoctor(?,?)',	[pid, did], function(err, result) {
        if (err) {
            next(err);
        } else {
            // doctor was changed
            if (result[0][0].affected_rows > 0){
                res.statusCode = 204;
                res.send();
            }
            // patient wasnt found
            else {
                res.statusCode = 404;
                res.send();
            }
        }
        connection.release();
    });
};



exports.createPatientAndAccountSpec = {
    summary : "Create Patient with Account (Roles: doctor)",
    notes: "Instead of calling POST /account and POST /patient in a row, you can use this function to create a patients' account. Uses new SP instead of combinig the existing two methods, since there is no possiblity to delete an account if this operation fails after account creation <br><br>" +
    "<b>Possible Results</b>: <br>" +
    " <b>201</b>  Account is created and the location is returned in the Location Header <br>" +
    " <b>400</b>  The provided data contains errors, e.g. Username or EMail are not unique or Invalid Value of NotificationMode or Role <br>" +
    " <b>403</b>  The logged in user isnt allowed to create an account with this data. Possibile Reason: A doctor is only allowed to create a new patient.<br>"+
    " <b>500</b> Internal Server Error",
    path : "/createPatientAndAccount",
    method: "POST",
    nickname : "addPatientWithAccount",
    parameters : [swagger.bodyParam("PatientAndAccount", "new Patient with new Account", "PatientAndAccount")]

};

exports.changeDoctorSpec = {
    summary : "Changes Doctor of Given Patient (Roles: admin)",
    notes: "Changes Doctor of Given Patient <br><br><b>Possible Results</b>: <br>" +
    " <b>200</b>  Doctor changed <br>" +
    " <b>400</b>  The provided data contains errors, e.g. given doctor isnt a doctor <br>" +
    " <b>500</b> Internal Server Error",
    path : "/changeDoctor",
    method: "POST",
    nickname : "changeDoc",
    parameters : [swagger.bodyParam("ChangeDoctor", "new Patient with new Account", "ChangeDoctor")]

};

exports.models = {
    "ExtraPatient":{
        "id": "Patient",
        "required":["dateOfBirth","firstDiagnoseDate", "firstName","lastName","sex","fileId", "mobile", "email", "fullAddress", "socialId"],
        "properties":{
            "lastName": {
                "type":"string",
                "description": "Patients Last Name"
            },
            "firstName": {
                "type":"string",
                "description": "Patient's first Name"
            },
            "secondName": {
                "type":"string",
                "description": "Patients second Name"
            },
            "dateOfBirth": {
                "type":"string",
                "format":"date",
                "description": "Date of Birth"
            },
            "sex": {
                "type":"string",
                "enum": ["0","1"] ,
                "description": "Sex (1 is male)"
            },
            "firstDiagnoseDate": {
                "type":"string",
                "format":"date",
                "description": "Date of First Diagnoe"
            },
            "socialId": {
                "type":"string",
                "description": "Patients social ID"
            },
            "fileId": {
                "type":"string",
                "description": "Patient File Id"
            },
            "fullAddress": {
                "type":"string",
                "description": "Patients address"
            },
            "landline": {
                "type":"string",
                "description": "Patients phone number"
            }
        }
    },
    "PatientAndAccount":{
        "id" : "PatientAndAccount",
        "required": ["account", "patient"],
        "properties":{
            "account":{
                "$ref" : "NewAccount"
            },
            "patient":{
                "$ref" : "ExtraPatient"
            }
        }
    },
    "ChangeDoctor":{
        "id" : "ChangeDoctor",
        "required": ["patientId", "newDoctorId"],
        "properties":{
            "patientId":{
                "type":"integer"
            },
            "newDoctorId":{
                "type":"integer"
            }
        }
    }
};