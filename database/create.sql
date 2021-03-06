SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema echo
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `echo` ;
CREATE SCHEMA IF NOT EXISTS `echo` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ;
USE `echo` ;

CREATE USER 'echo_db_usr'@'localhost' IDENTIFIED BY '123abc456';
GRANT CREATE USER ON *.* to 'echo_db_usr'@'localhost';
GRANT CREATE, GRANT OPTION ON echo.* TO 'echo_db_usr'@'localhost';
GRANT SHOW VIEW, DELETE, INSERT, SELECT, UPDATE, TRIGGER, CREATE, GRANT OPTION ON TABLE echo.* TO 'echo_db_usr'@'localhost';

-- -----------------------------------------------------
-- function getRole
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` FUNCTION `getRole`() RETURNS char(10) CHARSET utf8 deterministic
BEGIN
	SELECT role into @ret from accounts where accountId = substring_index(user(), '@', 1);
	RETURN @ret;
END$$

DELIMITER ;

GRANT EXECUTE ON function  `echo`.`getRole` TO 'echo_db_usr'@'localhost';

-- -----------------------------------------------------
-- function twoDayAnalyzes
-- -----------------------------------------------------

DELIMITER $$
CREATE DEFINER=`echo_db_usr`@`localhost` FUNCTION `twoDayAnalyzes`(
id Integer
) RETURNS int(11)
    DETERMINISTIC
BEGIN
SELECT q1,q5 into @q1_yesterday, @q5_yesterday FROM echo.dailyReports WHERE patientId = id AND date = date_sub(CURDATE(), INTERVAL 1 DAY) ORDER BY date,recordId desc LIMIT 1;
SELECT q1,q5 into @q1_today, @q5_today FROM echo.dailyReports WHERE patientId = id AND date = CURDATE() ORDER BY date,recordId desc LIMIT 1;
SET @result = 0;
if (@q1_yesterday is not null AND @q1_today is not null) then
	if (@q1_yesterday = 1 AND @q1_today = 1) then
		SET @result = @result +1;
	end if;
end if;

if (@q5_yesterday is not null AND @q5_today is not null) then
	if (@q5_yesterday = 1 AND @q5_today = 1) then
		SET @result = @result +5;
	end if;
end if;
return @result;
END$$
DELIMITER ;

GRANT EXECUTE ON function `echo`.`twoDayAnalyzes` TO 'echo_db_usr'@'localhost';

-- -----------------------------------------------------
-- function goldAnalyzes
-- -----------------------------------------------------

DELIMITER $$
CREATE DEFINER=`echo_db_usr`@`localhost` FUNCTION `goldAnalyzes`(
id int
) RETURNS varchar(1) CHARSET utf8
    DETERMINISTIC
BEGIN
CREATE TEMPORARY TABLE exTemp (status varchar(30), diagnoseDate date);
insert into exTemp select distinct status='exacerbation', diagnoseDate from cats where patientId=id and diagnoseDate>=(now() - interval 1 year);
insert into exTemp select distinct status='exacerbation', diagnoseDate from ccqs where patientId=id and diagnoseDate>=(now() - interval 1 year);
insert into exTemp select distinct status='exacerbation', diagnoseDate from treatments where patientId=id and diagnoseDate>=(now() - interval 1 year);
insert into exTemp select distinct status='exacerbation', diagnoseDate from readings where patientId=id and diagnoseDate>=(now() - interval 1 year);
select sum(status) into @exacerbation from exTemp group by diagnoseDate;

select case
	when (coalesce((select fev1>=80 and fev1_fvc<70 from readings where patientId=id))) then 1
    when (coalesce((select 50<=fev1<80 and fev1_fvc<70 from readings where patientId=id))) then 2
    when (coalesce((select 30<=fev1<50 and fev1_fvc<70 from readings where patientId=id))) then 3
    when (coalesce((select fev1<30 and fev1_fvc<70 from readings where patientId=id))) then 4
    else null end into @stadium;

select totalCatscale is not null into @catExists from cats where patientId=id and diagnoseDate>=(now() - interval 1 year);
if @catExists then
    select coalesce((select totalCatscale from cats where patientId=id order by diagnoseDate desc limit 1)) into @tot;
else
    select coalesce((select mmrc from readings where patientId=id order by diagnoseDate desc limit 1)) into @tot;
end if;

if @exacerbation>=2 then
    if (@tot>10 and @catExists or @tot>=2) then
        set @severity='D';
	else
		set @severity='C';
	end if;
else
    if (@tot>10 and @catExists or @tot>=2) then
        set @severity='B';
	else
        set @severity='A';
	end if;
end if;

if (coalesce((select severity from severity where patientId=id order by diagnoseDate desc limit 1))<>@severity) then
    insert into notification (accountId, date, type, subjectsAccount)
    values
    (id, now(), 7, null),
    (coalesce((select doctorId from patients where patientId=id)), now(), 8, id);
    if @catExists then
        insert into severity (patientId, severity, validFrom, comment)
        values
        (id, @severity, now(), (select concat('Exacerbations:', @exacerbation, ';Stadium:', @stadium, ';CAT-Scale:', @tot)));
    else
        insert into severity (patientId, severity, validFrom, comment)
        values
        (id, @severity, now(), (select concat('Exacerbations:', @exacerbation, ';Stadium:', @stadium, ';MMRC:', @tot)));
    end if;
    return @severity;
end if;
RETURN null;
END$$

DELIMITER ;

GRANT EXECUTE ON function `echo`.`goldAnalyzes` TO 'echo_db_usr'@'localhost';

-- -----------------------------------------------------
-- Table `echo`.`accounts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`accounts` (
  `accountId` INT NOT NULL,
  `username` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'doctor', 'patient') NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `reminderTime` TIME NOT NULL,
  `notificationEnabled` TINYINT(1) NOT NULL DEFAULT 1,
  `notificationMode` ENUM('email', 'sms', 'push') NOT NULL DEFAULT 'email',
  `mobile` VARCHAR(45) NULL,
  `modified` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX `email_UNIQUE` (`email` ASC),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC),
  PRIMARY KEY (`accountId`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `echo`.`patients`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`patients` (
  `patientId` INT(11) NOT NULL,
  `doctorId` INT NOT NULL,
  `firstName` VARCHAR(50) NOT NULL,
  `lastName` VARCHAR(50) NOT NULL,
  `secondName` VARCHAR(50) NULL,
  `socialId` VARCHAR(20) NOT NULL,
  `sex` TINYINT(1) NOT NULL,
  `dateOfBirth` DATE NOT NULL,
  `firstDiagnoseDate` DATE NOT NULL,
  `fullAddress` VARCHAR(255) NOT NULL,
  `landline` VARCHAR(50) NULL,
  `fileId` VARCHAR(45) NOT NULL,
   `modified` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`patientId`),
  UNIQUE INDEX `socialId_UNIQUE` (`socialId` ASC),
  UNIQUE INDEX `fileId_UNIQUE` (`fileId` ASC),
  INDEX `fkDoctor_idx` (`doctorId` ASC),
  CONSTRAINT `fkDoctor`
    FOREIGN KEY (`doctorId`)
    REFERENCES `echo`.`accounts` (`accountId`)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION,
  CONSTRAINT `fkPatient`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`accounts` (`accountId`)
    ON DELETE RESTRICT
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `echo`.`ccqs`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`ccqs` (
  `recordId` INT NOT NULL AUTO_INCREMENT,
  `patientId` INT NOT NULL,
  `diagnoseDate` DATE NULL,
  `q1` INT NOT NULL DEFAULT -1,
  `q2` INT NOT NULL DEFAULT -1,
  `q3` INT NOT NULL DEFAULT -1,
  `q4` INT NOT NULL DEFAULT -1,
  `q5` INT NOT NULL DEFAULT -1,
  `q6` INT NOT NULL DEFAULT -1,
  `q7` INT NOT NULL DEFAULT -1,
  `q8` INT NOT NULL DEFAULT -1,
  `q9` INT NOT NULL DEFAULT -1,
  `q10` INT NOT NULL DEFAULT -1,
  `totalCCQScore` FLOAT NULL DEFAULT NULL,
  `symptomScore` FLOAT NULL DEFAULT NULL,
  `mentalStateScore` FLOAT NULL DEFAULT NULL,
  `functionalStateScore` FLOAT NULL DEFAULT NULL,
  `status` ENUM('baseline', 'exacerbation') NOT NULL,
  `modified` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`recordId`),
  INDEX `ccqFKpat_idx` (`patientId` ASC),
  CONSTRAINT `ccqFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8
COLLATE = utf8_general_ci;


-- -----------------------------------------------------
-- Table `echo`.`cats`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`cats` (
  `recordId` INT NOT NULL AUTO_INCREMENT,
  `patientId` INT NOT NULL,
  `diagnoseDate` DATE NULL,
  `q1` INT NOT NULL DEFAULT -1,
  `q2` INT NOT NULL DEFAULT -1,
  `q3` INT NOT NULL DEFAULT -1,
  `q4` INT NOT NULL DEFAULT -1,
  `q5` INT NOT NULL DEFAULT -1,
  `q6` INT NOT NULL DEFAULT -1,
  `q7` INT NOT NULL DEFAULT -1,
  `q8` INT NOT NULL DEFAULT -1,
  `totalCatscale` INT NULL DEFAULT 0,
  `status` ENUM('baseline', 'exacerbation') NOT NULL,
  `modified` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`recordId`),
  INDEX `catsFKpat_idx` (`patientId` ASC),
  CONSTRAINT `catsFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8
COLLATE = utf8_general_ci;


-- -----------------------------------------------------
-- Table `echo`.`charlsons`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`charlsons` (
  `recordId` INT NOT NULL AUTO_INCREMENT,
  `patientId` INT NOT NULL,
  `diagnoseDate` DATE NULL,
  `myocardialInfarction` TINYINT(1) NULL DEFAULT 0,
  `congestiveHeartFailure` TINYINT(1) NULL DEFAULT 0,
  `peripheralVascularDisease` TINYINT(1) NULL DEFAULT 0,
  `cerebrovascularDisease` TINYINT(1) NULL DEFAULT 0,
  `dementia` TINYINT(1) NULL DEFAULT 0,
  `chronicPulmonaryDiasease` TINYINT(1) NULL DEFAULT 0,
  `connectiveTissueDisease` TINYINT(1) NULL DEFAULT 0,
  `ulcerDisease` TINYINT(1) NULL DEFAULT 0,
  `liverDiseaseMild` TINYINT(1) NULL DEFAULT 0,
  `diabetes` TINYINT(1) NULL DEFAULT 0,
  `hemiplegia` TINYINT(1) NULL DEFAULT 0,
  `renalDiseaseModerateOrSevere` TINYINT(1) NULL DEFAULT 0,
  `diabetesWithEndOrganDamage` TINYINT(1) NULL DEFAULT 0,
  `anyTumor` TINYINT(1) NULL DEFAULT 0,
  `leukemia` TINYINT(1) NULL DEFAULT 0,
  `malignantLymphoma` TINYINT(1) NULL DEFAULT 0,
  `liverDiseaseModerateOrSevere` TINYINT(1) NULL DEFAULT 0,
  `metastaticSolidMalignancy` TINYINT(1) NULL DEFAULT 0,
  `aids` TINYINT(1) NULL DEFAULT 0,
  `noConditionAvailable` TINYINT(1) NULL DEFAULT 0,
  `totalCharlson` INT(11) NULL DEFAULT 0,
  `modified` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`recordId`),
  INDEX `charFKpat_idx` (`patientId` ASC),
  CONSTRAINT `charFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8
COLLATE = utf8_general_ci;


-- -----------------------------------------------------
-- Table `echo`.`treatments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`treatments` (
  `recordId` INT NOT NULL AUTO_INCREMENT,
  `patientId` INT NOT NULL,
  `diagnoseDate` DATE NULL,
  `status` ENUM('baseline', 'exacerbation') NOT NULL,
  `shortActingB2` TINYINT(1) NULL,
  `longActingB2` TINYINT(1) NULL,
  `ultraLongB2` TINYINT(1) NULL,
  `steroidsInhaled` TINYINT(1) NULL,
  `steroidsOral` TINYINT(1) NULL,
  `sama` TINYINT(1) NULL,
  `lama` TINYINT(1) NULL,
  `pdef4Inhalator` TINYINT(1) NULL,
  `theophyline` TINYINT(1) NULL,
  `mycolytocis` TINYINT(1) NULL,
  `antibiotics` TINYINT(1) NULL,
  `antiflu` TINYINT(1) NULL,
  `antipneum` TINYINT(1) NULL,
  `ltot` TINYINT(1) NULL,
  `ltotStartDate` DATE NULL DEFAULT NULL,
  `ltotDevice` ENUM('none', 'Cylinder', 'Liquid', 'Concetrator')  NULL,
  `niv` TINYINT(1) NULL,
  `ventilationStart` DATE NULL,
  `ventilationDevice` ENUM('none', 'BiPAP', 'CPAP') NULL,
  `other` TEXT NULL,
  `modified` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`recordId`),
  INDEX `treatFKpat_idx` (`patientId` ASC),
  CONSTRAINT `treatFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8
COLLATE = utf8_general_ci;


-- -----------------------------------------------------
-- Table `echo`.`readings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`readings` (
  `recordId` INT NOT NULL AUTO_INCREMENT,
  `patientId` INT NOT NULL,
  `diagnoseDate` DATE NULL,
  `status` ENUM('baseline', 'exacerbation') NOT NULL,
  `weight` INT NULL DEFAULT NULL,
  `height` INT NULL DEFAULT NULL,
  `pxy` INT NULL DEFAULT NULL,
  `mmrc` INT NULL DEFAULT NULL,
  `smoker` INT NULL DEFAULT NULL,
  `notes` TEXT NULL DEFAULT NULL,
  `fev1` FLOAT NULL DEFAULT NULL,
  `fev1_pro` FLOAT NULL DEFAULT NULL,
  `fvc` FLOAT NULL DEFAULT NULL,
  `fvc_pro` FLOAT NULL DEFAULT NULL,
  `fev1_fvc` FLOAT NULL DEFAULT NULL,
  `rv` FLOAT NULL DEFAULT NULL,
  `rv_pro` FLOAT NULL DEFAULT NULL,
  `tlc` FLOAT NULL DEFAULT NULL,
  `tlc_pro` FLOAT NULL DEFAULT NULL,
  `rv_tlc` FLOAT NULL DEFAULT NULL,
  `satO2_pro` FLOAT NULL DEFAULT NULL,
  `dlco_pro` FLOAT NULL DEFAULT NULL,
  `pao2` FLOAT NULL DEFAULT NULL,
  `paco2` FLOAT NULL DEFAULT NULL,
  `hco3` FLOAT NULL DEFAULT NULL,
  `pH` FLOAT NULL DEFAULT NULL,
  `fvc_pre` FLOAT NULL DEFAULT NULL,
  `fvc_pre_pro` FLOAT NULL DEFAULT NULL,
  `fev1_pre` FLOAT NULL DEFAULT NULL,
  `fev1_pre_pro` FLOAT NULL DEFAULT NULL,
  `fev1_fvc_pre` FLOAT NULL DEFAULT NULL,
  `fef25_75_pre_pro` FLOAT NULL DEFAULT NULL,
  `pef_pre_pro` FLOAT NULL DEFAULT NULL,
  `tlc_pre` FLOAT NULL DEFAULT NULL,
  `tlc_pre_pro` FLOAT NULL DEFAULT NULL,
  `frc_pre` FLOAT NULL DEFAULT NULL,
  `frc_pre_pro` FLOAT NULL DEFAULT NULL,
  `rv_pre` FLOAT NULL DEFAULT NULL,
  `rv_pre_pro` FLOAT NULL DEFAULT NULL,
  `kco_pro` FLOAT NULL DEFAULT NULL,
  `hematocrit` FLOAT NULL DEFAULT NULL,
  `fvc_post` FLOAT NULL DEFAULT NULL,
  `del_fvc_pro` FLOAT NULL DEFAULT NULL,
  `fev1_post` FLOAT NULL DEFAULT NULL,
  `del_fev1_post` FLOAT NULL DEFAULT NULL,
  `del_fef25_75_pro` FLOAT NULL DEFAULT NULL,
  `del_pef_pro` FLOAT NULL DEFAULT NULL,
  `modified` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`recordId`),
  INDEX `readFKpat_idx` (`patientId` ASC),
  CONSTRAINT `readFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8
COLLATE = utf8_general_ci;


-- -----------------------------------------------------
-- Table `echo`.`perm_roles_procedures`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`perm_roles_procedures` (
  `role` VARCHAR(45) NOT NULL,
  `procedure_obj` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`role`, `procedure_obj`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8
COLLATE = utf8_general_ci;


-- -----------------------------------------------------
-- Table `echo`.`perm_roles_views`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`perm_roles_views` (
  `role` VARCHAR(45) NOT NULL,
  `view_obj` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`role`, `view_obj`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8
COLLATE = utf8_general_ci;


-- -----------------------------------------------------
-- Table `echo`.`questions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`questions` (
  `questionId` INT NOT NULL AUTO_INCREMENT,
  `category` VARCHAR(45) NOT NULL,
  `type` VARCHAR(45) NOT NULL,
  `text` VARCHAR(45) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `label` VARCHAR(45) NULL,
  PRIMARY KEY (`questionId`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `echo`.`answers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`answers` (
  `answerId` INT NOT NULL AUTO_INCREMENT,
  `questionId` INT NOT NULL,
  `text` VARCHAR(100) NULL,
  `value` INT NULL,
  PRIMARY KEY (`answerId`),
  INDEX `fk.ans.quid_idx` (`questionId` ASC),
  CONSTRAINT `fk.ans.quid`
    FOREIGN KEY (`questionId`)
    REFERENCES `echo`.`questions` (`questionId`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;



-- -----------------------------------------------------
-- Table `echo`.`dailyReports`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`dailyReports` (
  `recordId` INT NOT NULL AUTO_INCREMENT,
  `patientId` INT NOT NULL,
  `date` DATE NULL,
  `q1` TINYINT(1) NOT NULL,
  `q2` TINYINT(1) NOT NULL,
  `q3` TINYINT(1) NOT NULL,
  `q4` TINYINT(1) NOT NULL,
  `q5` TINYINT(1) NOT NULL,
  `q1a` TINYINT(1) NULL DEFAULT 0,
  `q1b` TINYINT(1) NULL DEFAULT 0,
  `q1c` TINYINT(1) NULL DEFAULT 0,
  `q3a` TINYINT(1) NULL DEFAULT 0,
  `q3b` TINYINT(1) NULL DEFAULT 0,
  `q3c` TINYINT(1) NULL DEFAULT 0,
  `satO2` FLOAT NULL DEFAULT 0,
  `walkingDist` FLOAT NULL DEFAULT 0,
  `temperature` FLOAT NULL DEFAULT 0,
  `pefr` FLOAT NULL DEFAULT 0,
  `heartRate` FLOAT NULL DEFAULT 0,
  `loc` POINT NULL DEFAULT NULL,
  `modified` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`recordId`),
  INDEX `repFKpat_idx` (`patientId` ASC),
  CONSTRAINT `repFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;



-- -----------------------------------------------------
-- Table `echo`.`deaths`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`deaths` (
  `patientId` INT NOT NULL,
  `date` DATETIME NULL,
  `cardiovascular` TINYINT(1) NULL DEFAULT 0,
  `respiratory` TINYINT(1) NULL DEFAULT 0,
  `infectious_disease` TINYINT(1) NULL DEFAULT 0,
  `malignancy` TINYINT(1) NULL DEFAULT 0,
  `other` VARCHAR(255) NULL,
  `modified` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`patientId`),
  CONSTRAINT `deathFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `echo`.`notifications`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`notifications` (
  `notificationId` INT NOT NULL AUTO_INCREMENT,
  `accountId` INT NOT NULL,
  `date` DATETIME NULL,
  `type` INT NOT NULL,
  `subjectsAccount` INT NULL,
  `message` MEDIUMTEXT NULL,
  `modified` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`notificationId`),
  INDEX `notFKpatient_idx` (`accountId` ASC),
  INDEX `notFKsubject_idx` (`subjectsAccount` ASC),
  CONSTRAINT `notFKpatient`
    FOREIGN KEY (`accountId`)
    REFERENCES `echo`.`accounts` (`accountId`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `notFKsubject`
    FOREIGN KEY (`subjectsAccount`)
    REFERENCES `echo`.`accounts` (`accountId`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `echo`.`devices`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`devices` (
  `accountId` INT NOT NULL,
  `deviceId` VARCHAR(255) NOT NULL,
  `modified` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`accountId`),
  CONSTRAINT `devicesFKacc`
    FOREIGN KEY (`accountId`)
    REFERENCES `echo`.`accounts` (`accountId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `echo`.`settings`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`settings` (
  `setting` VARCHAR(45) NOT NULL,
  `val` INT NOT NULL,
  PRIMARY KEY (`setting`))
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `echo`.`severity`
-- -----------------------------------------------------
CREATE TABLE `severity` (
  `recordId` int(11) NOT NULL AUTO_INCREMENT,
  `patientId` int(11) NOT NULL,
  `severity` enum('A','B','C','D') NOT NULL,
  `diagnoseDate` datetime NOT NULL,
  `comment` mediumtext,
  `modified` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `sevFKpat_idx` (`patientId`),
  PRIMARY KEY (`recordId`),
  CONSTRAINT `sevFKpat` FOREIGN KEY (`patientId`) REFERENCES `patients` (`patientId`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB;

USE `echo` ;

-- -----------------------------------------------------
-- Placeholder table for view `echo`.`severity_view`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`severity_view` (`recordId` INT, `patientId` INT, `severity` enum('A','B','C','D'), `diagnoseDate` date, `comment` mediumtext, modified INT);

-- -----------------------------------------------------
-- Placeholder table for view `echo`.`accounts_view`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`accounts_view` (`accountId` INT, `username` INT, `password` INT, `role` INT, `email` INT, `enabled` INT, `reminderTime` INT, `notificationEnabled` INT, `notificationMode` INT, `mobile` INT, modified INT);

-- -----------------------------------------------------
-- Placeholder table for view `echo`.`patients_view`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`patients_view` (`patientId` INT, `doctorId` INT, `firstName` INT, `lastName` INT, `secondName` INT, `socialId` INT, `sex` INT, `dateOfBirth` INT, `firstDiagnoseDate` INT, `fileId` INT, `fullAddress` INT, `landline` INT, `email` INT, `mobile` INT, `severity` ENUM('A', 'B', 'C', 'D'), `enabled` BOOLEAN, modified INT);

-- -----------------------------------------------------
-- Placeholder table for view `echo`.`cats_view`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`cats_view` (`recordId` INT, `patientId` INT, `diagnoseDate` INT, `q1` INT, `q2` INT, `q3` INT, `q4` INT, `q5` INT, `q6` INT, `q7` INT, `q8` INT, `totalCatscale` INT, `status` INT, modified INT);

-- -----------------------------------------------------
-- Placeholder table for view `echo`.`ccqs_view`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`ccqs_view` (`recordId` INT, `patientId` INT, `diagnoseDate` INT, `q1` INT, `q2` INT, `q3` INT, `q4` INT, `q5` INT, `q6` INT, `q7` INT, `q8` INT, `q9` INT, `q10` INT, `totalCCQScore` INT, `symptomScore` INT, `mentalStateScore` INT, `functionalStateScore` INT, `status` INT, modified INT);

-- -----------------------------------------------------
-- Placeholder table for view `echo`.`charlsons_view`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`charlsons_view` (`recordId` INT, `patientId` INT, `diagnoseDate` INT, `myocardialInfarction` INT, `congestiveHeartFailure` INT, `peripheralVascularDisease` INT, `cerebrovascularDisease` INT, `dementia` INT, `chronicPulmonaryDiasease` INT, `connectiveTissueDisease` INT, `ulcerDisease` INT, `liverDiseaseMild` INT, `diabetes` INT, `hemiplegia` INT, `renalDiseaseModerateOrSevere` INT, `diabetesWithEndOrganDamage` INT, `anyTumor` INT, `leukemia` INT, `malignantLymphoma` INT, `liverDiseaseModerateOrSevere` INT, `metastaticSolidMalignancy` INT, `aids` INT, `noConditionAvailable` INT, `totalCharlson` INT, modified INT);

-- -----------------------------------------------------
-- Placeholder table for view `echo`.`treatments_view`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`treatments_view` (`patientId` INT, `diagnoseDate` INT, `status` INT, `shortActingB2` INT, `longActingB2` INT, `ultraLongB2` INT, `steroidsInhaled` INT, `steroidsOral` INT, `sama` INT, `lama` INT, `pdef4Inhalator` INT, `theophyline` INT, `mycolytocis` INT, `antibiotics` INT, `antiflu` INT, `antipneum` INT, `ltot` INT, `ltotStartDate` INT, `ltotDevice` INT, `niv` INT, `ventilationStart` INT, `ventilationDevice` INT, `recordId` INT, `other` int, modified INT);

-- -----------------------------------------------------
-- Placeholder table for view `echo`.`readings_view`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`readings_view` (`patientId` INT, `diagnoseDate` INT, `weight` INT, `height` INT, `pxy` INT, `fev1` INT, `fev1_pro` INT, `fvc` INT, `fvc_pro` INT, `fev1_fvc` INT, `rv` INT, `rv_pro` INT, `tlc` INT, `tlc_pro` INT, `rv_tlc` INT, `satO2_pro` INT, `dlco_pro` INT, `pao2` INT, `paco2` INT, `hco3` INT, `pH` INT, `fvc_pre` INT, `fvc_pre_pro` INT, `fev1_pre` INT, `fev1_pre_pro` INT, `fev1_fvc_pre` INT, `fef25_75_pre_pro` INT, `pef_pre_pro` INT, `tlc_pre` INT, `tlc_pre_pro` INT, `frc_pre` INT, `frc_pre_pro` INT, `rv_pre` INT, `rv_pre_pro` INT, `kco_pro` INT, `hematocrit` INT, `status` INT, `fvc_post` INT, `del_fvc_pro` INT, `fev1_post` INT, `del_fev1_post` INT, `del_fef25_75_pro` INT, `del_pef_pro` INT, `mmrc` INT, `smoker` INT, `notes` INT, `recordId` INT, modified INT);

-- -----------------------------------------------------
-- Placeholder table for view `echo`.`dailyReports_view`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`dailyReports_view` (`recordId` INT, `patientId` INT, `date` INT, `q1` INT, `q2` INT, `q3` INT, `q4` INT, `q5` INT, `q1a` INT, `q1b` INT, `q1c` INT, `q3a` INT, `q3b` INT, `q3c` INT, `satO2` INT, `walkingDist` INT, `temperature` INT, `pefr` INT, `heartRate` INT, `loc` INT, modified INT);

-- -----------------------------------------------------
-- Placeholder table for view `echo`.`deaths_view`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`deaths_view` (`patientId` INT, `date` INT, `cardiovascular` INT, `respiratory` INT, `infectious_disease` INT, `malignancy` INT, `other` INT, modified INT);

-- -----------------------------------------------------
-- Placeholder table for view `echo`.`notifications_view`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`notifications_view` (`notificationId` INT, `accountId` INT, `date` INT, `type` INT, `subjectsAccount` INT, `message` INT);


-- -----------------------------------------------------
-- procedure dropAllDbUsers
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=CURRENT_USER PROCEDURE `dropAllDbUsers`()
BEGIN

  #declare variable
  DECLARE ptr INTEGER;
  DECLARE done INT DEFAULT FALSE;
  #declare cursor
  DECLARE cur1 CURSOR FOR SELECT DISTINCT user from mysql.procs_priv where grantor='echo_db_usr@localhost';
  #declare handle
  DECLARE CONTINUE  HANDLER FOR NOT FOUND SET done = TRUE;

  #open cursor
  OPEN cur1;
  #starts the loop
  accounts_loop: LOOP
    #get the values of each column into our  variables
    FETCH cur1 INTO ptr;
    IF done THEN
      LEAVE accounts_loop;
    END IF;
	SET @stmt = CONCAT("DROP USER '",ptr,"'@'localhost'");
	PREPARE s from @stmt;
	EXECUTE s;
	deallocate PREPARE s;
  END LOOP accounts_loop;
  CLOSE cur1;

END
$$

DELIMITER ;


-- -----------------------------------------------------
-- procedure createAllDbUsers
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=CURRENT_USER PROCEDURE `createAllDbUsers`(IN pw_prefix VARCHAR (100))
BEGIN

  #declare variable
  DECLARE ptr INTEGER;
  DECLARE done INT DEFAULT FALSE;
  #declare cursor
  DECLARE cur1 CURSOR FOR SELECT accountId
  FROM `echo`.`accounts`;
  #declare handle
  DECLARE CONTINUE  HANDLER FOR NOT FOUND SET done = TRUE;

  #open cursor
  OPEN cur1;
  #starts the loop
  accounts_loop: LOOP
    #get the values of each column into our  variables
    FETCH cur1 INTO ptr;
    IF done THEN
      LEAVE accounts_loop;
    END IF;
	CALL createDbUser(ptr, pw_prefix);
  END LOOP accounts_loop;
  CLOSE cur1;

END
$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure createDbUser
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `createDbUser`(IN uid INT, IN pw_prefix VARCHAR (100))
begin

	DECLARE x1 varchar(10);
	SELECT role into x1 FROM accounts where accountId = uid;

	if x1 is not  null then
		SET @uid = uid;
		SET @test = CONCAT(pw_prefix,uid);
		SET @stmt = CONCAT("CREATE USER '",@uid,"'@'localhost' IDENTIFIED BY '",@test,"'");
		PREPARE s from @stmt;
		EXECUTE s;
		deallocate PREPARE s;
		if x1 <> 'patient' then
			SET @stmt = CONCAT("GRANT EXECUTE ON PROCEDURE `echo`.`grantRolePermissions` TO '",@uid,"'@'localhost'");
			PREPARE s from @stmt;
			EXECUTE s;
			deallocate PREPARE s;
		end if;

	end if;
END$$

DELIMITER ;


-- -----------------------------------------------------
-- procedure repairPermissions
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=CURRENT_USER PROCEDURE `repairPermissions`()
BEGIN

  #declare variable
  DECLARE p_obj VARCHAR(255);
  DECLARE ptr INTEGER;
  DECLARE ro VARCHAR(10);
  DECLARE done INT DEFAULT FALSE;
  #declare cursor
  DECLARE cur1 CURSOR FOR SELECT accountId,role
  FROM `echo`.`accounts`;

  DECLARE cur2 CURSOR FOR SELECT DISTINCT procedure_obj
  FROM `echo`.`perm_roles_procedures` ;
  #declare handle
  DECLARE CONTINUE  HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN cur2;

    proc_loop: LOOP

    FETCH cur2 INTO p_obj;
    IF done THEN
      LEAVE proc_loop;
    END IF;
	SET @stmt = CONCAT("GRANT EXECUTE ON PROCEDURE ",p_obj ," TO 'echo_db_usr'@'localhost'");
	PREPARE s from @stmt;
	EXECUTE s;
	deallocate PREPARE s;
  END LOOP proc_loop;
  SET done = false;

  #open cursor
  OPEN cur1;
  #starts the loop
  accounts_loop: LOOP
    #get the values of each column into our  variables
    FETCH cur1 INTO ptr, ro;
    IF done THEN
      LEAVE accounts_loop;
    END IF;
	CALL grantRolePermissions(ptr, ro);
  END LOOP accounts_loop;
  CLOSE cur1;


END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure accountsCreate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `accountsCreate`(
	IN pw_prefix varchar(100),
	IN username varchar(255),
	IN pwd VARCHAR(255),
	IN email VARCHAR(100),
	IN role VARCHAR(10),
	IN enabled BOOLEAN,
	IN reTime TIME,
	IN notEnabled BOOLEAN,
	IN notMode VARCHAR(10),
	IN mobile varchar(20)
)
BEGIN


	DECLARE new_acc INT DEFAULT 0;

	if getRole() = 'doctor' and role <> 'patient' then
		signal sqlstate '22400' set message_text = 'You are not allowed to create an account with another role than patient';
	end if;

	START TRANSACTION;
	SELECT val into @nextId FROM settings WHERE setting = 'nextId' FOR UPDATE;
	UPDATE settings SET val = @nextId +1 WHERE setting = 'nextId';
    COMMIT;

	SET @stmt = "INSERT INTO accounts(`accountId`, `username`,`password`,`role`,`email`, `enabled`, `reminderTime`, `notificationEnabled`, `mobile`, `notificationMode`) VALUES(?,?,?, ?,?, ?,?, ?,?, ?);";
	set @username = username;
	SET @pwd = pwd;
	SET @email = email;
	SET @role = role;
	SET @en = enabled;
	SET @reTime = reTime;
	SET @notEn = notEnabled;
	SET @notMode = notMode;
	SET @mobile = mobile;

	PREPARE s FROM @stmt;
	EXECUTE s using @nextId, @username, @pwd, @role, @email, @en, @reTime, @notEn, @mobile, @notMode;
	DEALLOCATE PREPARE s;
	CALL createDbUser(@nextId, pw_prefix);
	SELECT @nextId as location, now() as modified;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure accountsDelete
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `accountsDelete`(IN accountId INT)
begin
IF getRole() = 'admin' OR 'echo_db_usr' = substring_index(user(), '@', 1) then
	set @id = accountId;
	SET @stmt = "DELETE FROM accounts WHERE accountId = ?";
	PREPARE s FROM @stmt;
	EXECUTE s using @id;
	SELECT row_count() as affected_rows;
	DEALLOCATE PREPARE s;
    SET @stmt = CONCAT("DROP USER '",@id,"'@'localhost'");
	PREPARE s FROM @stmt;
	EXECUTE s;
    DEALLOCATE PREPARE s;
    
else
	signal sqlstate '22403' set message_text = 'You are not authorized to disable an account';
end if;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure accountsList
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `accountsList`(IN pageNo INT, IN pageSize INT, IN sortBy VARCHAR(20), IN descending BOOLEAN, IN roleFilter VARCHAR(10))
BEGIN

	set @sort_order = ' ASC';
	set @basic_stmt = 'SELECT * FROM accounts_view';
	set @page_stmt = ' ';
	set @order_stmt = ' ';
	set @where_clause = ' ';
	
	if pageNo > 0 then
		if pageSize > 0 then
			set @pageSz = pageSize;
		else 
			set @pageSz = 20;
		end if;
		set @off = (pageNo * @pageSz) - @pageSz;
		set @page_stmt = CONCAT (' LIMIT ', @pageSz, ' OFFSET ', @off);
	end if;

	IF sortBy IS NOT NULL then
		case sortBy
			when 'username' then 
				set @sort = 'username';
			when 'role' then 
				set @sort = 'role';
			when 'email' then 
				set @sort = 'email';
			when 'enabled' then 
				set @sort = 'enabled';
			else 
				set @sort = 'accountId';
		end case;

		if descending then
			set @sort_order = ' DESC ';
		end if;
		set @order_stmt = CONCAT(' ORDER BY ', @sort, @sort_order);
	end if;

	IF roleFilter IS NOT NULL then
		case roleFilter
			when 'admin' then
				set @where_clause = " WHERE role = 'admin' ";
			when 'doctor' then
				set @where_clause = " WHERE role = 'doctor' ";
			when 'patient' then
				set @where_clause = " WHERE role = 'patient' ";
			else 
				set @where_clause = ' ';
		end case;
	end if;
	set @basic_stmt = CONCAT(@basic_stmt, @where_clause, @order_stmt, @page_stmt);
	PREPARE stmt FROM @basic_stmt;
	EXECUTE stmt;
	deallocate prepare stmt;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure accountsListOne
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `accountsListOne`(IN id INT)
BEGIN
	SET @stmt = 'SELECT * FROM accounts_view WHERE accountId = ?';
	SET @uid = id;
	PREPARE s FROM @stmt;
	EXECUTE s using @uid;
	DEALLOCATE PREPARE s;
	
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure accountsUpdate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `accountsUpdate`(
	IN accId INT,
	IN username VARCHAR(255),
	IN pwd VARCHAR(255),
	IN email VARCHAR(100),
	IN reTime TIME,
	IN notEnabled BOOLEAN,
	IN notMode VARCHAR(10),
	IN mobile varchar(20),
    IN accountEnabled BOOLEAN
)
begin
	DECLARE x1 INT;
	SELECT accountId into x1 from accounts_view where accountId  = accId;
	if x1 is not null then
		set @usr = username;
		SET @pwd = pwd;
		SET @email = email;
		SET @reTime = reTime;
		SET @notEn = notEnabled;
		SET @notMode = notMode;
		SET @mobile = mobile;
		SET @accEn = accountEnabled;
		set @id = accId;
		if (getRole() = 'patient') then
            SELECT enabled INTO @accEN FROM accounts WHERE accountId = accId;
		end if;
        SELECT role INTO @role FROM accounts WHERE accountId = accId;
        if (@role = 'admin') then
            SET @accEn = true;
        end if;
        if (pwd <> '') then
            set @pwd = pwd;
            SET @stmt = "UPDATE accounts SET password = ?, username=?, email = ?, reminderTime = ?, notificationEnabled = ?, notificationMode = ?, mobile = ?, enabled = ? WHERE accountId = ?";
            PREPARE s FROM @stmt;
            EXECUTE s using @pwd, @usr,@email, @reTime, @notEn, @notMode, @mobile, @accEn, @id;
            select row_count() as affected_rows;
            DEALLOCATE PREPARE s;
        else
            SET @stmt = "UPDATE accounts SET username=?, email = ?,  reminderTime = ?, notificationEnabled = ?, notificationMode = ?, mobile = ?, enabled = ? WHERE accountId = ?";
            PREPARE s FROM @stmt;
            EXECUTE s using @usr, @email, @reTime, @notEn, @notMode, @mobile, @accEn, @id;
            select row_count() as affected_rows;
            DEALLOCATE PREPARE s;
        end if;
	else
		signal sqlstate '22403' set message_text = 'You are not allowed to alter this account';
	end if;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure catCreate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `catCreate`(
	in patId integer,
	in diagnoseDate DATE,
	in status VARCHAR(20),
	in q1 integer,
	in q2 integer,
	in q3 integer,
	in q4 integer,
	in q5 integer,
	in q6 integer,
	in q7 integer,
	in q8 integer
)
proc: BEGIN
	DECLARE tmp INTEGER;
	if getRole() = 'doctor' then
		SELECT patientId into tmp FROM patients WHERE patientId = patId and doctorId = substring_index(user(), '@', 1);
		IF tmp IS NULL then
			signal sqlstate '22403' set message_text = 'This patient is not assigned to you'; 
		end if;
	end if;
	
	SET @stmt = "INSERT INTO cats (patientId, diagnoseDate, status, q1, q2, q3, q4, q5, q6, q7, q8) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
	set @patientId = patId;
	set @diagnoseDate = diagnoseDate;
	set @status = status;
	set @q1= q1;
	set @q2 = q2;
	set @q3 = q3;
	set @q4 = q4;
	set @q5 = q5;
	set @q6 =q6;
	set @q7 = q7;
	set @q8 = q8;

	PREPARE s FROM @stmt;
	EXECUTE s using @patientId, @diagnoseDate, @status, @q1, @q2, @q3, @q4, @q5, @q6, @q7, @q8;
	SELECt last_insert_id() as insertId, now() as modified;
	DEALLOCATE PREPARE s;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure catUpdate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `catUpdate`(
	in recordId INTEGER,
	in patientId integer,
	in diagnoseDate DATE,
	in status VARCHAR(20),
	in q1 integer,
	in q2 integer,
	in q3 integer,
	in q4 integer,
	in q5 integer,
	in q6 integer,
	in q7 integer,
	in q8 integer
)
BEGIN

	
	SET @stmt = "UPDATE cats_view  SET diagnoseDate = ?, status = ? , q1 = ?, q2=?, q3=?, q4=?, q5=?, q6=?, q7=?, q8=? where  recordId =? and patientId =?";
	set @catId = recordId;
	set @patientId = patientId;
	set @diagnoseDate = diagnoseDate;
	set @status = status;
	set @q1= q1;
	set @q2 = q2;
	set @q3 = q3;
	set @q4 = q4;
	set @q5 = q5;
	set @q6 =q6;
	set @q7 = q7;
	set @q8 = q8;


	PREPARE s FROM @stmt;
	EXECUTE s using @diagnoseDate, @status, @q1, @q2, @q3, @q4, @q5, @q6, @q7, @q8, @catId, @patientId;
	SELECT ROW_COUNT() as affected_rows;
	DEALLOCATE PREPARE s;

	

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure ccqCreate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `ccqCreate`(
	in patId integer,
	in diagnoseDate DATE,
	in status VARCHAR(20),
	in q1 integer,
	in q2 integer,
	in q3 integer,
	in q4 integer,
	in q5 integer,
	in q6 integer,
	in q7 integer,
	in q8 integer,
	in q9 integer,
	in q10 integer
)
proc: BEGIN
	DECLARE tmp INTEGER;
	if getRole() = 'doctor' then
		SELECT patientId into tmp FROM patients WHERE patientId = patId and doctorId = substring_index(user(), '@', 1);
		IF tmp IS NULL then
			signal sqlstate '22403' set message_text = 'This patient is not assigned to you'; 
		end if;
	end if;
	
	SET @stmt = "INSERT INTO ccqs (patientId, diagnoseDate, status, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
	set @patientId = patId;
	set @diagnoseDate = diagnoseDate;
	set @status = status;
	set @q1= q1;
	set @q2 = q2;
	set @q3 = q3;
	set @q4 = q4;
	set @q5 = q5;
	set @q6 =q6;
	set @q7 = q7;
	set @q8 = q8;
	set @q9 = q9;
	set @q10 = q10;

	PREPARE s FROM @stmt;
	EXECUTE s using @patientId, @diagnoseDate, @status, @q1, @q2, @q3, @q4, @q5, @q6, @q7, @q8, @q9, @q10;
	SELECt last_insert_id() as insertId, now() as modified;
	DEALLOCATE PREPARE s;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure ccqUpdate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `ccqUpdate`(
	in recordId INTEGER,
	in patientId integer,
	in diagnoseDate DATE,
	in status VARCHAR(20),
	in q1 integer,
	in q2 integer,
	in q3 integer,
	in q4 integer,
	in q5 integer,
	in q6 integer,
	in q7 integer,
	in q8 integer,
	in q9 integer,
	in q10 integer
)
BEGIN

	
	SET @stmt = "UPDATE ccqs_view  SET diagnoseDate = ?, status =? , q1 =?, q2=?, q3=?, q4=?, q5=?, q6=?, q7=?, q8=?, q9=?, q10=? where  recordId =? and patientId = ?";
	set @catId = recordId;
	set @patientId = patientId;
	set @diagnoseDate = diagnoseDate;
	set @status = status;
	set @q1= q1;
	set @q2 = q2;
	set @q3 = q3;
	set @q4 = q4;
	set @q5 = q5;
	set @q6 =q6;
	set @q7 = q7;
	set @q8 = q8;
	set @q9 = q9;
	set @q10 = q10;

	PREPARE s FROM @stmt;
	EXECUTE s using @diagnoseDate, @status, @q1, @q2, @q3, @q4, @q5, @q6, @q7, @q8, @q9, @q10, @catId, @patientId;
	SELECT ROW_COUNT() as affected_rows;	
	DEALLOCATE PREPARE s;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure charlsonCreate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `charlsonCreate`(
	in patId integer,
	in diagnoseDate DATE,
in	aids	boolean	,
in	anyTumor	boolean	,
in	cerebrovascularDisease	boolean	,
in	chronicPulmonaryDiasease	boolean	,
in	congestiveHeartFailure	boolean	,
in	connectiveTissueDisease	boolean	,
in	dementia	boolean	,
in	diabetes	boolean	,
in	diabetesWithEndOrganDamage	boolean	,
in	hemiplegia	boolean	,
in	leukemia	boolean	,
in	liverDiseaseMild	boolean	,
in	liverDiseaseModerateOrSevere	boolean	,
in	malignantLymphoma	boolean	,
in	metastaticSolidMalignancy	boolean	,
in	myocardialInfarction	boolean	,
in	peripheralVascularDisease	boolean	,
in	renalDiseaseModerateOrSevere	boolean	,
in	ulcerDisease	boolean	,
in	noConditionAvailable	boolean	
)
proc: BEGIN



	DECLARE tmp INTEGER;
	if getRole() = 'doctor' then
		SELECT patientId into tmp FROM patients WHERE patientId = patId and doctorId = substring_index(user(), '@', 1);
		IF tmp IS NULL then
			signal sqlstate '22403' set message_text = 'This patient is not assigned to you'; 
		end if;
	end if;
	
	SET @stmt = "INSERT INTO charlsons (patientId, diagnoseDate, aids, anyTumor, cerebrovascularDisease, chronicPulmonaryDiasease, congestiveHeartFailure, connectiveTissueDisease, dementia, diabetes, diabetesWithEndOrganDamage, hemiplegia, leukemia, liverDiseaseMild, liverDiseaseModerateOrSevere, malignantLymphoma, metastaticSolidMalignancy, myocardialInfarction, peripheralVascularDisease, renalDiseaseModerateOrSevere, ulcerDisease, noConditionAvailable
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
	set @patientId = patId;
	set @diagnoseDate = diagnoseDate;
set @q1 = aids ;
set @q2 = anyTumor ;
set @q3 = cerebrovascularDisease ;
set @q4 = chronicPulmonaryDiasease ;
set @q5 = congestiveHeartFailure ;
set @q6 = connectiveTissueDisease ;
set @q7 = dementia ;
set @q8 = diabetes ;
set @q9 = diabetesWithEndOrganDamage ;
set @q10 = hemiplegia ;
set @q11 = leukemia ;
set @q12 = liverDiseaseMild ;
set @q13 = liverDiseaseModerateOrSevere ;
set @q14 = malignantLymphoma ;
set @q15 = metastaticSolidMalignancy ;
set @q16 = myocardialInfarction ;
set @q17 = peripheralVascularDisease ;
set @q18 = renalDiseaseModerateOrSevere ;
set @q19 = ulcerDisease ;
set @q20 = noConditionAvailable ;


	PREPARE s FROM @stmt;
	EXECUTE s using @patientId, @diagnoseDate, @q1, @q2, @q3, @q4, @q5, @q6, @q7, @q8, @q9, @q10,@q11, @q12, @q13, @q14, @q15, @q16, @q17, @q18, @q19, @q20;
	SELECt last_insert_id() as insertId, now() as modified;
	DEALLOCATE PREPARE s;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure charlsonUpdate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `charlsonUpdate`(
	in recordId integer,
	in patId integer,
	in diagnoseDate DATE,
in	aids	boolean	,
in	anyTumor	boolean	,
in	cerebrovascularDisease	boolean	,
in	chronicPulmonaryDiasease	boolean	,
in	congestiveHeartFailure	boolean	,
in	connectiveTissueDisease	boolean	,
in	dementia	boolean	,
in	diabetes	boolean	,
in	diabetesWithEndOrganDamage	boolean	,
in	hemiplegia	boolean	,
in	leukemia	boolean	,
in	liverDiseaseMild	boolean	,
in	liverDiseaseModerateOrSevere	boolean	,
in	malignantLymphoma	boolean	,
in	metastaticSolidMalignancy	boolean	,
in	myocardialInfarction	boolean	,
in	peripheralVascularDisease	boolean	,
in	renalDiseaseModerateOrSevere	boolean	,
in	ulcerDisease	boolean	,
in	noConditionAvailable	boolean	
)
BEGIN

	
	SET @stmt = "UPDATE charlsons_view  SET diagnoseDate = ?, aids = ?, anyTumor = ?, cerebrovascularDisease = ?, chronicPulmonaryDiasease = ?, congestiveHeartFailure = ?, connectiveTissueDisease = ?, dementia = ?, diabetes = ?, diabetesWithEndOrganDamage = ?, hemiplegia = ?, leukemia = ?, liverDiseaseMild = ?, liverDiseaseModerateOrSevere = ?, malignantLymphoma = ?, metastaticSolidMalignancy = ?, myocardialInfarction = ?, peripheralVascularDisease = ?, renalDiseaseModerateOrSevere = ?, ulcerDisease = ?, noConditionAvailable = ?
 where  recordId =? and patientId = ?";
	set @recId = recordId;
	set @patientId = patId;
	set @diagnoseDate = diagnoseDate;
set @q1 = aids ;
set @q2 = anyTumor ;
set @q3 = cerebrovascularDisease ;
set @q4 = chronicPulmonaryDiasease ;
set @q5 = congestiveHeartFailure ;
set @q6 = connectiveTissueDisease ;
set @q7 = dementia ;
set @q8 = diabetes ;
set @q9 = diabetesWithEndOrganDamage ;
set @q10 = hemiplegia ;
set @q11 = leukemia ;
set @q12 = liverDiseaseMild ;
set @q13 = liverDiseaseModerateOrSevere ;
set @q14 = malignantLymphoma ;
set @q15 = metastaticSolidMalignancy ;
set @q16 = myocardialInfarction ;
set @q17 = peripheralVascularDisease ;
set @q18 = renalDiseaseModerateOrSevere ;
set @q19 = ulcerDisease ;
set @q20 = noConditionAvailable ;


	PREPARE s FROM @stmt;
	EXECUTE s using  @diagnoseDate, @q1, @q2, @q3, @q4, @q5, @q6, @q7, @q8, @q9, @q10,@q11, @q12, @q13, @q14, @q15, @q16, @q17, @q18, @q19, @q20, @recId, @patientId;
	SELECT ROW_COUNT() as affected_rows;	
	DEALLOCATE PREPARE s;


END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure deathCreate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `deathCreate`(
in patId int,
in date date,
in cardiovascular boolean,
in respiratory boolean,
in infectious_disease boolean,
in malignancy boolean,
in other varchar(255)
)
BEGIN

		SET @doc = substring_index(user(), '@', 1);
		set @pid = patId;

		SET @test_stmt = 'SELECT patientId into @tmp FROM patients_view WHERE patientId = ? and doctorId = ?';
		PREPARE statement FROM @test_stmt;
		EXECUTE statement using @pid, @doc;
		DEALLOCATE PREPARE statement;
		IF @tmp IS NULL then
			signal sqlstate '22403' set message_text = 'You are not allowed to view this patients data!'; 
		end if;


	set @date = date ;
	set @cardiovascular = cardiovascular ;
	set @respiratory = respiratory ;
	set @infectious_disease = infectious_disease ;
	set @malignancy = malignancy ;
	set @other = other ;
	set @stmt = "Insert into deaths(patientId,date,cardiovascular,respiratory,infectious_disease,malignancy,other) VALUES (?,?,?,?,?,?,?)";

	PREPARE s FROM @stmt;
	EXECUTE s using @pid, @date, @cardiovascular ,@respiratory, @infectious_disease,@malignancy,@other;
	SELECt last_insert_id() as insertId, now() as modified;
	DEALLOCATE PREPARE s;


END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure deathDelete
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `deathDelete`(IN patientId INT)
BEGIN
		set @pid = patientId;
		SET @stmt = CONCAT("DELETE FROM deaths_view WHERE patientId = ?");
		PREPARE s FROM @stmt;
		EXECUTE s using  @pid;
		SELECT ROW_COUNT() as affected_rows;
		DEALLOCATE PREPARE s;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure deathGet
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `deathGet`(in patId int)
BEGIN
		SET @doc = substring_index(user(), '@', 1);
		set @basic_stmt = CONCAT ('SELECT * FROM deaths_view WHERE patientId = ?');
		set @pid = patId;

		SET @test_stmt = 'SELECT patientId into @tmp FROM patients_view WHERE patientId = ? and doctorId = ?';
		PREPARE statement FROM @test_stmt;
		EXECUTE statement using @pid, @doc;
		DEALLOCATE PREPARE statement;
		IF @tmp IS NULL then
			signal sqlstate '22403' set message_text = 'You are not allowed to view this patients data!'; 
		end if;

		PREPARE s FROM @basic_stmt;
		EXECUTE s using @pid;
		DEALLOCATE PREPARE s;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure deathUpdate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `deathUpdate`(
in patientId int,
in date date,
in cardiovascular boolean,
in respiratory boolean,
in infectious_disease boolean,
in malignancy boolean,
in other varchar(255)
)
BEGIN
	
	set @pid = patientId;
	
	set @date = date ;
	set @cardiovascular = cardiovascular ;
	set @respiratory = respiratory ;
	set @infectious_disease = infectious_disease ;
	set @malignancy = malignancy ;
	set @other = other ;

	set @stmt = "UPDATE deaths_view SET date =?,cardiovascular=?,respiratory=?,infectious_disease=?,malignancy=?,other=? where patientId =?";
	
	PREPARE s FROM @stmt;
	EXECUTE s using @date, @cardiovascular ,@respiratory, @infectious_disease,@malignancy,@other,@pid;
	SELECT ROW_COUNT() as affected_rows;
	DEALLOCATE PREPARE s;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure deleteExamRecord
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `deleteExamRecord`(IN examtype VARCHAR(20), IN patientId INT, IN recordId INT)
begin
	case examtype
		when 'cats' then
			set @table = 'cats_view';
		when 'ccqs' then
			set @table = 'ccqs_view';
		when 'charlsons' then
			set @table = 'charlsons_view';
		when 'readings' then
			set @table = 'readings_view';
		when 'treatments' then
			set @table = 'treatments_view';
     	when 'severity' then
			set @table = 'severity_view';
		else
			set @table = ' ';
	end case;
	if @table != ' ' then
		set @pid = patientId;
		set @rid = recordId;
		SET @stmt = CONCAT("DELETE FROM ",@table," WHERE recordId = ? and patientId = ?");
		PREPARE s FROM @stmt;
		EXECUTE s using @rid, @pid;
		SELECT ROW_COUNT() as affected_rows;
		DEALLOCATE PREPARE s;
	else
		signal sqlstate '02500' set message_text = 'Internal Server Error: Wrong Usage!';
	end if;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure deviceAdd
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `deviceAdd`(in deviceId varchar(255))
BEGIN
	SET @id = substring_index(user(), '@', 1);
	set @deviceId = deviceId;
	SET @test_stmt = 'REPLACE INTO devices(accountId, deviceId) VALUES (?,?)';
	PREPARE statement FROM @test_stmt;
	EXECUTE statement using @id, @deviceId;
	DEALLOCATE PREPARE statement;
	SELECT now() as modified;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure deviceRemove
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `deviceRemove`(in deviceId varchar(255))
BEGIN
	SET @id = substring_index(user(), '@', 1);
	set @deviceId = deviceId;
	SET @test_stmt = 'DELETE FROM devices WHERE accountId = ? and deviceId = ?';
	PREPARE statement FROM @test_stmt;
	EXECUTE statement using @id, @deviceId;
    SELECT ROW_COUNT() as affected_rows; 
	DEALLOCATE PREPARE statement;		
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure reportCreate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `reportCreate`(
in patId Int,
in date date,
in q1 boolean,
in q2 boolean,
in q3 boolean,
in q4 boolean,
in q5 boolean,
in q1a boolean,
in q1b boolean,
in q1c boolean,
in q3a boolean,
in q3b boolean,
in q3c boolean,
in satO2 float,
in walkingDist float,
in temperature float,
in pefr float,
in heartRate float,
in x VARCHAR(20),
in y VARCHAR(20)
)
proc: BEGIN
	DECLARE tmp1 INTEGER;
	if getRole() = 'doctor' then
		SELECT patientId into tmp1 FROM patients WHERE patientId = patId and doctorId = substring_index(user(), '@', 1);
		IF tmp1 IS NULL then
			signal sqlstate '22403' set message_text = 'This patient is not assigned to you'; 
		end if;
	end if;
	if getRole() = 'patient' then
		IF substring_index(user(), '@', 1) <> patId then
			signal sqlstate '22403' set message_text = 'Access Forbidden, Please use your Account for the report.'; 
		end if;
	end if;
	
	SET @stmt = "INSERT INTO dailyReports (patientId, date, q1, q2, q3, q4, q5, q1a, q1b, q1c, q3a, q3b, q3c, satO2, walkingDist, temperature, pefr, heartRate, loc) 
	VALUES (?,?, ?,?,?,?,?, ?,?,?, ?,?,?, ?,?,?,?,?, GeomFromText(?))";
set @patientId = patId ;
set @date = date ;
set @q1 = q1 ;
set @q2 = q2 ;
set @q3 = q3 ;
set @q4 = q4 ;
set @q5 = q5 ;
set @q1a = q1a ;
set @q1b = q1b ;
set @q1c = q1c ;
set @q3a = q3a ;
set @q3b = q3b ;
set @q3c = q3c ;
set @satO2 = satO2 ;
set @walkingDist = walkingDist ;
set @temperature = temperature ;
set @pefr = pefr ;
set @heartRate = heartRate ;
set @loc = CONCAT("POINT(", x , " ", y, ")");

	PREPARE s FROM @stmt;
	EXECUTE s using @patientId,@date,@q1,@q2,@q3,@q4,@q5,@q1a,@q1b,@q1c,@q3a,@q3b,@q3c,@satO2,@walkingDist,@temperature,@pefr,@heartRate, @loc;
	SELECt last_insert_id() as insertId, now() as modified;
	DEALLOCATE PREPARE s;

END$$

DELIMITER ;


-- -----------------------------------------------------
-- procedure reportDelete
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `reportDelete`(
IN patientId INT, 
IN recordId INT
)
BEGIN
		set @pid = patientId;
		set @rid = recordId;
		SET @stmt = CONCAT("DELETE FROM dailyReports_view WHERE recordId = ? and patientId = ?");
		PREPARE s FROM @stmt;
		EXECUTE s using @rid, @pid;
		SELECT ROW_COUNT() as affected_rows;
		DEALLOCATE PREPARE s;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure reportList
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `reportList`(IN patId INT, IN pageNo INT, IN pageSize INT)
BEGIN

	DECLARE tmp1 INTEGER;
	if getRole() = 'doctor' then
		SELECT patientId into tmp1 FROM patients WHERE patientId = patId and doctorId = substring_index(user(), '@', 1);
		IF tmp1 IS NULL then
			signal sqlstate '22403' set message_text = 'This patient is not assigned to you'; 
		end if;
	end if;
	if getRole() = 'patient' then
		IF substring_index(user(), '@', 1) <> patId then
			signal sqlstate '22403' set message_text = 'Access Forbidden, Please use your Account for the report.'; 
		end if;
	end if;
		set @basic_stmt = CONCAT ('SELECT recordId, patientId, date, q1, q2, q3, q4, q5, q1a, q1b, q1c, q3a, q3b, q3c, satO2, walkingDist, temperature, pefr, heartRate, X(loc) as X, Y(loc) as Y, modified FROM dailyReports_view d WHERE patientId = ? AND recordId IN (SELECT recordId FROM dailyReports d, (SELECT patientId, date, MAX(modified) as m FROM dailyReports GROUP BY patientId,date) as TMP WHERE d.patientId = TMP.patientId AND d.modified = TMP.m) ORDER BY date DESC ');
		set @page_stmt = ' ';
		set @pid = patId;

		if pageNo > 0 then
			if pageSize > 0 then
				set @pageSz = pageSize;
			else 
				set @pageSz = 20;
			end if;
			set @off = (pageNo * @pageSz) - @pageSz;
			set @page_stmt = CONCAT (' LIMIT ', @pageSz, ' OFFSET ', @off);
		end if;

		set @basic_stmt = CONCAT(@basic_stmt, @page_stmt);
        
		PREPARE s FROM @basic_stmt;
		EXECUTE s using @pid;
		DEALLOCATE PREPARE s;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure reportListOne
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `reportListOne`(IN patId INT, IN recId INT)
BEGIN

	DECLARE tmp1 INTEGER;
	if getRole() = 'doctor' then
		SELECT patientId into tmp1 FROM patients WHERE patientId = patId and doctorId = substring_index(user(), '@', 1);
		IF tmp1 IS NULL then
			signal sqlstate '22403' set message_text = 'This patient is not assigned to you'; 
		end if;
	end if;
	if getRole() = 'patient' then
		IF substring_index(user(), '@', 1) <> patId then
			signal sqlstate '22403' set message_text = 'Access Forbidden, Please use your Account for the report.'; 
		end if;
	end if;
		set @basic_stmt = CONCAT ('SELECT recordId, patientId, date, q1, q2, q3, q4, q5, q1a, q1b, q1c, q3a, q3b, q3c, satO2, walkingDist, temperature, pefr, heartRate, X(loc) as X, Y(loc) as Y, modified  FROM dailyReports_view WHERE patientId = ? and recordId = ?');
		set @pid = patId;
		set @rid = recId;
		PREPARE s FROM @basic_stmt;
		EXECUTE s using @pid, @rid;
		DEALLOCATE PREPARE s;

END$$

DELIMITER ;


-- -----------------------------------------------------
-- procedure reportUpdate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `reportUpdate`(
in recordId int,
in patientId Int,
in date date,
in q1 boolean,
in q2 boolean,
in q3 boolean,
in q4 boolean,
in q5 boolean,
in q1a boolean,
in q1b boolean,
in q1c boolean,
in q3a boolean,
in q3b boolean,
in q3c boolean,
in satO2 float,
in walkingDist float,
in temperature float,
in pefr float,
in heartRate float,
in x VARCHAR(20),
in y VARCHAR(20)
)
BEGIN
	SET @stmt = "UPDATE dailyReports_view  SET date=?,q1=?,q2=?,q3=?,q4=?,q5=?,q1a=?,q1b=?,q1c=?
    ,q3a=?,q3b=?,q3c=?,satO2=?,walkingDist=?,temperature =?,pefr=?,heartRate=?, loc =GeomFromText(?)
 where  recordId =? and patientId = ?"; 
set @recId = recordId;
set @patientId = patientId ;
set @date = date ;
set @q1 = q1 ;
set @q2 = q2 ;
set @q3 = q3 ;
set @q4 = q4 ;
set @q5 = q5 ;
set @q1a = q1a ;
set @q1b = q1b ;
set @q1c = q1c ;
set @q3a = q3a ;
set @q3b = q3b ;
set @q3c = q3c ;
set @satO2 = satO2 ;
set @walkingDist = walkingDist ;
set @temperature = temperature ;
set @pefr = pefr ;
set @heartRate = heartRate ;
set @loc = CONCAT("POINT(", x , " ", y, ")");


	PREPARE s FROM @stmt;
	EXECUTE s using @date,@q1,@q2,@q3,@q4,@q5,@q1a,@q1b,@q1c,@q3a,@q3b,@q3c,@satO2,@walkingDist,@temperature,@pefr,@heartRate, @loc,@recId,@patientId;
	SELECT ROW_COUNT() as affected_rows;
	DEALLOCATE PREPARE s;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure treatmentCreate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `treatmentCreate`(
in patId integer ,
in diagnoseDate DATE ,
in status VARCHAR(15) ,
in antibiotics BOOLEAN ,
in antiflu BOOLEAN ,
in antipneum BOOLEAN ,
in lama BOOLEAN ,
in longActingB2 BOOLEAN ,
in ltot BOOLEAN ,
in ltotDevice VARCHAR(50) ,
in ltotStartDate DATE ,
in mycolytocis BOOLEAN ,
in niv BOOLEAN ,
in pdef4Inhalator BOOLEAN ,
in sama BOOLEAN ,
in shortActingB2 BOOLEAN ,
in steroidsInhaled BOOLEAN ,
in steroidsOral BOOLEAN ,
in theophyline BOOLEAN ,
in ultraLongB2 BOOLEAN ,
in ventilationDevice VARCHAR(50) ,
in ventilationStart DATE,
in other TEXT
)
proc: BEGIN



	DECLARE tmp INTEGER;
	if getRole() = 'doctor' then
		SELECT patientId into tmp FROM patients WHERE patientId = patId and doctorId = substring_index(user(), '@', 1);
		IF tmp IS NULL then
			LEAVE proc;
		end if;
	end if;
	
	SET @stmt = "INSERT INTO treatments (patientId, diagnoseDate, status,antibiotics,antiflu,antipneum,lama,longActingB2,ltot,ltotDevice,ltotStartDate,mycolytocis,niv,pdef4Inhalator,sama,shortActingB2,steroidsInhaled,steroidsOral,theophyline,ultraLongB2,ventilationDevice,ventilationStart, other)
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
	set @patientId = patId;
	set @diagnoseDate = diagnoseDate;
	set @status = status;
set @q1 = antibiotics ;
set @q2 = antiflu ;
set @q3 = antipneum ;
set @q4 = lama ;
set @q5 = longActingB2 ;
set @q6 = ltot ;
set @q7 = ltotDevice ;
set @q8 = ltotStartDate ;
set @q9 = mycolytocis ;
set @q10 = niv ;
set @q11 = pdef4Inhalator ;
set @q12 = sama ;
set @q13 = shortActingB2 ;
set @q14 = steroidsInhaled ;
set @q15 = steroidsOral ;
set @q16 = theophyline ;
set @q17 = ultraLongB2 ;
set @q18 = ventilationDevice ;
set @q19 = ventilationStart ;
set @q20 = other;

	PREPARE s FROM @stmt;
	EXECUTE s using @patientId, @diagnoseDate, @status, @q1, @q2, @q3, @q4, @q5, @q6, @q7, @q8, @q9, @q10,@q11, @q12, @q13, @q14, @q15, @q16, @q17, @q18, @q19, @q20;
	SELECt last_insert_id() as insertId, now() as modified;
	DEALLOCATE PREPARE s;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure treatmentUpdate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `treatmentUpdate`(
	in recordId integer,
in patId integer ,
in diagnoseDate DATE ,
in status VARCHAR(15) ,
in antibiotics BOOLEAN ,
in antiflu BOOLEAN ,
in antipneum BOOLEAN ,
in lama BOOLEAN ,
in longActingB2 BOOLEAN ,
in ltot BOOLEAN ,
in ltotDevice VARCHAR(50) ,
in ltotStartDate DATE ,
in mycolytocis BOOLEAN ,
in niv BOOLEAN ,
in pdef4Inhalator BOOLEAN ,
in sama BOOLEAN ,
in shortActingB2 BOOLEAN ,
in steroidsInhaled BOOLEAN ,
in steroidsOral BOOLEAN ,
in theophyline BOOLEAN ,
in ultraLongB2 BOOLEAN ,
in ventilationDevice VARCHAR(50) ,
in ventilationStart DATE ,
in other TEXT
)
BEGIN

	
	SET @stmt = "UPDATE treatments_view  SET diagnoseDate = ?, status =? ,antibiotics=?,antiflu=?,antipneum=?,lama=?,longActingB2=?,ltot=?,ltotDevice=?,ltotStartDate=?,mycolytocis=?,niv=?,pdef4Inhalator=?,sama=?,shortActingB2=?,steroidsInhaled=?,steroidsOral=?,theophyline=?,ultraLongB2=?,ventilationDevice=?,ventilationStart =?, other = ?
 where  recordId =? and patientId = ?";
	set @recId = recordId;
	set @patientId = patId;
	set @diagnoseDate = diagnoseDate;
	set @status = status;
set @q1 = antibiotics ;
set @q2 = antiflu ;
set @q3 = antipneum ;
set @q4 = lama ;
set @q5 = longActingB2 ;
set @q6 = ltot ;
set @q7 = ltotDevice ;
set @q8 = ltotStartDate ;
set @q9 = mycolytocis ;
set @q10 = niv ;
set @q11 = pdef4Inhalator ;
set @q12 = sama ;
set @q13 = shortActingB2 ;
set @q14 = steroidsInhaled ;
set @q15 = steroidsOral ;
set @q16 = theophyline ;
set @q17 = ultraLongB2 ;
set @q18 = ventilationDevice ;
set @q19 = ventilationStart ;
set @q20 = other;

	PREPARE s FROM @stmt;
	EXECUTE s using @diagnoseDate, @status, @q1, @q2, @q3, @q4, @q5, @q6, @q7, @q8, @q9, @q10,@q11, @q12, @q13, @q14, @q15, @q16, @q17, @q18, @q19, @q20, @recId, @patientId;
	SELECT ROW_COUNT() as affected_rows;
	DEALLOCATE PREPARE s;


END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure grantRolePermissions
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `grantRolePermissions`(
IN uid INT, 
IN ro VARCHAR(10)
)
BEGIN
  #declare variable
  DECLARE v_obj VARCHAR(255);
  DECLARE p_obj VARCHAR(255);
  DECLARE done INT DEFAULT FALSE;
  #declare cursor
  DECLARE cur1 CURSOR FOR SELECT view_obj
  FROM `echo`.`perm_roles_views` 
  WHERE `echo`.`perm_roles_views`.`role` = ro;
  DECLARE cur2 CURSOR FOR SELECT procedure_obj
  FROM `echo`.`perm_roles_procedures` 
  WHERE `echo`.`perm_roles_procedures`.`role` = ro;
  #declare handle 
  DECLARE CONTINUE  HANDLER FOR NOT FOUND SET done = TRUE;
  SET @uid = uid;
  #open cursor
  OPEN cur1;
  #starts the loop
  views_loop: LOOP
    #get the values of each column into our  variables
    FETCH cur1 INTO v_obj;
    IF done THEN
      LEAVE views_loop;
    END IF;
	SET @stmt = CONCAT("GRANT SELECT, SHOW VIEW ON ",v_obj ," TO '",@uid,"'@'localhost'");
	PREPARE s from @stmt;
	EXECUTE s;
	deallocate PREPARE s;
  END LOOP views_loop;
  CLOSE cur1;
  SET done = false;
  #open cursor
  OPEN cur2;
  #starts the loop
  proc_loop: LOOP
    #get the values of each column into our variables
    FETCH cur2 INTO p_obj;
    IF done THEN
      LEAVE proc_loop;
    END IF;
	SET @stmt = CONCAT("GRANT EXECUTE ON PROCEDURE ",p_obj ," TO '",@uid,"'@'localhost'");
	PREPARE s from @stmt;
	EXECUTE s;
	deallocate PREPARE s;
  END LOOP proc_loop;
  CLOSE cur2;
  SET @stmt = CONCAT("GRANT SELECT ON TABLE echo.questions TO '",@uid,"'@'localhost'");
  PREPARE s from @stmt;
  EXECUTE s;
  deallocate PREPARE s;
  SET @stmt = CONCAT("GRANT SELECT ON TABLE echo.answers TO '",@uid,"'@'localhost'");
  PREPARE s from @stmt;
  EXECUTE s;
  deallocate PREPARE s;
  if (ro = 'admin') then
    SET @stmt = CONCAT("GRANT INSERT,DELETE,UPDATE ON TABLE echo.questions TO '",@uid,"'@'localhost'");
    PREPARE s from @stmt;
    EXECUTE s;
    deallocate PREPARE s;
    SET @stmt = CONCAT("GRANT INSERT,DELETE,UPDATE ON TABLE echo.answers TO '",@uid,"'@'localhost'");
    PREPARE s from @stmt;
    EXECUTE s;
    deallocate PREPARE s;
  end if;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure listExams
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `listExams`(IN examtype VARCHAR(20), IN patId INT, IN pageNo INT, IN pageSize INT)
BEGIN
	case examtype
		when 'cats' then
			set @table = 'cats_view';
		when 'ccqs' then
			set @table = 'ccqs_view';
		when 'charlsons' then
			set @table = 'charlsons_view';
		when 'readings' then
			set @table = 'readings_view';
		when 'treatments' then
			set @table = 'treatments_view';
		when 'severity' then
		    set @table = 'severity_view';
		else
			set @table = ' ';
	end case;
	if @table != ' ' then
		SET @doc = substring_index(user(), '@', 1);
		set @basic_stmt = CONCAT ('SELECT * FROM ', @table,' WHERE patientId = ? ORDER BY diagnoseDate,modified DESC ');
		set @page_stmt = ' ';
		set @pid = patId;

		SET @test_stmt = 'SELECT patientId into @tmp FROM patients_view WHERE patientId = ? and doctorId = ?';
		PREPARE statement FROM @test_stmt;
		EXECUTE statement using @pid, @doc;
		DEALLOCATE PREPARE statement;
		IF @tmp IS NULL then
			signal sqlstate '22403' set message_text = 'You are not allowed to view this patients data!'; 
		end if;


		if pageNo > 0 then
			if pageSize > 0 then
				set @pageSz = pageSize;
			else 
				set @pageSz = 20;
			end if;
			set @off = (pageNo * @pageSz) - @pageSz;
			set @page_stmt = CONCAT (' LIMIT ', @pageSz, ' OFFSET ', @off);
		end if;

		
		set @basic_stmt = CONCAT(@basic_stmt, @page_stmt);
		PREPARE s FROM @basic_stmt;
		EXECUTE s using @pid;
		DEALLOCATE PREPARE s;
	else
		signal sqlstate '22500' set message_text = 'Internal Server Error: Wrong Usage!';
	end if;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure listSingleExam
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `listSingleExam`(IN examtype VARCHAR(20), IN patId INT, IN recId INT)
BEGIN
	case examtype
		when 'cats' then
			set @table = 'cats_view';
		when 'ccqs' then
			set @table = 'ccqs_view';
		when 'charlsons' then
			set @table = 'charlsons_view';
		when 'readings' then
			set @table = 'readings_view';
		when 'treatments' then
			set @table = 'treatments_view';
		when 'severity' then
		    set @table = 'severity_view';
		else
			set @table = ' ';
	end case;
	if @table != ' ' then
		SET @doc = substring_index(user(), '@', 1);
		set @basic_stmt = CONCAT ('SELECT * FROM ', @table,' WHERE patientId = ? and recordId = ?');
		set @pid = patId;
		set @rid = recId;

		SET @test_stmt = 'SELECT patientId into @tmp FROM patients_view WHERE patientId = ? and doctorId = ?';
		PREPARE statement FROM @test_stmt;
		EXECUTE statement using @pid, @doc;
		DEALLOCATE PREPARE statement;
		IF @tmp IS NULL then
			signal sqlstate '22403' set message_text = 'You are not allowed to view this patients data!'; 
		end if;

		PREPARE s FROM @basic_stmt;
		EXECUTE s using @pid, @rid;
		DEALLOCATE PREPARE s;
	else
		signal sqlstate '22500' set message_text = 'Internal Server Error: Wrong Usage!';
	end if;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure login
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `login`(IN usr VARCHAR(255))
begin

	set @usr = usr;
	SET @stmt = "SELECT * FROM accounts where username=? and enabled = 1";	
	PREPARE s FROM @stmt;
	EXECUTE s using @usr;
	DEALLOCATE PREPARE s;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure loginRefresh
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `loginRefresh`(IN uid VARCHAR(255))
begin

	set @usr = uid;
	SET @stmt = CONCAT("SELECT * FROM accounts where accountId=? and enabled = 1");	
	PREPARE s FROM @stmt;
	EXECUTE s using @usr;
	DEALLOCATE PREPARE s;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure patientsCreate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `patientsCreate`(
in accountId int ,
in doctorId int ,
in firstName VARCHAR(50) ,
in lastName VARCHAR(50) ,
in secondName VARCHAR(50) ,
in socialId VARCHAR(20) ,
in sex BOOLEAN ,
in dateOfBirth DATE ,

in firstDiagnoseDate DATE ,
in fileId varchar(20) ,
in fullAddress VARCHAR(255) ,
in landline VARCHAR(50) 
)
BEGIN
	SET @self = substring_index(user(), '@', 1);
	SET @doctorId = doctorId;
	if getRole() = 'doctor' and @self <> @doctorId then
		signal sqlstate '22403' set message_text = 'You cannot assign a patient to another doctor than yourself';
	end if;

	SET @stmt = "INSERT INTO patients(patientId, doctorId, firstName, lastName, secondName, socialId, sex, dateOfBirth, firstDiagnoseDate, fullAddress, landline, fileId) VALUES(?,?,?,?,?,?,?,?,?,?,?,?);";
	SET @patientId = accountId;
	SET @firstName = firstName;
	SET @lastName = lastName;
	SET @secondName = secondName;
	SET @socialId = socialId;
	SET @sex = sex;
	SET @dateOfBirth = dateOfBirth;
	SET @firstDiagnoseDate = firstDiagnoseDate;
	SET @fileId = fileId;
	SET @fullAddress = fullAddress;
	SET @landline = landline;
	PREPARE s FROM @stmt;
	EXECUTE s using @patientId, @doctorId, @firstName, @lastName, @secondName, @socialId, @sex, @dateOfBirth,  @firstDiagnoseDate, @fullAddress, @landline, @fileId;
	SELECt @patientId as insertId, now() as modified;
	DEALLOCATE PREPARE s;


END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure patientsDelete
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `patientsDelete`(IN accId INT)
begin
	DECLARE x1 INT;
	SELECT patientId into x1 from patients_view where patientId  = accId;
	if x1 is not null then
	set @id = accId;
	SET @stmt = "DELETE FROM patients WHERE patientId = ?";

	PREPARE s FROM @stmt;
	EXECUTE s using @id;
	SELECT row_count() as affected_rows;
	DEALLOCATE PREPARE s;	
	else
		signal sqlstate '22403' set message_text = 'You are not allowed to delete this patient';
	end if;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure patientsRessourceUpdate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `patientsRessourceUpdate`(
	IN patientId INT,
in doctorId int ,
in firstName VARCHAR(50) ,
in lastName VARCHAR(50) ,
in secondName VARCHAR(50) ,
in socialId VARCHAR(20) ,
in sex BOOLEAN ,
in dateOfBirth DATE ,
in firstDiagnoseDate DATE ,
in fileId varchar(20) ,
in fullAddress VARCHAR(255) ,
in landline VARCHAR(50),
	IN email VARCHAR(50),
	IN mobile varchar(20)
)
begin
	
	DECLARE temp VARCHAR(50);
	DECLARE exit handler for sqlwarning, sqlexception
	BEGIN
		-- WARNING
		rollback;
		RESIGNAL;
	END;
	set @id = patientId;
	SELECT v.lastName into temp from patients_view v where v.patientId = @id;
    if temp is not null then
	set @pat_affected = 0;
	set @acc_affected = 0;
    START transaction;
	SET @email = email;
	SET @mobile = mobile;

	SELECT p.doctorId into @docId FROM patients p WHERE p.patientId = @id;


	SET @stmt = "UPDATE patients SET firstName=?, lastName=?, secondName=?, socialId=?, sex=?, dateOfBirth=?, firstDiagnoseDate=?, fullAddress=?, landline=?, fileId=?, doctorId =? where patientId = ?";
	SET @firstName = firstName;
	SET @lastName = lastName;
	SET @secondName = secondName;
	SET @socialId = socialId;
	SET @sex = sex;
	SET @dateOfBirth = dateOfBirth;
	SET @firstDiagnoseDate = firstDiagnoseDate;
	SET @fileId = fileId;
	SET @fullAddress = fullAddress;
	SET @landline = landline;
	if getRole() = 'admin' then SET @docId = dId; end if;

	PREPARE s FROM @stmt;
	EXECUTE s using @firstName, @lastName, @secondName, @socialId, @sex, @dateOfBirth, @firstDiagnoseDate, @fullAddress, @landline, @fileId, @docId, @id;
	select row_count() into @pat_affected;
	DEALLOCATE PREPARE s;

	SET @stmt = "UPDATE accounts SET email = ?, mobile = ? WHERE accountId = ?";
	PREPARE s FROM @stmt;
	EXECUTE s using @email, @mobile, @id;
	select row_count() into @acc_affected;
	DEALLOCATE PREPARE s;

	commit;

	SELECT @pat_affected+@acc_affected as affected_rows;
    else
		SELECT 0 as affected_rows;
    end if;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure severityCreate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `severityCreate`(
IN patId INT,
IN date DATETIME,
IN comment MEDIUMTEXT,
IN severity ENUM('A', 'B', 'C', 'D')
)
BEGIN
SET @doc = substring_index(user(), '@', 1);
set @pid = patId;

SET @test_stmt = 'SELECT patientId into @tmp FROM patients_view WHERE patientId = ? and doctorId = ?';
PREPARE statement FROM @test_stmt;
EXECUTE statement using @pid, @doc;
DEALLOCATE PREPARE statement;
IF @tmp IS NULL then
	signal sqlstate '22403' set message_text = 'This patient isnt assigned to you!';
end if;


set @diagnoseDate = date;
set @comment = comment ;
set @severity = severity ;
set @stmt = "Insert into severity(patientId,severity,diagnoseDate,comment) VALUES (?,?,?,?)";

PREPARE s FROM @stmt;
EXECUTE s using @pid, @severity, @diagnoseDate ,@comment;
SELECt last_insert_id() as insertId, now() as modified;
DEALLOCATE PREPARE s;
END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure readingsCreate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `readingsCreate`(
in patId integer ,
in diagnoseDate DATE ,
in status VARCHAR(15) ,
in del_fef25_75_pro FLOAT ,
in del_fev1_post FLOAT ,
in del_fvc_pro FLOAT ,
in del_pef_pro FLOAT ,
in dlco_pro FLOAT ,
in fef25_75_pre_pro FLOAT ,
in fev1 FLOAT ,
in fev1_fvc FLOAT ,
in fev1_fvc_pre FLOAT ,
in fev1_post FLOAT ,
in fev1_pre FLOAT ,
in fev1_pre_pro FLOAT ,
in fev1_pro FLOAT ,
in frc_pre FLOAT ,
in frc_pre_pro FLOAT ,
in fvc FLOAT ,
in fvc_post FLOAT ,
in fvc_pre FLOAT ,
in fvc_pre_pro FLOAT ,
in fvc_pro FLOAT ,
in hco3 FLOAT ,
in height INTEGER ,
in hematocrit FLOAT ,
in kco_pro FLOAT ,
in mmrc INTEGER ,
in notes VARCHAR(255) ,
in paco2 FLOAT ,
in pao2 FLOAT ,
in pef_pre_pro FLOAT ,
in pH FLOAT ,
in pxy INTEGER ,
in rv FLOAT ,
in rv_pre FLOAT ,
in rv_pre_pro FLOAT ,
in rv_pro FLOAT ,
in rv_tlc FLOAT ,
in satO2_pro FLOAT ,
in smoker INTEGER ,
in tlc FLOAT ,
in tlc_pre FLOAT ,
in tlc_pre_pro FLOAT ,
in tlc_pro FLOAT ,
in weight INTEGER 
)
proc: BEGIN



	DECLARE tmp INTEGER;
	if getRole() = 'doctor' then
		SELECT patientId into tmp FROM patients WHERE patientId = patId and doctorId = substring_index(user(), '@', 1);
		IF tmp IS NULL then
			LEAVE proc;
		end if;
	end if;
	
	SET @stmt = "INSERT INTO readings (patientId, diagnoseDate, status,del_fef25_75_pro,del_fev1_post,del_fvc_pro,del_pef_pro,dlco_pro,fef25_75_pre_pro,fev1,fev1_fvc,fev1_fvc_pre,fev1_post,fev1_pre,fev1_pre_pro,fev1_pro,frc_pre,frc_pre_pro,fvc,fvc_post,fvc_pre,fvc_pre_pro,fvc_pro,hco3,height,hematocrit,kco_pro,mmrc,notes,paco2,pao2,pef_pre_pro,pH,pxy,rv,rv_pre,rv_pre_pro,rv_pro,rv_tlc,satO2_pro,smoker,tlc,tlc_pre,tlc_pre_pro,tlc_pro,weight) 
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
	set @patientId = patId;
	set @diagnoseDate = diagnoseDate;
	set @status = status;
set @q1 = del_fef25_75_pro ;
set @q2 = del_fev1_post ;
set @q3 = del_fvc_pro ;
set @q4 = del_pef_pro ;
set @q5 = dlco_pro ;
set @q6 = fef25_75_pre_pro ;
set @q7 = fev1 ;
set @q8 = fev1_fvc ;
set @q9 = fev1_fvc_pre ;
set @q10 = fev1_post ;
set @q11 = fev1_pre ;
set @q12 = fev1_pre_pro ;
set @q13 = fev1_pro ;
set @q14 = frc_pre ;
set @q15 = frc_pre_pro ;
set @q16 = fvc ;
set @q17 = fvc_post ;
set @q18 = fvc_pre ;
set @q19 = fvc_pre_pro ;
set @q20 = fvc_pro ;
set @q21 = hco3 ;
set @q22 = height ;
set @q23 = hematocrit ;
set @q24 = kco_pro ;
set @q25 = mmrc ;
set @q26 = notes ;
set @q27 = paco2 ;
set @q28 = pao2 ;
set @q29 = pef_pre_pro ;
set @q30 = pH ;
set @q31 = pxy ;
-- 32 was wrong - therefore 43 instead of 44
set @q33 = rv ;
set @q34 = rv_pre ;
set @q35 = rv_pre_pro ;
set @q36 = rv_pro ;
set @q37 = rv_tlc ;
set @q38 = satO2_pro ;
set @q39 = smoker ;
set @q40 = tlc ;
set @q41 = tlc_pre ;
set @q42 = tlc_pre_pro ;
set @q43 = tlc_pro ;
set @q44 = weight ;


	PREPARE s FROM @stmt;
	EXECUTE s using @patientId, @diagnoseDate, @status, @q1,@q2,@q3,@q4,@q5,@q6,@q7,@q8,@q9,@q10,@q11,@q12,@q13,@q14,@q15,@q16,@q17,@q18,@q19,@q20,@q21,@q22,@q23,@q24,@q25,@q26,@q27,@q28,@q29,@q30,@q31,@q33,@q34,@q35,@q36,@q37,@q38,@q39,@q40,@q41,@q42,@q43,@q44;
	SELECt last_insert_id() as insertId, now() as modified;
	DEALLOCATE PREPARE s;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- procedure readingsUpdate
-- -----------------------------------------------------

DELIMITER $$
USE `echo`$$
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `readingsUpdate`(
	in recordId integer,
in patId integer ,
in diagnoseDate DATE ,
in status VARCHAR(15) ,
in del_fef25_75_pro FLOAT ,
in del_fev1_post FLOAT ,
in del_fvc_pro FLOAT ,
in del_pef_pro FLOAT ,
in dlco_pro FLOAT ,
in fef25_75_pre_pro FLOAT ,
in fev1 FLOAT ,
in fev1_fvc FLOAT ,
in fev1_fvc_pre FLOAT ,
in fev1_post FLOAT ,
in fev1_pre FLOAT ,
in fev1_pre_pro FLOAT ,
in fev1_pro FLOAT ,
in frc_pre FLOAT ,
in frc_pre_pro FLOAT ,
in fvc FLOAT ,
in fvc_post FLOAT ,
in fvc_pre FLOAT ,
in fvc_pre_pro FLOAT ,
in fvc_pro FLOAT ,
in hco3 FLOAT ,
in height INTEGER ,
in hematocrit FLOAT ,
in kco_pro FLOAT ,
in mmrc INTEGER ,
in notes VARCHAR(255) ,
in paco2 FLOAT ,
in pao2 FLOAT ,
in pef_pre_pro FLOAT ,
in pH FLOAT ,
in pxy INTEGER ,
in rv FLOAT ,
in rv_pre FLOAT ,
in rv_pre_pro FLOAT ,
in rv_pro FLOAT ,
in rv_tlc FLOAT ,
in satO2_pro FLOAT ,
in smoker INTEGER ,
in tlc FLOAT ,
in tlc_pre FLOAT ,
in tlc_pre_pro FLOAT ,
in tlc_pro FLOAT ,
in weight INTEGER 
)
BEGIN

	
	SET @stmt = "UPDATE readings_view  SET diagnoseDate = ?, status =? , del_fef25_75_pro = ? ,del_fev1_post = ? ,del_fvc_pro = ? ,del_pef_pro = ? ,dlco_pro = ? ,fef25_75_pre_pro = ? ,fev1 = ? ,fev1_fvc = ? ,fev1_fvc_pre = ? ,fev1_post = ? ,fev1_pre = ? ,fev1_pre_pro = ? ,fev1_pro = ? ,frc_pre = ? ,frc_pre_pro = ? ,fvc = ? ,fvc_post = ? ,fvc_pre = ? ,fvc_pre_pro = ? ,fvc_pro = ? ,hco3 = ? ,height = ? ,hematocrit = ? ,kco_pro = ? ,mmrc = ? ,notes = ? ,paco2 = ? ,pao2 = ? ,pef_pre_pro = ? ,pH = ? ,pxy = ? ,rv = ? ,rv_pre = ? ,rv_pre_pro = ? ,rv_pro = ? ,rv_tlc = ? ,satO2_pro = ? ,smoker = ? ,tlc = ? ,tlc_pre = ? ,tlc_pre_pro = ? ,tlc_pro = ? ,weight = ?
 where  recordId =? and patientId = ?";
	set @recId = recordId;
	set @patientId = patId;
	set @diagnoseDate = diagnoseDate;
	set @status = status;
set @q1 = del_fef25_75_pro ;
set @q2 = del_fev1_post ;
set @q3 = del_fvc_pro ;
set @q4 = del_pef_pro ;
set @q5 = dlco_pro ;
set @q6 = fef25_75_pre_pro ;
set @q7 = fev1 ;
set @q8 = fev1_fvc ;
set @q9 = fev1_fvc_pre ;
set @q10 = fev1_post ;
set @q11 = fev1_pre ;
set @q12 = fev1_pre_pro ;
set @q13 = fev1_pro ;
set @q14 = frc_pre ;
set @q15 = frc_pre_pro ;
set @q16 = fvc ;
set @q17 = fvc_post ;
set @q18 = fvc_pre ;
set @q19 = fvc_pre_pro ;
set @q20 = fvc_pro ;
set @q21 = hco3 ;
set @q22 = height ;
set @q23 = hematocrit ;
set @q24 = kco_pro ;
set @q25 = mmrc ;
set @q26 = notes ;
set @q27 = paco2 ;
set @q28 = pao2 ;
set @q29 = pef_pre_pro ;
set @q30 = pH ;
set @q31 = pxy ;
-- q32 was wrong
set @q33 = rv ;
set @q34 = rv_pre ;
set @q35 = rv_pre_pro ;
set @q36 = rv_pro ;
set @q37 = rv_tlc ;
set @q38 = satO2_pro ;
set @q39 = smoker ;
set @q40 = tlc ;
set @q41 = tlc_pre ;
set @q42 = tlc_pre_pro ;
set @q43 = tlc_pro ;
set @q44 = weight ;


	PREPARE s FROM @stmt;
	EXECUTE s using @diagnoseDate, @status, @q1,@q2,@q3,@q4,@q5,@q6,@q7,@q8,@q9,@q10,@q11,@q12,@q13,@q14,@q15,@q16,@q17,@q18,@q19,@q20,
@q21,@q22,@q23,@q24,@q25,@q26,@q27,@q28,@q29,@q30,@q31,@q33,@q34,@q35,@q36,@q37,@q38,@q39,@q40,@q41,@q42,@q43,@q44,@recId, @patientId;
	SELECT ROW_COUNT() as affected_rows;
	DEALLOCATE PREPARE s;

END$$

DELIMITER ;

-- -----------------------------------------------------
-- View `echo`.`accounts_view`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `echo`.`accounts_view`;
USE `echo`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER VIEW `echo`.`accounts_view` AS 
select `echo`.`accounts`.`accountId` AS `accountId`,`echo`.`accounts`.`username` AS `username`,
`echo`.`accounts`.`password` AS `password`,`echo`.`accounts`.`role` AS `role`,`echo`.`accounts`.`email` AS `email`,
`echo`.`accounts`.`enabled` AS `enabled`,`echo`.`accounts`.`reminderTime` AS `reminderTime`,
`echo`.`accounts`.`notificationEnabled` AS `notificationEnabled`,`echo`.`accounts`.`notificationMode` AS `notificationMode`,
`echo`.`accounts`.`mobile` AS `mobile`, `echo`.`accounts`.`modified` AS `modified`  from `echo`.`accounts` where (case when (`getRole`() = 'admin') then (1 = 1)
else (`echo`.`accounts`.`accountId` = substring_index(user(),'@',1)) end);

-- -----------------------------------------------------
-- View `echo`.`patients_view`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `echo`.`patients_view`;
USE `echo`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER VIEW `echo`.`patients_view` AS 
select `echo`.`patients`.`patientId` AS `patientId`,`echo`.`patients`.`doctorId` AS `doctorId`,`echo`.`patients`.`firstName` AS `firstName`,
`echo`.`patients`.`lastName` AS `lastName`,`echo`.`patients`.`secondName` AS `secondName`,`echo`.`patients`.`socialId` AS `socialId`,
`echo`.`patients`.`sex` AS `sex`,`echo`.`patients`.`dateOfBirth` AS `dateOfBirth`,`echo`.`patients`.`firstDiagnoseDate` AS `firstDiagnoseDate`,
`echo`.`patients`.`fileId` AS `fileId`,`echo`.`patients`.`fullAddress` AS `fullAddress`,`echo`.`patients`.`landline` AS `landline`, `echo`.`accounts`.`enabled` AS `enabled`,
`echo`.`accounts`.`email` AS `email`,`echo`.`accounts`.`mobile` AS `mobile`, `echo`.`patients`.`modified` AS `modified`,
(SELECT `echo`.`severity`.`severity` as `severity` from `severity` where ((`severity`.`patientId` = `accounts`.`accountId`)) ORDER BY diagnoseDate desc LIMIT 1) AS currentSeverity
from
        (`patients`
        join `accounts` ON ((`patients`.`patientId` = `accounts`.`accountId`)))
    where
        (case
            when (getRole() = 'admin') then (1 = 1)
            else ((`patients`.`patientId` = `accounts`.`accountId`)
                and (`patients`.`doctorId` = substring_index(user(), '@', 1)))
        end);

-- -----------------------------------------------------
-- View `echo`.`cats_view`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `echo`.`cats_view`;
USE `echo`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER VIEW `echo`.`cats_view` AS select `echo`.`cats`.`recordId` AS `recordId`,`echo`.`cats`.`patientId` AS `patientId`,`echo`.`cats`.`diagnoseDate` AS `diagnoseDate`,`echo`.`cats`.`q1` AS `q1`,`echo`.`cats`.`q2` AS `q2`,`echo`.`cats`.`q3` AS `q3`,`echo`.`cats`.`q4` AS `q4`,`echo`.`cats`.`q5` AS `q5`,`echo`.`cats`.`q6` AS `q6`,`echo`.`cats`.`q7` AS `q7`,`echo`.`cats`.`q8` AS `q8`,`echo`.`cats`.`totalCatscale` AS `totalCatscale`,`echo`.`cats`.`status` AS `status`,`echo`.`cats`.`modified` AS `modified` from `echo`.`cats` where (case when (`getRole`() = 'admin') then (1 = 1) else `echo`.`cats`.`patientId` in (select `echo`.`patients`.`patientId` from `echo`.`patients` where (`echo`.`patients`.`doctorId` = substring_index(user(),'@',1))) end);

-- -----------------------------------------------------
-- View `echo`.`ccqs_view`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `echo`.`ccqs_view`;
USE `echo`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER VIEW `echo`.`ccqs_view` AS select `echo`.`ccqs`.`recordId` AS `recordId`,`echo`.`ccqs`.`patientId` AS `patientId`,`echo`.`ccqs`.`diagnoseDate` AS `diagnoseDate`,`echo`.`ccqs`.`q1` AS `q1`,`echo`.`ccqs`.`q2` AS `q2`,`echo`.`ccqs`.`q3` AS `q3`,`echo`.`ccqs`.`q4` AS `q4`,`echo`.`ccqs`.`q5` AS `q5`,`echo`.`ccqs`.`q6` AS `q6`,`echo`.`ccqs`.`q7` AS `q7`,`echo`.`ccqs`.`q8` AS `q8`,`echo`.`ccqs`.`q9` AS `q9`,`echo`.`ccqs`.`q10` AS `q10`,`echo`.`ccqs`.`totalCCQScore` AS `totalCCQScore`,`echo`.`ccqs`.`symptomScore` AS `symptomScore`,`echo`.`ccqs`.`mentalStateScore` AS `mentalStateScore`,`echo`.`ccqs`.`functionalStateScore` AS `functionalStateScore`,`echo`.`ccqs`.`status` AS `status`, `echo`.`ccqs`.`modified` AS `modified` from `echo`.`ccqs` where (case when (`getRole`() = 'admin') then (1 = 1) else `echo`.`ccqs`.`patientId` in (select `echo`.`patients`.`patientId` from `echo`.`patients` where (`echo`.`patients`.`doctorId` = substring_index(user(),'@',1))) end);

-- -----------------------------------------------------
-- View `echo`.`charlsons_view`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `echo`.`charlsons_view`;
USE `echo`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER VIEW `echo`.`charlsons_view` AS select `echo`.`charlsons`.`recordId` AS `recordId`,`echo`.`charlsons`.`patientId` AS `patientId`,`echo`.`charlsons`.`diagnoseDate` AS `diagnoseDate`,`echo`.`charlsons`.`myocardialInfarction` AS `myocardialInfarction`,`echo`.`charlsons`.`congestiveHeartFailure` AS `congestiveHeartFailure`,`echo`.`charlsons`.`peripheralVascularDisease` AS `peripheralVascularDisease`,`echo`.`charlsons`.`cerebrovascularDisease` AS `cerebrovascularDisease`,`echo`.`charlsons`.`dementia` AS `dementia`,`echo`.`charlsons`.`chronicPulmonaryDiasease` AS `chronicPulmonaryDiasease`,`echo`.`charlsons`.`connectiveTissueDisease` AS `connectiveTissueDisease`,`echo`.`charlsons`.`ulcerDisease` AS `ulcerDisease`,`echo`.`charlsons`.`liverDiseaseMild` AS `liverDiseaseMild`,`echo`.`charlsons`.`diabetes` AS `diabetes`,`echo`.`charlsons`.`hemiplegia` AS `hemiplegia`,`echo`.`charlsons`.`renalDiseaseModerateOrSevere` AS `renalDiseaseModerateOrSevere`,`echo`.`charlsons`.`diabetesWithEndOrganDamage` AS `diabetesWithEndOrganDamage`,`echo`.`charlsons`.`anyTumor` AS `anyTumor`,`echo`.`charlsons`.`leukemia` AS `leukemia`,`echo`.`charlsons`.`malignantLymphoma` AS `malignantLymphoma`,`echo`.`charlsons`.`liverDiseaseModerateOrSevere` AS `liverDiseaseModerateOrSevere`,`echo`.`charlsons`.`metastaticSolidMalignancy` AS `metastaticSolidMalignancy`,`echo`.`charlsons`.`aids` AS `aids`,`echo`.`charlsons`.`noConditionAvailable` AS `noConditionAvailable`,`echo`.`charlsons`.`totalCharlson` AS `totalCharlson` , `echo`.`charlsons`.`modified` AS `modified` from `echo`.`charlsons` where (case when (`getRole`() = 'admin') then (1 = 1) else `echo`.`charlsons`.`patientId` in (select `echo`.`patients`.`patientId` from `echo`.`patients` where (`echo`.`patients`.`doctorId` = substring_index(user(),'@',1))) end);

-- -----------------------------------------------------
-- View `echo`.severity_view`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `echo`.`severity_view`;
USE `echo`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER VIEW `echo`.`severity_view` AS select `echo`.`severity`.`recordId` AS `recordId`, `echo`.`severity`.`patientId` AS `patientId`, `echo`.`severity`.`severity` AS `severity`, `echo`.`severity`.`diagnoseDate` AS `diagnoseDate`, `echo`.`severity`.`comment` AS `comment`, `echo`.`severity`.`modified` AS `modified`  from `echo`.`severity` where (case when (`getRole`() = 'admin') then (1 = 1) else `echo`.`severity`.`patientId` in (select `echo`.`patients`.`patientId` from `echo`.`patients` where (`echo`.`patients`.`doctorId` = substring_index(user(),'@',1))) end);

-- -----------------------------------------------------
-- View `echo`.`treatments_view`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `echo`.`treatments_view`;
USE `echo`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER VIEW `echo`.`treatments_view` AS select `echo`.`treatments`.`patientId` AS `patientId`,`echo`.`treatments`.`diagnoseDate` AS `diagnoseDate`,`echo`.`treatments`.`status` AS `status`,`echo`.`treatments`.`shortActingB2` AS `shortActingB2`,`echo`.`treatments`.`longActingB2` AS `longActingB2`,`echo`.`treatments`.`ultraLongB2` AS `ultraLongB2`,`echo`.`treatments`.`steroidsInhaled` AS `steroidsInhaled`,`echo`.`treatments`.`steroidsOral` AS `steroidsOral`,`echo`.`treatments`.`sama` AS `sama`,`echo`.`treatments`.`lama` AS `lama`,`echo`.`treatments`.`pdef4Inhalator` AS `pdef4Inhalator`,`echo`.`treatments`.`theophyline` AS `theophyline`,`echo`.`treatments`.`mycolytocis` AS `mycolytocis`,`echo`.`treatments`.`antibiotics` AS `antibiotics`,`echo`.`treatments`.`antiflu` AS `antiflu`,`echo`.`treatments`.`antipneum` AS `antipneum`,`echo`.`treatments`.`ltot` AS `ltot`,`echo`.`treatments`.`ltotStartDate` AS `ltotStartDate`,`echo`.`treatments`.`ltotDevice` AS `ltotDevice`,`echo`.`treatments`.`niv` AS `niv`,`echo`.`treatments`.`ventilationStart` AS `ventilationStart`,`echo`.`treatments`.`ventilationDevice` AS `ventilationDevice`,`echo`.`treatments`.`recordId` AS `recordId`, `echo`.`treatments`.`other` AS `other`, `echo`.`treatments`.`modified` AS `modified` from `echo`.`treatments` where (case when (`getRole`() = 'admin') then (1 = 1) else `echo`.`treatments`.`patientId` in (select `echo`.`patients`.`patientId` from `echo`.`patients` where (`echo`.`patients`.`doctorId` = substring_index(user(),'@',1))) end);

-- -----------------------------------------------------
-- View `echo`.`readings_view`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `echo`.`readings_view`;
USE `echo`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER VIEW `echo`.`readings_view` AS select `echo`.`readings`.`patientId` AS `patientId`,`echo`.`readings`.`diagnoseDate` AS `diagnoseDate`,`echo`.`readings`.`weight` AS `weight`,`echo`.`readings`.`height` AS `height`,`echo`.`readings`.`pxy` AS `pxy`,`echo`.`readings`.`fev1` AS `fev1`,`echo`.`readings`.`fev1_pro` AS `fev1_pro`,`echo`.`readings`.`fvc` AS `fvc`,`echo`.`readings`.`fvc_pro` AS `fvc_pro`,`echo`.`readings`.`fev1_fvc` AS `fev1_fvc`,`echo`.`readings`.`rv` AS `rv`,`echo`.`readings`.`rv_pro` AS `rv_pro`,`echo`.`readings`.`tlc` AS `tlc`,`echo`.`readings`.`tlc_pro` AS `tlc_pro`,`echo`.`readings`.`rv_tlc` AS `rv_tlc`,`echo`.`readings`.`satO2_pro` AS `satO2_pro`,`echo`.`readings`.`dlco_pro` AS `dlco_pro`,`echo`.`readings`.`pao2` AS `pao2`,`echo`.`readings`.`paco2` AS `paco2`,`echo`.`readings`.`hco3` AS `hco3`,`echo`.`readings`.`pH` AS `pH`,`echo`.`readings`.`fvc_pre` AS `fvc_pre`,`echo`.`readings`.`fvc_pre_pro` AS `fvc_pre_pro`,`echo`.`readings`.`fev1_pre` AS `fev1_pre`,`echo`.`readings`.`fev1_pre_pro` AS `fev1_pre_pro`,`echo`.`readings`.`fev1_fvc_pre` AS `fev1_fvc_pre`,`echo`.`readings`.`fef25_75_pre_pro` AS `fef25_75_pre_pro`,`echo`.`readings`.`pef_pre_pro` AS `pef_pre_pro`,`echo`.`readings`.`tlc_pre` AS `tlc_pre`,`echo`.`readings`.`tlc_pre_pro` AS `tlc_pre_pro`,`echo`.`readings`.`frc_pre` AS `frc_pre`,`echo`.`readings`.`frc_pre_pro` AS `frc_pre_pro`,`echo`.`readings`.`rv_pre` AS `rv_pre`,`echo`.`readings`.`rv_pre_pro` AS `rv_pre_pro`,`echo`.`readings`.`kco_pro` AS `kco_pro`,`echo`.`readings`.`hematocrit` AS `hematocrit`,`echo`.`readings`.`status` AS `status`,`echo`.`readings`.`fvc_post` AS `fvc_post`,`echo`.`readings`.`del_fvc_pro` AS `del_fvc_pro`,`echo`.`readings`.`fev1_post` AS `fev1_post`,`echo`.`readings`.`del_fev1_post` AS `del_fev1_post`,`echo`.`readings`.`del_fef25_75_pro` AS `del_fef25_75_pro`,`echo`.`readings`.`del_pef_pro` AS `del_pef_pro`,`echo`.`readings`.`mmrc` AS `mmrc`,`echo`.`readings`.`smoker` AS `smoker`,`echo`.`readings`.`notes` AS `notes`,`echo`.`readings`.`recordId` AS `recordId`, `echo`.`readings`.`modified` AS `modified` from `echo`.`readings` where (case when (`getRole`() = 'admin') then (1 = 1) else `echo`.`readings`.`patientId` in (select `echo`.`patients`.`patientId` from `echo`.`patients` where (`echo`.`patients`.`doctorId` = substring_index(user(),'@',1))) end);

-- -----------------------------------------------------
-- View `echo`.`dailyReports_view`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `echo`.`dailyReports_view`;
USE `echo`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER VIEW `echo`.`dailyReports_view` AS select `echo`.`dailyReports`.`recordId` AS `recordId`,`echo`.`dailyReports`.`patientId` AS `patientId`,`echo`.`dailyReports`.`date` AS `date`,`echo`.`dailyReports`.`q1` AS `q1`,`echo`.`dailyReports`.`q2` AS `q2`,`echo`.`dailyReports`.`q3` AS `q3`,`echo`.`dailyReports`.`q4` AS `q4`,`echo`.`dailyReports`.`q5` AS `q5`,`echo`.`dailyReports`.`q1a` AS `q1a`,`echo`.`dailyReports`.`q1b` AS `q1b`,`echo`.`dailyReports`.`q1c` AS `q1c`,`echo`.`dailyReports`.`q3a` AS `q3a`,`echo`.`dailyReports`.`q3b` AS `q3b`,`echo`.`dailyReports`.`q3c` AS `q3c`,`echo`.`dailyReports`.`satO2` AS `satO2`,`echo`.`dailyReports`.`walkingDist` AS `walkingDist`,`echo`.`dailyReports`.`temperature` AS `temperature`,`echo`.`dailyReports`.`pefr` AS `pefr`,`echo`.`dailyReports`.`heartRate` AS `heartRate`,`echo`.`dailyReports`.`loc` AS `loc`,`echo`.`dailyReports`.`modified` AS `modified` from `echo`.`dailyReports` where (case when (`GETROLE`() = 'admin') then (1 = 1) when (`GETROLE`() = 'doctor') then `echo`.`dailyReports`.`patientId` in (select `echo`.`patients`.`patientId` from `echo`.`patients` where (`echo`.`patients`.`doctorId` = substring_index(user(),'@',1))) else (`echo`.`dailyReports`.`patientId` = substring_index(user(),'@',1)) end);

-- -----------------------------------------------------
-- View `echo`.`deaths_view`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `echo`.`deaths_view`;
USE `echo`;
CREATE  OR REPLACE ALGORITHM=UNDEFINED DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER VIEW `echo`.`deaths_view` AS select `echo`.`deaths`.`patientId` AS `patientId`,`echo`.`deaths`.`date` AS `date`,`echo`.`deaths`.`cardiovascular` AS `cardiovascular`,`echo`.`deaths`.`respiratory` AS `respiratory`,`echo`.`deaths`.`infectious_disease` AS `infectious_disease`,`echo`.`deaths`.`malignancy` AS `malignancy`,`echo`.`deaths`.`other` AS `other`,`echo`.`deaths`.`modified` AS `modified` from `echo`.`deaths` where (case when (`getRole`() = 'admin') then (1 = 1) else `echo`.`deaths`.`patientId` in (select `echo`.`patients`.`patientId` from `echo`.`patients` where (`echo`.`patients`.`doctorId` = substring_index(user(),'@',1))) end);

-- -----------------------------------------------------
-- View `echo`.`notifications_view`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `echo`.`notifications_view`;
USE `echo`;
CREATE 
     OR REPLACE ALGORITHM = UNDEFINED 
    DEFINER = `echo_db_usr`@`localhost` 
    SQL SECURITY DEFINER
VIEW `notifications_view` AS
    select 
        `n`.`date` AS `date`,
        `n`.`type` AS `type`,
		`n`.`subjectsAccount` AS `subjectsAccount`,
		`n`.`message` AS `message`,
        `n`.`modified` AS `modified`
    from
        (`notifications` `n`
        left join `patients` `p` ON ((`n`.`subjectsAccount` = `p`.`patientId`)))
    where
        (`n`.`accountId` = substring_index(user(), '@', 1));
USE `echo`;

DELIMITER $$
USE `echo`$$
CREATE TRIGGER `accounts_BUPD` BEFORE UPDATE ON `accounts` FOR EACH ROW
BEGIN
SET new.role = old.role;

END;$$

USE `echo`$$
CREATE TRIGGER `patients_BINS` BEFORE INSERT ON `patients` FOR EACH ROW
begin
declare doc_role varchar(10);
declare pat_role varchar(10);

SET doc_role = (SELECT role FROM accounts WHERE accountId = new.doctorId);
if (doc_role != 'doctor') then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Account selected as doctor, isnt a doctors account';
end if;

SET pat_role = (SELECT role FROM accounts WHERE accountId = new.patientId);
if (pat_role != 'patient') then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Account isnt a Patient';
end if;

end;$$

USE `echo`$$
CREATE TRIGGER `patients_BUPD` BEFORE UPDATE ON `patients` FOR EACH ROW
begin
declare doc_role varchar(10);
declare pat_role varchar(10);

SET doc_role = (SELECT role FROM accounts WHERE accountId = new.doctorId);
if (doc_role != 'doctor') then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Account selected as doctor, isnt a doctors account';
end if;

SET pat_role = (SELECT role FROM accounts WHERE accountId = new.patientId);
if (pat_role != 'patient') then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Account isnt a Patient';
end if;

end;$$

USE `echo`$$
CREATE TRIGGER `ccqs_BINS` BEFORE INSERT ON `ccqs` FOR EACH ROW
BEGIN
if (new.q1 < 0 OR new.q2 < 0 OR new.q3 < 0 OR new.q4 < 0 OR new.q5 < 0 OR new.q6 < 0 OR new.q7 < 0 OR new.q8 < 0 OR new.q9 < 0 OR new.q10 < 0) then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid answer. Answer values have to be in range [0; 6]';
end if;
if (new.q1 > 6 OR new.q2 > 6 OR new.q3 > 6 OR new.q4 > 6 OR new.q5 > 6 OR new.q6 > 6 OR new.q7 > 6 OR new.q8 > 6 OR new.q9 > 6 OR new.q10 > 6) then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid answer. Answer values have to be in range [0; 6]';
end if;

	if (new.diagnoseDate is null) then set new.diagnoseDate = CURDATE(); end if;
	set new.totalCCQScore = (new.q1 + new.q2 + new.q3 + new.q4 + new.q5 + new.q6 + new.q7 + new.q8 + new.q9 + new.q10)/10;
	set new.symptomScore = (new.q1 + new.q2 + new.q5 + new.q6)/4;
	set new.mentalStateScore = (new.q3 + new.q4 )/2;
	set new.functionalStateScore = (new.q7 + new.q8 + new.q9 + new.q10)/4;
end;$$

USE `echo`$$
CREATE TRIGGER `ccqs_BUPD` BEFORE UPDATE ON `ccqs` FOR EACH ROW
begin
if (new.q1 < 0 OR new.q2 < 0 OR new.q3 < 0 OR new.q4 < 0 OR new.q5 < 0 OR new.q6 < 0 OR new.q7 < 0 OR new.q8 < 0 OR new.q9 < 0 OR new.q10 < 0) then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid answer. Answer values have to be in range [0; 6]';
end if;
if (new.q1 > 6 OR new.q2 > 6 OR new.q3 > 6 OR new.q4 > 6 OR new.q5 > 6 OR new.q6 > 6 OR new.q7 > 6 OR new.q8 > 6 OR new.q9 > 6 OR new.q10 > 6) then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid answer. Answer values have to be in range [0; 6]';
end if;

if (new.diagnoseDate is null) then set new.diagnoseDate = CURDATE(); end if;

	set new.totalCCQScore = (new.q1 + new.q2 + new.q3 + new.q4 + new.q5 + new.q6 + new.q7 + new.q8 + new.q9 + new.q10)/10;
	set new.symptomScore = (new.q1 + new.q2 + new.q5 + new.q6)/4;
	set new.mentalStateScore = (new.q3 + new.q4 )/2;
	set new.functionalStateScore = (new.q7 + new.q8 + new.q9 + new.q10)/4;
end;$$

USE `echo`$$
CREATE TRIGGER `catscale_BINS` BEFORE INSERT ON `cats` FOR EACH ROW
begin
if (new.q1 < 0 OR new.q2 < 0 OR new.q3 < 0 OR new.q4 < 0 OR new.q5 < 0 OR new.q6 < 0 OR new.q7 < 0 OR new.q8 < 0) then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid answer. Answer values have to be in range [0; 5]';
end if;
if (new.q1 > 5 OR new.q2 > 5 OR new.q3 > 5 OR new.q4 > 5 OR new.q5 > 5 OR new.q6 > 5 OR new.q7 > 5 OR new.q8 > 5) then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid answer. Answer values have to be in range [0; 5]';
end if;
if (new.diagnoseDate is null) then set new.diagnoseDate = CURDATE(); end if;
set new.totalCatscale = (new.q1 + new.q2 + new.q3 + new.q4 + new.q5 + new.q6 + new.q7 + new.q8 );
end;$$

USE `echo`$$
CREATE TRIGGER `cats_BUPD` BEFORE UPDATE ON `cats` FOR EACH ROW
begin
if (new.q1 < 0 OR new.q2 < 0 OR new.q3 < 0 OR new.q4 < 0 OR new.q5 < 0 OR new.q6 < 0 OR new.q7 < 0 OR new.q8 < 0) then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid answer. Answer values have to be in range [0; 5]';
end if;
if (new.q1 > 5 OR new.q2 > 5 OR new.q3 > 5 OR new.q4 > 5 OR new.q5 > 5 OR new.q6 > 5 OR new.q7 > 5 OR new.q8 > 5) then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid answer. Answer values have to be in range [0; 5]';
end if;
if (new.diagnoseDate is null) then set new.diagnoseDate = CURDATE(); end if;
set new.totalCatscale = (new.q1 + new.q2 + new.q3 + new.q4 + new.q5 + new.q6 + new.q7 + new.q8 );
end;
$$

USE `echo`$$
CREATE TRIGGER `Charlson_BINS` BEFORE INSERT ON `charlsons` FOR EACH ROW
begin
	declare sum int;
if (new.diagnoseDate is null) then set new.diagnoseDate = CURDATE(); end if;

	set sum = 0;

		if (new.myocardialInfarction > 0) then
			set sum := sum + 1;
			set new.myocardialInfarction = 1;
		end if;
		if (new.congestiveHeartFailure > 0) then
			set sum := sum + 1;
			set new.congestiveHeartFailure = 1;
		end if;
		if (new.peripheralVascularDisease > 0) then
			set sum := sum + 1;
			set new.peripheralVascularDisease = 1;
		end if;
		if (new.cerebrovascularDisease > 0) then
			set sum := sum + 1;
			set new.cerebrovascularDisease = 1;
		end if;
		if (new.dementia > 0) then
			set new.dementia = 1;
			set sum := sum + 1;
		end if;
		if (new.chronicPulmonaryDiasease > 0) then
			set sum := sum + 1;
			set new.chronicPulmonaryDiasease = 1;
		end if;
		if (new.connectiveTissueDisease > 0) then
			set sum := sum + 1;
			set new.connectiveTissueDisease = 1;
		end if;
		if (new.ulcerDisease > 0) then
			set sum := sum + 1;
			set new.ulcerDisease = 1;
		end if;
		if (new.liverDiseaseMild > 0) then
			set sum := sum + 1;
			set new.liverDiseaseMild = 1;
		end if;
		if (new.diabetes > 0) then
			set sum := sum + 1;
			set new.diabetes = 1;
		end if;
		if (new.hemiplegia > 0) then
			set sum := sum + 2;
			set new.hemiplegia = 1;
		end if;
		if (new.renalDiseaseModerateOrSevere > 0) then
			set sum := sum + 2;
			set new.renalDiseaseModerateOrSevere = 1;
		end if;
		if (new.diabetesWithEndOrganDamage > 0) then
			set sum := sum + 2;
			set new.diabetesWithEndOrganDamage = 1;
		end if;
		if (new.anyTumor > 0) then
			set sum := sum + 2;
			set new.anyTumor = 1;
		end if;
		if (new.leukemia > 0) then
			set sum := sum + 2;
			set new.leukemia = 1;
		end if;
		if (new.malignantLymphoma > 0) then
			set sum := sum + 2;
			set new.malignantLymphoma = 1;
		end if;
		if (new.liverDiseaseModerateOrSevere > 0) then
			set sum := sum + 3;
			set new.liverDiseaseModerateOrSevere = 1;
		end if;
		if (new.metastaticSolidMalignancy > 0) then
			set sum := sum + 6;
			set new.metastaticSolidMalignancy = 1;
		end if;
		if (new.aids > 0) then
			set sum := sum + 6;
			set new.aids = 1;
		end if;
		set new.totalCharlson = sum;	
	if (new.noConditionAvailable = 1 && new.totalCharlson > 0) then
		signal sqlstate '22400' set message_text = 'Total Score is not 0, but No Condition has been selected';
	end if;
	
end;$$

USE `echo`$$
CREATE TRIGGER `charlsons_BUPD` BEFORE UPDATE ON `charlsons` FOR EACH ROW
begin
	declare sum int;

	if (new.diagnoseDate is null) then set new.diagnoseDate = CURDATE(); end if;

	set sum = 0;
		if (new.myocardialInfarction > 0) then
			set sum := sum + 1;
			set new.myocardialInfarction = 1;
		end if;
		if (new.congestiveHeartFailure > 0) then
			set sum := sum + 1;
			set new.congestiveHeartFailure = 1;
		end if;
		if (new.peripheralVascularDisease > 0) then
			set sum := sum + 1;
			set new.peripheralVascularDisease = 1;
		end if;
		if (new.cerebrovascularDisease > 0) then
			set sum := sum + 1;
			set new.cerebrovascularDisease = 1;
		end if;
		if (new.dementia > 0) then
			set new.dementia = 1;
			set sum := sum + 1;
		end if;
		if (new.chronicPulmonaryDiasease > 0) then
			set sum := sum + 1;
			set new.chronicPulmonaryDiasease = 1;
		end if;
		if (new.connectiveTissueDisease > 0) then
			set sum := sum + 1;
			set new.connectiveTissueDisease = 1;
		end if;
		if (new.ulcerDisease > 0) then
			set sum := sum + 1;
			set new.ulcerDisease = 1;
		end if;
		if (new.liverDiseaseMild > 0) then
			set sum := sum + 1;
			set new.liverDiseaseMild = 1;
		end if;
		if (new.diabetes > 0) then
			set sum := sum + 1;
			set new.diabetes = 1;
		end if;
		if (new.hemiplegia > 0) then
			set sum := sum + 2;
			set new.hemiplegia = 1;
		end if;
		if (new.renalDiseaseModerateOrSevere > 0) then
			set sum := sum + 2;
			set new.renalDiseaseModerateOrSevere = 1;
		end if;
		if (new.diabetesWithEndOrganDamage > 0) then
			set sum := sum + 2;
			set new.diabetesWithEndOrganDamage = 1;
		end if;
		if (new.anyTumor > 0) then
			set sum := sum + 2;
			set new.anyTumor = 1;
		end if;
		if (new.leukemia > 0) then
			set sum := sum + 2;
			set new.leukemia = 1;
		end if;
		if (new.malignantLymphoma > 0) then
			set sum := sum + 2;
			set new.malignantLymphoma = 1;
		end if;
		if (new.liverDiseaseModerateOrSevere > 0) then
			set sum := sum + 3;
			set new.liverDiseaseModerateOrSevere = 1;
		end if;
		if (new.metastaticSolidMalignancy > 0) then
			set sum := sum + 6;
			set new.metastaticSolidMalignancy = 1;
		end if;
		if (new.aids > 0) then
			set sum := sum + 6;
			set new.aids = 1;
		end if;
		set new.totalCharlson = sum;
	if (new.noConditionAvailable = 1 && new.totalCharlson > 0) then
		signal sqlstate '22400' set message_text = 'Total Score is not 0, but No Condition has been selected';
	end if;
end;$$

USE `echo`$$
CREATE TRIGGER `treatments_BINS` BEFORE INSERT ON `treatments` FOR EACH ROW
begin
if (new.diagnoseDate is null) then set new.diagnoseDate = CURDATE(); end if;
end;$$

USE `echo`$$
CREATE TRIGGER `treatments_BUPD` BEFORE UPDATE ON `treatments` FOR EACH ROW
begin
if (new.diagnoseDate is null) then set new.diagnoseDate = CURDATE(); end if;
end;
$$

USE `echo`$$
CREATE TRIGGER `readings_BINS` BEFORE INSERT ON `readings` FOR EACH ROW
begin
if (new.mmrc < 0 or new.mmrc > 4) then 
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid value for mmrc. Value has to be in [0:4]';
end if;
if (new.smoker < 0 or new.smoker > 2) then 
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid value for smoker. Use 0 for nonsmoker, 1 for smoker and 2 for ex-smoker.';
end if;
if (new.diagnoseDate is null) then set new.diagnoseDate = CURDATE(); end if;
end;$$

USE `echo`$$
CREATE TRIGGER `readings_BUPD` BEFORE UPDATE ON `readings` FOR EACH ROW
begin
if (new.mmrc < 0 or new.mmrc > 4) then 
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid value for mmrc. Value has to be in [0:4]';
end if;
if (new.smoker < 0 or new.smoker > 2) then 
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid value for smoker. Use 0 for nonsmoker, 1 for smoker and 2 for ex-smoker.';
end if;
if (new.diagnoseDate is null) then set new.diagnoseDate = CURDATE(); end if;
end;
$$

USE `echo`$$
CREATE TRIGGER `dailyReport_BINS` BEFORE INSERT ON `dailyReports` FOR EACH ROW
Begin

if (new.date is null) then set new.date = CURDATE(); end if;
end$$

USE `echo`$$
CREATE TRIGGER `dailyReports_BUPD` BEFORE UPDATE ON `dailyReports` FOR EACH ROW
begin
if (new.date is null) then set new.date = CURDATE(); end if;
end;$$

USE `echo`$$
CREATE TRIGGER `deaths_BINS` BEFORE INSERT ON `deaths` FOR EACH ROW
begin
if (new.date is null) then set new.date = CURDATE(); end if;
end$$

USE `echo`$$
CREATE TRIGGER `notifications_BINS` BEFORE INSERT ON `notifications` FOR EACH ROW
begin
if (new.date is null) then set new.date = CURDATE(); end if;
end;$$

USE `echo`$$
CREATE TRIGGER `accounts_BEFORE_DELETE` BEFORE DELETE ON `accounts` FOR EACH ROW
begin

if old.role = 'admin' then
	SELECT count(*) into @count from accounts where role = 'admin';
    if (@count = 1) then
		signal sqlstate '22400' set message_text = 'You are not allowed to delete the last remaining admin account!';
	end if;
end if;

end;$$

DELIMITER ;


GRANT EXECUTE ON procedure `echo`.`accountsCreate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`severityCreate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`charlsonUpdate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`createDbUser` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`accountsDelete` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`deleteExamRecord` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`accountsList` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`accountsListOne` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`grantRolePermissions` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`patientsCreate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`patientsRessourceUpdate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`patientsDelete` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`accountsUpdate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`catCreate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`readingsCreate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`catUpdate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`readingsUpdate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`ccqCreate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`treatmentCreate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`ccqUpdate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`treatmentUpdate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`charlsonCreate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`listExams` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`listSingleExam` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`reportList` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`reportListOne` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`reportCreate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`reportUpdate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`reportDelete` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`deathGet` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`deathCreate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`deathUpdate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`deathDelete` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`login` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`loginRefresh` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`deviceAdd` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`deviceRemove` TO 'echo_db_usr'@'localhost';
GRANT DELETE, INSERT, SELECT, UPDATE, TRIGGER, CREATE, GRANT OPTION ON TABLE echo.* TO 'echo_db_usr'@'localhost';


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
