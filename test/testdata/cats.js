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

var newCat = {
    "patientId": 42,
    "q1": 0,
    "q2": 1,
    "q3": 2,
    "q4": 3,
    "q5": 5,
    "q6": 4,
    "q7": 3,
    "q8": 2,
    "diagnoseDate": "2014-12-17"
}


module.exports = {
    init : {
        newPAcc : newPAcc,
        newDAcc : newDAcc,
        newPatData : newPatData
    },
    // data for admin tests....
    admin: {
        newCat : newCat
    },
    // data for doctor tests
    doctor:{
        newCat : newCat
    },
    // data for patient tests
    patient:{
        newCat : newCat,
        emptyCat: {}
    }

};