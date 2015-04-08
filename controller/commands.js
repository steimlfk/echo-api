/**
 * Command Ressources
 */
var swagger = require('swagger-node-express');
var config = require('../config.js');
var utils = require('../utils.js');
var async = require('async');


exports.createPatientAndAccount = function(req,res,next) {
    // check if account and patient data was submitted
    if (req.body.account && req.body.patient) {
        req.data = req.body;
        req.body = req.body.account;
        next();
    }
};


exports.changeDoctor = function(req,res,next){
    var connection = req.con;
    var pid = req.body.patientId;
    var did = req.body.newDoctorId;
    connection.query('call patientsChangeDoctor(?,?)',	[pid, did], function(err, result) {
        connection.release();
        if (err) next(err);
        else {
            res.affectedRows = result[0][0].affected_rows > 0;
            next();
        }
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