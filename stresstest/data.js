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
    "username": "mocha-pat#{INDEX}",
    "password": "patient",
    "role": "patient",
    "email": "patient#{INDEX}@mocha-test.de",
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
    "socialId": "mocha-#{INDEX}",
    "fileId": "mocha-unique-#{INDEX}",
    "fullAddress": "Unter den Linden 13, Berlin, Germany",
    "landline": "030123456"
};


var generateReport = function(critical){
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
    if (critical) {
        newDaily.q1 = true;
        newDaily.q2 = true;
        newDaily.q3 = true;
    };
    return newDaily;
};

module.exports = {
    doctorsAccount :  newDAcc,
    patientsAccount : newPAcc,
    patientsData : newPatData,
    generateReport : generateReport


};