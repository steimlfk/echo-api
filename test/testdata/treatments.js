var newDAcc = {
    "username": "mocha-doc1",
    "password": "doc1",
    "role": "doctor",
    "email": "doc1@mocha-test.de",
    "enabled": true,
    "reminderTime": "15:55",
    "notificationEnabled": true,
    "notificationMode": "email",
    "mobile": "234"
};

var newPAcc = {
    "username": "mocha-pat1",
    "password": "pat1",
    "role": "patient",
    "email": "pat1@mocha-test.de",
    "enabled": true,
    "reminderTime": "15:55",
    "notificationEnabled": true,
    "notificationMode": "push",
    "mobile": "345"
};


var newPatData = {
    "doctorId": 0,
    "accountId": 0,
    "lastName": "Patient",
    "firstName": "Patti",
    "secondName": "Pat",
    "dateOfBirth": "1987-05-07",
    "sex": "1",
    "firstDiagnoseDate": "2011-11-23",
    "socialId": "1337ABC123-mocha",
    "fileId": "mocha-unique-id",
    "fullAddress": "Unter den Linden 13, Berlin, Germany",
    "landline": "030123456"
};

var newTreatment = {
    "patientId": 42,
    "antibiotics": false,
    "antiflu": false,
    "antipneum": false,
    "lama": false,
    "longActingB2": false,
    "ltot": false,
    // ['Concetrator' or 'Cylinder' or 'Liquid']:LTOT Device,
    "ltotDevice": "Concetrator",
    "ltotStartDate": "2011-11-01",
    "mycolytocis": false,
    "niv": false,
    "pdef4Inhalator": false,
    "sama": false,
    "shortActingB2": false,
    "steroidsInhaled": false,
    "steroidsOral": false,
    "theophyline": false,
    "ultraLongB2": false,
    //'CPAP' or 'BiPAP': Ventilation Device,
    "ventilationDevice": "CPAP",
    "ventilationStart": "2011-01-01",
    "diagnoseDate": "2014-12-17",
    "other": "other mean things"
}


module.exports = {
    init : {
        newPAcc : newPAcc,
        newDAcc : newDAcc,
        newPatData : newPatData
    },
    // data for admin tests....
    admin: {
        newTreatment : newTreatment
    },
    // data for doctor tests
    doctor:{
        newTreatment : newTreatment
    },
    // data for patient tests
    patient:{
        newTreatment : newTreatment
    }

};