var  newAcc = {
    "username": "mocha-admin1",
    "password": "admin1",
    "role": "admin",
    "email": "admin@mocha-test.de",
    "enabled": true,
    "reminderTime": "15:55",
    "notificationEnabled": true,
    "notificationMode": "sms",
    "mobile": "123"
};

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
var newAccInvalidRole = {
    "username": "mocha-fail",
    "password": "fail1",
    "role": "fail",
    "email": "fail1@mocha-test.de",
    "enabled": true,
    "reminderTime": "15:55",
    "notificationEnabled": true,
    "notificationMode": "email",
    "mobile": "1337"
};

var newAccUsedMail = {
    "username": "mocha-fail",
    "password": "fail1",
    "role": "admin",
    "email": newAcc.email,
    "enabled": true,
    "reminderTime": "15:55",
    "notificationEnabled": true,
    "notificationMode": "email",
    "mobile": "1337"
};

var newAccUsedUsername = {
    "username": newAcc.username,
    "password": "fail1",
    "role": "admin",
    "email": "fail@fail0r.de",
    "enabled": true,
    "reminderTime": "15:55",
    "notificationEnabled": true,
    "notificationMode": "email",
    "mobile": "1337"
};

var newAccInvMode = {
    "username": "fail01",
    "password": "fail1",
    "role": "admin",
    "email": "fail@fail0r.de",
    "enabled": true,
    "reminderTime": "15:55",
    "notificationEnabled": true,
    "notificationMode": "fail",
    "mobile": "1337"
};

var updateTestDoc = {
    "username": "mocha-doc0",
    "password": "doc0",
    "role": "doctor",
    "email": "doc0@mocha-test.de",
    "enabled": true,
    "reminderTime": "15:55",
    "notificationEnabled": true,
    "notificationMode": "email",
    "mobile": "234"
};

var updateOwnAccountDoc = {
    "username": "mocha-doc3",
    "password": "doc3",
    "role": "doctor",
    "email": "doc3@mocha-test.de",
    "enabled": true,
    "reminderTime": "15:55",
    "notificationEnabled": true,
    "notificationMode": "email",
    "mobile": "234"
};

var  newAccRoleDoc = {
    "username": "mocha-unique-admin1",
    "password": "admin1",
    "role": "admin",
    "email": "admin-unique@mocha-test.de",
    "enabled": true,
    "reminderTime": "15:55",
    "notificationEnabled": true,
    "notificationMode": "sms",
    "mobile": "1337"
};


var newAccRoleAdmin = {
    "username": "mocha-unique-doc1",
    "password": "doc1",
    "role": "doctor",
    "email": "doc1-unique@mocha-test.de",
    "enabled": true,
    "reminderTime": "15:55",
    "notificationEnabled": true,
    "notificationMode": "email",
    "mobile": "1337"
};

var updateOwnAccountPat = {
    "username": "mocha-pat2",
    "password": "pat2",
    "role": "patient",
    "email": "pat2@mocha-test.de",
    "enabled": true,
    "reminderTime": "15:55",
    "notificationEnabled": true,
    "notificationMode": "push",
    "mobile": "345"
};

module.exports = {
    // data for admin tests....
    admin: {
        newAcc: newAcc,
        newDAcc: newDAcc,
        newPAcc: newPAcc,
        newAccInvalidRole: newAccInvalidRole,
        newAccUsedMail: newAccUsedMail,
        newAccUsedUsername: newAccUsedUsername,
        newAccInvMode: newAccInvMode,
        updateTestDoc: updateTestDoc
    },
    // data for doctor tests
    doctor:{
        updateOwnAccount: updateOwnAccountDoc,
        newPAcc: newPAcc,
        newDAcc : newAccRoleDoc,
        newAAcc : newAccRoleAdmin
    },
    // data for patient tests
    patient:{
        updateOwnAccount: updateOwnAccountPat
    }

};