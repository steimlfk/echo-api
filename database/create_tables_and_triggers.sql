SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema echo
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `echo` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ;
USE `echo` ;

-- -----------------------------------------------------
-- Table `echo`.`accounts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`accounts` (
  `accountId` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `reminderTime` TIME NOT NULL,
  `notificationEnabled` TINYINT(1) NOT NULL DEFAULT 1,
  `notificationMode` VARCHAR(10) NOT NULL DEFAULT 'email',
  `mobile` VARCHAR(45) NULL,
  PRIMARY KEY (`accountId`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC))
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
  PRIMARY KEY (`patientId`),
  UNIQUE INDEX `socialId_UNIQUE` (`socialId` ASC),
  UNIQUE INDEX `fileId_UNIQUE` (`fileId` ASC),
  INDEX `fkDoctor_idx` (`doctorId` ASC),
  CONSTRAINT `fkPatient`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`accounts` (`accountId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fkDoctor`
    FOREIGN KEY (`doctorId`)
    REFERENCES `echo`.`accounts` (`accountId`)
    ON DELETE NO ACTION
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
  `status` VARCHAR(15) NOT NULL,
  PRIMARY KEY (`recordId`),
  INDEX `ccqFKpat_idx` (`patientId` ASC),
  CONSTRAINT `ccqFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE NO ACTION
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
  `status` VARCHAR(15) NOT NULL,
  PRIMARY KEY (`recordId`),
  INDEX `catsFKpat_idx` (`patientId` ASC),
  CONSTRAINT `catsFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE NO ACTION
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
  PRIMARY KEY (`recordId`),
  INDEX `charFKpat_idx` (`patientId` ASC),
  CONSTRAINT `charFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE NO ACTION
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
  `status` VARCHAR(15) NOT NULL,
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
  `ltotDevice` VARCHAR(50) NULL,
  `niv` TINYINT(1) NULL,
  `ventilationStart` DATE NULL,
  `ventilationDevice` VARCHAR(50) NULL,
  PRIMARY KEY (`recordId`),
  INDEX `treatFKpat_idx` (`patientId` ASC),
  CONSTRAINT `treatFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE NO ACTION
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
  `status` VARCHAR(15) NOT NULL,
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
  PRIMARY KEY (`recordId`),
  INDEX `readFKpat_idx` (`patientId` ASC),
  CONSTRAINT `readFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE NO ACTION
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
    ON DELETE NO ACTION
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
  PRIMARY KEY (`recordId`),
  INDEX `repFKpat_idx` (`patientId` ASC),
  CONSTRAINT `repFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `echo`.`dailyreports`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`dailyreports` (
  `recordId` INT(11) NOT NULL AUTO_INCREMENT,
  `patientId` INT(11) NOT NULL,
  `date` DATE NULL DEFAULT NULL,
  `q1` TINYINT(1) NOT NULL,
  `q2` TINYINT(1) NOT NULL,
  `q3` TINYINT(1) NOT NULL,
  `q4` TINYINT(1) NOT NULL,
  `q5` TINYINT(1) NOT NULL,
  `q1a` TINYINT(1) NULL DEFAULT '0',
  `q1b` TINYINT(1) NULL DEFAULT '0',
  `q1c` TINYINT(1) NULL DEFAULT '0',
  `q3a` TINYINT(1) NULL DEFAULT '0',
  `q3b` TINYINT(1) NULL DEFAULT '0',
  `q3c` TINYINT(1) NULL DEFAULT '0',
  `satO2` FLOAT(11) NULL DEFAULT '0',
  `walkingDist` FLOAT(11) NULL DEFAULT '0',
  `temperature` FLOAT(11) NULL DEFAULT '0',
  `pefr` FLOAT(11) NULL DEFAULT '0',
  `heartRate` FLOAT(11) NULL DEFAULT '0',
  PRIMARY KEY (`recordId`),
  INDEX `repFKpat_idx` (`patientId` ASC),
  CONSTRAINT `repFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8
COLLATE = utf8_general_ci;


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
  PRIMARY KEY (`patientId`),
  CONSTRAINT `deathFKpat`
    FOREIGN KEY (`patientId`)
    REFERENCES `echo`.`patients` (`patientId`)
    ON DELETE NO ACTION
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
  PRIMARY KEY (`notificationId`),
  INDEX `notFKpatient_idx` (`accountId` ASC),
  INDEX `notFKsubject_idx` (`subjectsAccount` ASC),
  CONSTRAINT `notFKpatient`
    FOREIGN KEY (`accountId`)
    REFERENCES `echo`.`accounts` (`accountId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `notFKsubject`
    FOREIGN KEY (`subjectsAccount`)
    REFERENCES `echo`.`accounts` (`accountId`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `echo`.`devices`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `echo`.`devices` (
  `accountId` int(11) NOT NULL,
  `deviceId` varchar(255) NOT NULL,
  PRIMARY KEY (`accountId`,`deviceId`),
  UNIQUE KEY `deviceId_UNIQUE` (`deviceId`),
  CONSTRAINT `devicesFKacc` FOREIGN KEY (`accountId`)
  REFERENCES `accounts` (`accountId`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION
)
ENGINE=InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
USE `echo`;

DELIMITER $$
USE `echo`$$
CREATE TRIGGER `Accounts_BINS` BEFORE INSERT ON `accounts` FOR EACH ROW
BEGIN
	if (new.Role != 'patient') then
		if (new.Role != 'doctor') then
			if (new.Role != 'admin') then
				signal sqlstate '22400' set message_text = 'Invalid Role. Valid Values are: patient, doctor or admin';
			end if;
		end if;
	end if;
	if (new.notificationMode != 'email') then
		if (new.notificationMode != 'sms') then
			if (new.notificationMode != 'push') then
				signal sqlstate '22400' set message_text = 'Invalid Notification Mode. Valid Values are: email, sms or push';
			end if;
		end if;
	end if;
END;$$

USE `echo`$$
CREATE TRIGGER `accounts_BUPD` BEFORE UPDATE ON `accounts` FOR EACH ROW
BEGIN
SET new.role = old.role;
	if (new.notificationMode != 'email') then
		if (new.notificationMode != 'sms') then
			if (new.notificationMode != 'push') then
				signal sqlstate '22400' set message_text = 'Invalid Notification Mode. Valid Values are: email, sms or push';
			end if;
		end if;
	end if;
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
CREATE TRIGGER `ccqs_BUPD` BEFORE UPDATE ON `ccqs` FOR EACH ROW
begin
if (new.status != 'exacerbation') then
if (new.status != 'baseline') then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid Status (MUST be Baseline or Exacerbation)';
end if;
end if;

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
CREATE TRIGGER `ccqs_BINS` BEFORE INSERT ON `ccqs` FOR EACH ROW
BEGIN
if (new.status != 'exacerbation') then
if (new.status != 'baseline') then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid Status (MUST be Baseline or Exacerbation)';
end if;
end if;
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
if (new.status != 'exacerbation') then
if (new.status != 'baseline') then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid Status (MUST be baseline or exacerbation)';
end if;
end if;
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
if (new.status != 'exacerbation') then
if (new.status != 'baseline') then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid Status (MUST be baseline or exacerbation)';
end if;
end if;
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
if (new.status != 'exacerbation') then
if (new.status != 'baseline') then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid Status (MUST be Baseline or Exacerbation)';
end if;
end if;

	if (new.ltotDevice != 'cpap') then
		if (new.ltotDevice != 'bipap') then
				signal sqlstate '22400' set message_text = 'Invalid LTOT Device. Valid Values are: cpap or bipap';
			end if;
	end if;

	if (new.ventilationDevice != 'concetrator') then
		if (new.ventilationDevice != 'cylinder') then
			if (new.ventilationDevice != 'liquid') then
				signal sqlstate '22400' set message_text = 'Invalid Ventilation Device. Valid Values are: concetrator or cylinder or liquid ';
			end if;
		end if;
	end if;

if (new.diagnoseDate is null) then set new.diagnoseDate = CURDATE(); end if;
end;$$

USE `echo`$$
CREATE TRIGGER `treatments_BUPD` BEFORE UPDATE ON `treatments` FOR EACH ROW
begin
if (new.status != 'exacerbation') then
if (new.status != 'baseline') then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid Status (MUST be Baseline or Exacerbation)';
end if;
end if;

	if (new.ltotDevice != 'cpap') then
		if (new.ltotDevice != 'bipap') then
				signal sqlstate '22400' set message_text = 'Invalid LTOT Device. Valid Values are: cpap or bipap';
			end if;
	end if;

	if (new.ventilationDevice != 'concetrator') then
		if (new.ventilationDevice != 'cylinder') then
			if (new.ventilationDevice != 'liquid') then
				signal sqlstate '22400' set message_text = 'Invalid Ventilation Device. Valid Values are: concetrator or cylinder or liquid ';
			end if;
		end if;
	end if;

if (new.diagnoseDate is null) then set new.diagnoseDate = CURDATE(); end if;
end;
$$

USE `echo`$$
CREATE TRIGGER `readings_BINS` BEFORE INSERT ON `readings` FOR EACH ROW
begin
if (new.status != 'exacerbation') then
if (new.status != 'baseline') then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid Status (MUST be Baseline or Exacerbation)';
end if;
end if;
if (new.mmrc < 0 or new.mmrc > 4) then 
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid value for mmrc. Value has to be in [0:4]';
end if;
if (new.smoker < 0 or new.mmrc > 2) then 
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid value for smoker. Use 0 for nonsmoker, 1 for smoker and 2 for ex-smoker.';
end if;
if (new.diagnoseDate is null) then set new.diagnoseDate = CURDATE(); end if;
end;$$

USE `echo`$$
CREATE TRIGGER `readings_BUPD` BEFORE UPDATE ON `readings` FOR EACH ROW
begin
if (new.status != 'exacerbation') then
if (new.status != 'baseline') then
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid Status (MUST be Baseline or Exacerbation)';
end if;
end if;
if (new.mmrc < 0 or new.mmrc > 4) then 
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid value for mmrc. Value has to be in [0:4]';
end if;
if (new.smoker < 0 or new.mmrc > 2) then 
SIGNAL SQLSTATE '22400' SET MESSAGE_TEXT = 'Invalid value for smoker. Use 0 for nonsmoker, 1 for smoker and 2 for ex-smoker.';
end if;
if (new.diagnoseDate is null) then set new.diagnoseDate = CURDATE(); end if;
end;
$$

USE `echo`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `echo`.`dailyReport_BINS`
BEFORE INSERT ON `echo`.`dailyreports`
FOR EACH ROW
Begin

if (new.date is null) then set new.date = CURDATE(); end if;
end$$

USE `echo`$$
CREATE TRIGGER `dailyReports_BUPD` BEFORE UPDATE ON `dailyReports` FOR EACH ROW
begin
if (new.date is null) then set new.date = CURDATE(); end if;
end;$$

USE `echo`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `echo`.`dailyReport_BINS`
BEFORE INSERT ON `echo`.`dailyreports`
FOR EACH ROW
Begin

if (new.date is null) then set new.date = CURDATE(); end if;
end$$

USE `echo`$$
CREATE
DEFINER=`root`@`localhost`
TRIGGER `echo`.`dailyreports_BUPD`
BEFORE UPDATE ON `echo`.`dailyreports`
FOR EACH ROW
begin
if (new.date is null) then set new.date = CURDATE(); end if;
end$$

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


DELIMITER ;
