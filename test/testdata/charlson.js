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

var newCharlson = {
    "patientId": 42,
    "myocardialInfarction": false,
    "congestiveHeartFailure": false,
    "peripheralVascularDisease": false,
    "cerebrovascularDisease": false,
    "dementia": false,
    "chronicPulmonaryDiasease": false,
    "connectiveTissueDisease": false,
    "ulcerDisease": false,
    "liverDiseaseMild": false,
    "diabetes": false,
    "hemiplegia": false,
    "renalDiseaseModerateOrSevere": false,
    "diabetesWithEndOrganDamage": false,
    "anyTumor": false,
    "metastaticSolidMalignancy": false,
    "leukemia": false,
    "malignantLymphoma": false,
    "liverDiseaseModerateOrSevere": false,
    "aids": false,
    "noConditionAvailable": true,
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
        newCharlson : newCharlson
    },
    // data for doctor tests
    doctor:{
        newCharlson : newCharlson,
        emptyData : {}
    },
    // data for patient tests
    patient:{
        newCharlson : newCharlson
    }

};