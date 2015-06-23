INSERT INTO echo.accounts (accountId, username, password, role, email, enabled, reminderTime, notificationEnabled, mobile)
values
(2, "##%%user1%%##", "##%%pw1%%##", "doctor", "who@dr.who", 1, "18:00", 0, "0049123456789"),
(3, "##%%user2%%##", "##%%pw2%%##", "patient", "av@e.rel", 1, "10:00", 0, "0049987654321"),
(4, "##%%user3%%##", "##%%pw3%%##", "patient", "joe@dalt.on", 1, "8:45", 0, "00304525515825");

insert into echo.patients (patientId, doctorId, firstName, lastName, secondName, socialId, sex, dateOfBirth, firstDiagnoseDate, fullAddress,
    landline, fileId)
values
(3, 2, "averel", "test", "", "12345", 1, CURDATE(), CURDATE(), "abc 123", "00493654646465432", 2),
(4, 2, "joe", "dalton", "john", "234234", 1, CURDATE(), CURDATE(), "cba 321", "0030231315648", 1);

INSERT INTO echo.cats (recordId, patientId, diagnoseDate, q1, q2, q3, q4, q5, q6, q7, q8, totalCatscale, status)
values
(1, 3, CURDATE(), 1, 1, 0, 0, 1, 0, 1, 1, 3, "baseline"),
(2, 4, CURDATE(), 0, 1, 0, 1, 0, 1, 0, 1, 2, "exacerbation");

INSERT INTO echo.ccqs (recordId, patientId, diagnoseDate, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, status)
values
(1, 3, CURDATE(), 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, "baseline"),
(2, 4, CURDATE(), 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, "exacerbation");

INSERT INTO echo.charlsons (recordId, patientId, diagnoseDate, myocardialInfarction, congestiveHeartFailure, peripheralVascularDisease,
    cerebrovascularDisease, dementia, chronicPulmonaryDiasease, connectiveTissueDisease, ulcerDisease, liverDiseaseMild, diabetes,
    hemiplegia, renalDiseaseModerateOrSevere, diabetesWithEndOrganDamage, anyTumor, leukemia, malignantLymphoma, liverDiseaseModerateOrSevere,
    metastaticSolidMalignancy, aids, noConditionAvailable, totalCharlson)
values
(1, 3, CURDATE(), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(2, 4, CURDATE(), 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0);

INSERT INTO echo.dailyReports (recordId, patientId, date, q1, q2, q3, q4, q5, q1a, q1b, q1c, q3a, q3b, q3c, satO2, walkingDist,
    temperature, pefr, heartRate, loc) 
values
(1, 3, CURDATE(), 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 40, 2500, 36, 40, 95, GeomFromText("POINT(9 49)")),
(2, 4, CURDATE(), 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 54, 8435, 38, 42, 78, GeomFromText("POINT(9 49)"));

INSERT INTO echo.severity (recordId, patientId, severity, diagnoseDate, comment)
values
(1, 3, "A", now(), "this is a test"),
(2, 4, "C", now() - interval 1 day, "another test");

INSERT INTO echo.treatments (recordId, patientId, diagnoseDate, status, shortActingB2, longActingB2, ultraLongB2, steroidsInhaled, steroidsOral,
    sama, lama, pdef4Inhalator, theophyline, mycolytocis, antibiotics, antiflu, antipneum, ltot, ltotStartDate, ltotDevice, niv,
    ventilationStart, ventilationDevice)
values
(1, 3, CURDATE() - interval 2 day, "baseline", 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, CURDATE(), "Liquid", 1, CURDATE(), "CPAP"),
(2, 4, CURDATE() - interval 1 day, "baseline", 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, CURDATE(), "Liquid", 1, CURDATE(), "CPAP");

INSERT INTO echo.notifications (notificationId, accountId, date, type, subjectsAccount)
VALUES
(1, 3, CURDATE(), 1, null),
(2, 2, CURDATE(), 3, 3);

CALL dropAllDbUsers();

CALL createAllDbUsers("##%%prefix%%##");

CALL repairPermissions();

UPDATE echo.settings SET val = 5 WHERE setting = "nextId";