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

var newExa = {
    "patientId": 42,
    "diagnoseDate": "2014-12-17",
    "hospitalization" : true
};

module.exports = {
    init : {
        newPAcc : newPAcc,
        newDAcc : newDAcc,
        newPatData : newPatData
    },
    // data for admin tests....
    admin: {
        newExacerbation : newExa
    },
    // data for doctor tests
    doctor:{
        newExacerbation : newExa,
        emptySeverity: {}
    },
    // data for patient tests
    patient:{
        newExacerbation : newExa
    }

};