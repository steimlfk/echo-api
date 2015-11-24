INSERT INTO echo.accounts (accountId, username, password, role, email, enabled, reminderTime, notificationEnabled, mobile)
values
(2, "##%%user1%%##", "##%%pw1%%##", "doctor", "who@dr.who", 1, "18:00", 0, "0049123456789"),
(3, "##%%user2%%##", "##%%pw2%%##", "patient", "av@e.rel", 1, "10:00", 0, "0049987654321"),
(4, "##%%user3%%##", "##%%pw3%%##", "patient", "joe@dalt.on", 1, "8:45", 0, "00304525515825");

insert into echo.patients (patientId, doctorId, firstName, lastName, secondName, socialId, sex, dateOfBirth, firstDiagnoseDate, fullAddress,
    landline, fileId)
values
(3, 2, "averel", "dalton", "", "12345", 1, "1990-01-01", "2011-01-01", "abc 123", "00493654646465432", 2),
(4, 2, "josefine", "dalton", "john", "234234", 1, "1991-01-01", "2011-01-01", "cba 321", "0030231315648", 1);


INSERT INTO echo.charlsons (recordId, patientId, diagnoseDate, myocardialInfarction, congestiveHeartFailure, peripheralVascularDisease,
    cerebrovascularDisease, dementia, chronicPulmonaryDiasease, connectiveTissueDisease, ulcerDisease, liverDiseaseMild, diabetes,
    hemiplegia, renalDiseaseModerateOrSevere, diabetesWithEndOrganDamage, anyTumor, leukemia, malignantLymphoma, liverDiseaseModerateOrSevere,
    metastaticSolidMalignancy, aids, noConditionAvailable, totalCharlson)
values
(1, 3, "2012-01-01", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(2, 4, "2012-01-01", 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0);

INSERT INTO echo.dailyReports (recordId, patientId, date, q1, q2, q3, q4, q5, q1a, q1b, q1c, q3a, q3b, q3c, satO2, walkingDist,
    temperature, pefr, heartRate, loc) 
values
(1, 3, "2012-03-01", 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 40, 301, 36, 40, 95, GeomFromText("POINT(9 49)")),
(2, 3, "2012-03-02", 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 40, 302, 36, 40, 95, GeomFromText("POINT(9 49)")),
(3, 3, "2012-03-03", 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 40, 303, 36, 40, 95, GeomFromText("POINT(9 49)")),
(4, 3, "2012-03-04", 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 54, 304, 38, 42, 78, GeomFromText("POINT(9 49)")),
(5, 3, "2012-03-05", 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 54, 305, 38, 42, 78, GeomFromText("POINT(9 49)")),
(6, 3, "2012-03-06", 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 54, 306, 38, 42, 78, GeomFromText("POINT(9 49)")),
(7, 3, "2012-03-07", 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 54, 307, 38, 42, 78, GeomFromText("POINT(9 49)")),
(8, 3, "2012-03-08", 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 54, 308, 38, 42, 78, GeomFromText("POINT(9 49)")),
(9, 3, "2012-03-09", 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 54, 309, 38, 42, 78, GeomFromText("POINT(9 49)")),
(10, 4, "2012-03-01", 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 40, 401, 36, 40, 95, GeomFromText("POINT(9 49)")),
(11, 4, "2012-03-02", 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 40, 402, 36, 40, 95, GeomFromText("POINT(9 49)")),
(12, 4, "2012-03-03", 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 40, 403, 36, 40, 95, GeomFromText("POINT(9 49)")),
(13, 4, "2012-03-04", 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 54, 404, 38, 42, 78, GeomFromText("POINT(9 49)")),
(14, 4, "2012-03-05", 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 54, 405, 38, 42, 78, GeomFromText("POINT(9 49)")),
(15, 4, "2012-03-06", 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 54, 406, 38, 42, 78, GeomFromText("POINT(9 49)")),
(16, 4, "2012-03-07", 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 54, 407, 38, 42, 78, GeomFromText("POINT(9 49)")),
(17, 4, "2012-03-08", 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 54, 408, 38, 42, 78, GeomFromText("POINT(9 49)")),
(18, 4, "2012-03-09", 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 54, 409, 38, 42, 78, GeomFromText("POINT(9 49)"));


INSERT INTO `echo`.`visits` (`visitid`,`patientId`,`date`,`status`)
VALUES
(1,3,"2012-03-01","EXACERBATION"),
(2,3,"2012-03-03","EXACERBATION"),
(3,3,"2012-03-06","EXACERBATION"),
(4,4,"2012-03-01","EXACERBATION"),
(5,4,"2012-03-03","EXACERBATION"),
(6,4,"2012-03-06","EXACERBATION");



INSERT INTO echo.treatments (recordId, shortActingB2, longActingB2, ultraLongB2, steroidsInhaled, steroidsOral,
    sama, lama, pdef4Inhalator, theophyline, mycolytocis, antibiotics, antiflu, antipneum, ltot, ltotStartDate, ltotDevice, niv,
    ventilationStart, ventilationDevice)
values
(1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "2012-01-01", "Liquid", 1, "2012-01-01", "CPAP"),
(2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "2012-01-01", "Liquid", 1, "2012-01-01", "CPAP"),
(3, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "2012-01-01", "Liquid", 1, "2012-01-01", "CPAP"),
(4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "2012-01-01", "Liquid", 0, "2012-01-01", "CPAP"),
(5, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "2012-01-01", "Liquid", 0, "2012-01-01", "CPAP"),
(6, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "2012-01-01", "Liquid", 0, "2012-01-01", "CPAP");

INSERT INTO `echo`.`readings`
(`recordId`,`weight`,`height`,`pxy`,`mmrc`,`smoker`,`notes`,`fev1`,`fev1_pro`,`fvc`,`fvc_pro`,`fev1_fvc`,`rv`,`rv_pro`,
`tlc`,`tlc_pro`,`rv_tlc`,`satO2_pro`,`dlco_pro`,`pao2`,`paco2`,`hco3`,`pH`,`fvc_pre`,`fvc_pre_pro`,`fev1_pre`,`fev1_pre_pro`,
`fev1_fvc_pre`,`fef25_75_pre_pro`,`pef_pre_pro`,`tlc_pre`,`tlc_pre_pro`,`frc_pre`,`frc_pre_pro`,`rv_pre`,`rv_pre_pro`,
`kco_pro`,`hematocrit`,`fvc_post`,`del_fvc_pro`,`fev1_post`,`del_fev1_post`,`del_fef25_75_pro`,`del_pef_pro`)
VALUES
(1, '99', '170', '21', '1', '2', NULL, NULL, NULL, NULL, NULL, '61.8', NULL, NULL, NULL, NULL, NULL, '97', NULL, NULL, NULL, NULL, NULL, '2.12', NULL, '1.31', NULL, NULL, '0.69', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2.34', NULL, '1.42', NULL, NULL, NULL),
(2, '99', '170', '22', '1', '2', NULL, NULL, NULL, NULL, NULL, '61.8', NULL, NULL, NULL, NULL, NULL, '97', NULL, NULL, NULL, NULL, NULL, '2.12', NULL, '1.31', NULL, NULL, '0.69', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2.34', NULL, '1.42', NULL, NULL, NULL),
(3, '99', '170', '23', '1', '2', NULL, NULL, NULL, NULL, NULL, '61.8', NULL, NULL, NULL, NULL, NULL, '97', NULL, NULL, NULL, NULL, NULL, '2.12', NULL, '1.31', NULL, NULL, '0.69', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2.34', NULL, '1.42', NULL, NULL, NULL),
(4, '66', '160', '31', '1', '2', NULL, NULL, NULL, NULL, NULL, '61.8', NULL, NULL, NULL, NULL, NULL, '97', NULL, NULL, NULL, NULL, NULL, '2.12', NULL, '1.31', NULL, NULL, '0.69', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2.34', NULL, '1.42', NULL, NULL, NULL),
(5, '66', '160', '32', '1', '2', NULL, NULL, NULL, NULL, NULL, '61.8', NULL, NULL, NULL, NULL, NULL, '97', NULL, NULL, NULL, NULL, NULL, '2.12', NULL, '1.31', NULL, NULL, '0.69', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2.34', NULL, '1.42', NULL, NULL, NULL),
(6, '66', '160', '33', '1', '2', NULL, NULL, NULL, NULL, NULL, '61.8', NULL, NULL, NULL, NULL, NULL, '97', NULL, NULL, NULL, NULL, NULL, '2.12', NULL, '1.31', NULL, NULL, '0.69', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2.34', NULL, '1.42', NULL, NULL, NULL);



CALL dropAllDbUsers();

CALL createAllDbUsers("##%%prefix%%##");

CALL repairPermissions();

UPDATE echo.settings SET val = (SELECT max(accountId)+1 from accounts) WHERE setting = "nextId";

FLUSH PRIVILEGES;