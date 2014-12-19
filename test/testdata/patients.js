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

var dummyPat = {
    "doctorId": 0,
    "accountId": 0,
    "lastName": "dummy",
    "firstName": "dummy",
    "secondName": "dummy",
    "dateOfBirth": "1990-01-01",
    "sex": "1",
    "firstDiagnoseDate": "1990-01-01",
    "socialId": "123",
    "fileId": "dummy",
    "fullAddress": "dummy",
    "landline": "123"
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

var newPatDataInvSocial = {
    "doctorId": 0,
    "accountId": 0,
    "lastName": "Patient",
    "firstName": "Patti",
    "secondName": "Pat",
    "dateOfBirth": "1987-05-07",
    "sex": "1",
    "firstDiagnoseDate": "2011-11-23",
    "socialId": newPatData.socialId,
    "fileId": "mocha-unique-id2",
    "fullAddress": "Unter den Linden 13, Berlin, Germany",
    "landline": "030123456"
};

var newPatDataInvFile = {
    "doctorId": 0,
    "accountId": 0,
    "lastName": "Patient",
    "firstName": "Patti",
    "secondName": "Pat",
    "dateOfBirth": "1987-05-07",
    "sex": "1",
    "firstDiagnoseDate": "2011-11-23",
    "socialId": "1337ABC123-mocha2",
    "fileId": newPatData.fileId,
    "fullAddress": "Unter den Linden 13, Berlin, Germany",
    "landline": "030123456"
};

var newPatDataInvDocID = {
    "doctorId": 0,
    "accountId": 0,
    "lastName": "Patient",
    "firstName": "Patti",
    "secondName": "Pat",
    "dateOfBirth": "1987-05-07",
    "sex": "1",
    "firstDiagnoseDate": "2011-11-23",
    "socialId": "1337ABC123-mocha2",
    "fileId": "mocha-unique-id2",
    "fullAddress": "Unter den Linden 13, Berlin, Germany",
    "landline": "030123456"
};

module.exports = {
    init : {
        newPAcc : newPAcc,
        newDAcc : newDAcc
    },
    // data for admin tests....
    admin: {
        newPatData : newPatData,
        newPatDataInvSocial:newPatDataInvSocial,
        newPatDataInvFile : newPatDataInvFile,
        newPatDataInvDocID : newPatDataInvDocID
    },
    // data for doctor tests
    doctor:{
        newPatData : newPatData,
        newPatDataInvSocial:newPatDataInvSocial,
        newPatDataInvFile : newPatDataInvFile
    },
    // data for patient tests
    patient:{
        dummyPat : dummyPat
    }

};