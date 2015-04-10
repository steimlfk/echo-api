/**
 * Command Ressources
 */
var swagger = require('swagger-node-express');
var config = require('../config.js');
var async = require('async');
var ctrl = require('../health-api-middlewares.js');


exports.createPatientAndAccount = function(req,res,next) {
    var acc = require('./accounts.js');
    var pat = require('./patients.js');

    async.waterfall([
            function (cb){
                req.data = req.body;
                req.body = req.body.account;
                acc.add(req,res, cb);
            },
            function (cb){
                ctrl.databaseHandler(req, res, cb);
            },
            function (cb){
                req.data.patient.accountId = res.loc.split("/").pop();
                req.body = req.data.patient;
                pat.add(req,res, cb);
            }
        ],
        function(err){
            if (err) {
                // rollback if account was already created! (doctorId is part of req.body of patient)
                if (req.body.doctorId){
                    req.params = {};
                    req.params.id = req.body.accountId;
                    ctrl.databaseHandler(req, res, function(e1){
                        req.con.changeUser({user: 'echo_db_usr', password: config.db.pwd}, function (e2){
                            acc.del(req,res, function(e3){
                                next(err);
                            })
                        });
                    });
                }
                else next(err);
            }
            else next();
        });
};


exports.changeDoctor = function(req,res,next){
    var pat = require('./patients.js');
    var doc_id = req.body.newDoctorId;
    async.waterfall([
            function (cb){
                req.params = {};
                req.params.id = req.body.patientId;
                pat.listOne(req,res, cb);
            },
            function (cb){
                ctrl.databaseHandler(req, res, cb);
            },
            function (cb){
                req.body = res.result;
                req.body.doctorId = doc_id;
                pat.update(req,res, cb);
            }
        ],
        function(err){
            if (err) {
                next(err);
            }
            else next();
        });
};



exports.createPatientAndAccountSpec = {
    summary : "Create Patient with Account (Roles: doctor)",
    notes: "Instead of calling POST /account and POST /patient in a row, you can use this function to create a patients' account. Uses new SP instead of combinig the existing two methods, since there is no possiblity to delete an account if this operation fails after account creation <br><br>" ,
    path : "/createPatientAndAccount",
    method: "POST",
    nickname : "addPatientWithAccount",
    parameters : [swagger.bodyParam("PatientAndAccount", "new Patient with new Account", "PatientAndAccount")],
    responseMessages: [
        {
            code: 201,
            message: "Account and Patientdata was created and the location is returned in the Location Header"
        },
        {
            code: 400,
            message: "The provided data contains errors ",
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

exports.changeDoctorSpec = {
    summary : "Changes Doctor of Given Patient (Roles: admin)",
    notes: "Changes Doctor of Given Patient ",
    path : "/changeDoctor",
    method: "POST",
    nickname : "changeDoc",
    parameters : [swagger.bodyParam("ChangeDoctor", "new Patient with new Account", "ChangeDoctor")],
    responseMessages: [
        {
            code: 200,
            message: "Doctor changed"
        },
        {
            code: 400,
            message: "The provided data contains errors, e.g. given doctor isnt a doctor",
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