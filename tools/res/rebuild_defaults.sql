INSERT INTO echo.accounts (accountId, username, password, role, email, enabled, reminderTime, notificationEnabled, mobile)
values
(2, "##%%user1%%##", "##%%pw1%%##", "doctor", "who@dr.who", 1, "18:00", 0, "0049123456789"),
(3, "##%%user2%%##", "##%%pw2%%##", "patient", "george@hospital.gr", 1, "10:00", 0, "0049987654321"),
(4, "##%%user3%%##", "##%%pw3%%##", "patient", "john@@hospital.gr", 1, "8:45", 0, "00304525515825"),
(5, "##%%user4%%##", "##%%pw4%%##", "patient", "konst@hospital.gr", 1, "10:00", 0, "0049987654321"),
(6, "##%%user5%%##", "##%%pw5%%##", "patient", "dimi@hospital.gr", 1, "8:45", 0, "00304525515825");

insert into echo.patients (patientId, doctorId, firstName, lastName, secondName, socialId, sex, dateOfBirth, firstDiagnoseDate, fullAddress,
    landline, fileId)
values
(3, 2, "Georgios", "Papadopoulos", "", "12345", 1, CURDATE(), CURDATE(), "abc 123", "00493654646465432", 1),
(4, 2, "Ioannis", "Vlahos", "D.", "234234", 1, CURDATE(), CURDATE(), "cba 321", "0030231315648", 2),
(5, 2, "Konstantinos", "Angelopoulos", "", "34567", 1, CURDATE(), CURDATE(), "abc 123", "00493654646465432", 3),
(6, 2, "Dimitrios", "Nikolaidis", "D.", "45678", 1, CURDATE(), CURDATE(), "cba 321", "0030231315648", 4);

INSERT INTO echo.cats (recordId, patientId, diagnoseDate, q1, q2, q3, q4, q5, q6, q7, q8, totalCatscale )
values
(2, 4, CURDATE(), 1, 1, 1, 1, 1, 1, 1, 1, 8),
(3, 5, CURDATE(), 2, 2, 2, 2, 2, 2, 2, 2, 16),
(4, 6, CURDATE(), 1, 1, 1, 1, 1, 1, 1, 1, 8);

INSERT INTO echo.readings
(recordId,patientId,diagnoseDate,weight,height,pxy,mmrc,
smoker,notes,fev1,fev1_pro,fvc,fvc_pro,fev1_fvc,rv,rv_pro,tlc,
tlc_pro,rv_tlc,satO2_pro,dlco_pro,pao2,paco2,hco3,pH,fvc_pre,fvc_pre_pro,
fev1_pre, fev1_pre_pro ,fev1_fvc_pre,fef25_75_pre_pro,pef_pre_pro,tlc_pre,tlc_pre_pro,frc_pre,
frc_pre_pro,rv_pre,rv_pre_pro,kco_pro,hematocrit,fvc_post,del_fvc_pro,fev1_post,
del_fev1_post,del_fef25_75_pro,del_pef_pro)
VALUES
(1, 3, CURDATE(), 75,188,5,3,
0,"",3.1,70,3.5,71,0.69,1.1,0.2,5.0,
100,0.2,80,80,5.0,5.0,1.0,7.0,2.0,40,
3.0, 25 ,0.7,40,50,5.1,0.9,2.0,
77,1.0,90,80,5.0,2.0,70,1.5,
0.2,40,30),
(2, 4, CURDATE(), 75,188,5,3,
0,"",3.1,70,3.5,71,0.69,1.1,0.2,5.0,
100,0.2,80,80,5.0,5.0,1.0,7.0,2.0,40,
3.0, 70 ,0.7,40,50,5.1,0.9,2.0,
77,1.0,90,80,5.0,2.0,70,1.5,
0.2,40,30),
(3, 5, CURDATE(), 75,188,5,3,
0,"",3.1,70,3.5,71,0.69,1.1,0.2,5.0,
100,0.2,80,80,5.0,5.0,1.0,7.0,2.0,40,
3.0, 70 ,0.7,40,50,5.1,0.9,2.0,
77,1.0,90,80,5.0,2.0,70,1.5,
0.2,40,30),
(4, 6, CURDATE(), 75,188,5,3,
0,"",3.1,70,3.5,71,0.69,1.1,0.2,5.0,
100,0.2,80,80,5.0,5.0,1.0,7.0,2.0,40,
3.0, 90 ,0.7,40,50,5.1,0.9,2.0,
77,1.0,90,80,5.0,2.0,70,1.5,
0.2,40,30);

INSERT INTO echo.exacerbations
(recordId,patientId,diagnoseDate,hospitalization)
VALUES
(1,3,CURDATE()-7,  0),
(2,4,CURDATE()-21, 0),
(3,4,CURDATE()-14, 0),
(4,4,CURDATE()-7, 0),
(5,6,CURDATE()-7, 0);

INSERT INTO echo.ccqs (recordId, patientId, diagnoseDate, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10 )
values
(1, 3, CURDATE(), 1, 1, 0, 1, 0, 0, 0, 1, 0, 1),
(2, 4, CURDATE(), 0, 1, 0, 1, 0, 1, 0, 1, 0, 1);

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
(1, 3, CURDATE(), 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 40, 2500, 36, 40, 95, GeomFromText("POINT(49 9)")),
(2, 4, CURDATE(), 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 54, 8435, 38, 42, 78, GeomFromText("POINT(49 9)"));

INSERT INTO echo.severity (recordId, patientId, severity, diagnoseDate, comment)
values
(1, 3, goldAnalyzer(3), now(), "comment"),
(2, 4, goldAnalyzer(4), now(), "comment"),
(3, 5, goldAnalyzer(5), now(), "comment"),
(4, 6, goldAnalyzer(6), now(), "comment");

INSERT INTO echo.treatments (recordId, patientId, diagnoseDate, shortActingB2, longActingB2, ultraLongB2, steroidsInhaled, steroidsOral,
    sama, lama, pdef4Inhalator, theophyline, mycolytocis, antibiotics, antiflu, antipneum, ltot, ltotStartDate, ltotDevice, niv,
    ventilationStart, ventilationDevice)
values
(1, 3, CURDATE() - interval 2 day, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, CURDATE(), "Liquid", 1, CURDATE(), "CPAP"),
(2, 4, CURDATE() - interval 1 day, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, CURDATE(), "Liquid", 1, CURDATE(), "CPAP");


CALL dropAllDbUsers();

CALL createAllDbUsers("##%%prefix%%##");

CALL repairPermissions();

UPDATE echo.settings SET val = 5 WHERE setting = "nextId";

FLUSH PRIVILEGES;