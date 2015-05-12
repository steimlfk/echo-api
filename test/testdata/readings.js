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

var newReading = {
    "patientId": 42,
    "del_fef25_75_pro": 0,
    "del_fev1_post": 0,
    "del_fvc_pro": 0,
    "del_pef_pro": 0,
    "dlco_pro": 0,
    "fef25_75_pre_pro": 0,
    "fev1": 0,
    "fev1_fvc": 0,
    "fev1_fvc_pre": 0,
    "fev1_post": 0,
    "fev1_pre": 0,
    "fev1_pre_pro": 0,
    "fev1_pro": 0,
    "frc_pre": 0,
    "frc_pre_pro": 0,
    "fvc": 0,
    "fvc_post": 0,
    "fvc_pre": 0,
    "fvc_pre_pro": 0,
    "fvc_pro": 0,
    "hco3": 0,
    "height": 0,
    "hematocrit": 0,
    "kco_pro": 0,
    "mmrc": 0,
    "notes": "",
    "paco2": 0,
    "pao2": 0,
    "pef_pre_pro": 0,
    "pH": 0,
    "pxy": 0,
    "rv": 0,
    "rv_pre": 0,
    "rv_pre_pro": 0,
    "rv_pro": 0,
    "rv_tlc": 0,
    "satO2_pro": 0,
    "smoker": 0,
    "tlc": 0,
    "tlc_pre": 0,
    "tlc_pre_pro": 0,
    "tlc_pro": 0,
    "weight": 0,
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
        newReading : newReading
    },
    // data for doctor tests
    doctor:{
        newReading : newReading,
        emptyReading: {}
    },
    // data for patient tests
    patient:{
        newReading : newReading
    }

};