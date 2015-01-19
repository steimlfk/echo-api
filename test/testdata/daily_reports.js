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

var newDaily = {
    "date": "2015-01-31",
    "q1": false,
    "q2": false,
    "q3": false,
    "q4": false,
    "q5": false,
    "q1a": false,
    "q1b": false,
    "q1c": false,
    "q3a": false,
    "q3b": false,
    "q3c": false,
    "satO2": 0,
    "walkingDist": 0,
    "temperature": 0,
    "pefr": 0,
    "heartRate": 0,
    "x" : "48.7451666",
    "y" : "9.106677"
};

var newMinimalDaily = {
    "date": "2015-01-31",
    "q1": false,
    "q2": false,
    "q3": false,
    "q4": false,
    "q5": false
};


module.exports = {
    init : {
        newPAcc : newPAcc,
        newDAcc : newDAcc,
        newPatData : newPatData
    },
    // data for admin tests....
    admin: {
        newDaily : newDaily
    },
    // data for doctor tests
    doctor:{
        newDaily : newDaily,
        newMinDaily : newMinimalDaily
    },
    // data for patient tests
    patient:{
        newDaily : newDaily,
        newMinDaily : newMinimalDaily
    }

};