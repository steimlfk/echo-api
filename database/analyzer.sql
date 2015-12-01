-- MySQL dump 10.13  Distrib 5.6.24, for osx10.8 (x86_64)
--
-- Host: localhost    Database: echo
-- ------------------------------------------------------
-- Server version	5.6.25-0ubuntu0.15.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `analyser`
--

DROP TABLE IF EXISTS `analyser`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `analyser` (
  `analyserId` int(11) NOT NULL AUTO_INCREMENT,
  `accountId` int(11) NOT NULL,
  `eventId` int(11) NOT NULL,
  `notifyId` int(11) NOT NULL,
  `flowId` varchar(20) NOT NULL,
  `flowUrl` varchar(255) NOT NULL,
  `hostId` int(11) NOT NULL,
  `message` varchar(45) NOT NULL,
  `date` date DEFAULT NULL,
  `modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`analyserId`),
  UNIQUE KEY `flowId_UNIQUE` (`flowId`),
  UNIQUE KEY `flowUrl_UNIQUE` (`flowUrl`),
  KEY `eventId_idx` (`eventId`),
  KEY `notifyId_idx` (`notifyId`),
  KEY `accountId_idx` (`accountId`),
  KEY `hostId_idx` (`hostId`),
  CONSTRAINT `accountId` FOREIGN KEY (`accountId`) REFERENCES `accounts` (`accountId`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `eventId` FOREIGN KEY (`eventId`) REFERENCES `analyserEvents` (`eventId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `hostId` FOREIGN KEY (`hostId`) REFERENCES `analyserHost` (`hostId`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `notifyId` FOREIGN KEY (`notifyId`) REFERENCES `analyserNotification` (`notifyId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=223 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analyser`
--

LOCK TABLES `analyser` WRITE;
/*!40000 ALTER TABLE `analyser` DISABLE KEYS */;
INSERT  IGNORE INTO `analyser` (`analyserId`, `accountId`, `eventId`, `notifyId`, `flowId`, `flowUrl`, `hostId`, `message`, `date`, `modified`) VALUES (186,2,1,1,'46ea981a.b91568','/analyzer/46ea981a.b91568',1,'Test {missingReports} test test test..','2015-10-08','2015-10-08 19:04:12'),(187,2,2,1,'a487900b.5b787','/analyzer/a487900b.5b787',1,'Arzt anrufen!','2015-10-08','2015-10-08 19:05:33'),(198,2,11,1,'a41b0058.5be5','/analyzer/a41b0058.5be5',1,'Test {id} {threshold} test test test..','2015-10-08','2015-10-08 19:48:56'),(199,2,11,1,'43cd6656.bc3298','/analyzer/43cd6656.bc3298',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 15:53:21'),(200,2,11,1,'29d4b28e.d62b4e','/analyzer/29d4b28e.d62b4e',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 15:55:27'),(201,2,11,1,'2a5ff657.d5a00a','/analyzer/2a5ff657.d5a00a',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 15:56:43'),(202,2,11,1,'12bebf8.fed414','/analyzer/12bebf8.fed414',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 15:57:59'),(203,2,11,1,'f360b6ce.0c9f48','/analyzer/f360b6ce.0c9f48',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 15:59:03'),(204,2,11,1,'2d232718.d2dcd8','/analyzer/2d232718.d2dcd8',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 16:01:00'),(205,2,11,1,'69e4f3ed.961b0c','/analyzer/69e4f3ed.961b0c',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 16:07:07'),(206,2,11,1,'580238ba.a7fdc8','/analyzer/580238ba.a7fdc8',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 16:08:28'),(207,2,11,1,'984639d4.67b9c8','/analyzer/984639d4.67b9c8',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 16:14:53'),(208,2,11,1,'dcaa7ace.235588','/analyzer/dcaa7ace.235588',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 16:15:45'),(209,2,11,1,'86fe66dd.790198','/analyzer/86fe66dd.790198',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 16:30:03'),(210,2,11,1,'1c420302.e3bdfd','/analyzer/1c420302.e3bdfd',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 16:31:48'),(211,2,11,1,'8b440dbd.74bbf','/analyzer/8b440dbd.74bbf',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 16:35:14'),(212,2,11,1,'f9c80edc.0637f','/analyzer/f9c80edc.0637f',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 16:36:17'),(213,2,11,1,'9a98987a.656768','/analyzer/9a98987a.656768',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 16:38:34'),(214,2,11,1,'ce0a0bbf.31f5f8','/analyzer/ce0a0bbf.31f5f8',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 18:30:26'),(215,2,11,1,'485de1c3.b7a22','/analyzer/485de1c3.b7a22',1,'Test {id} {threshold} test test test..','2015-10-09','2015-10-09 18:33:38'),(222,2,2,1,'1b8f21ee.e470de','1b8f21ee.e470de',1,'Test {id} test test test..','2015-10-12','2015-10-12 12:44:12');
/*!40000 ALTER TABLE `analyser` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `analyserEvents`
--

DROP TABLE IF EXISTS `analyserEvents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `analyserEvents` (
  `eventId` int(11) NOT NULL AUTO_INCREMENT,
  `eventName` varchar(255) NOT NULL,
  `eventFunction` varchar(255) NOT NULL,
  PRIMARY KEY (`eventId`),
  UNIQUE KEY `eventFunction_UNIQUE` (`eventFunction`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analyserEvents`
--

LOCK TABLES `analyserEvents` WRITE;
/*!40000 ALTER TABLE `analyserEvents` DISABLE KEYS */;
INSERT  IGNORE INTO `analyserEvents` (`eventId`, `eventName`, `eventFunction`) VALUES (1,'Time based','timeBased'),(2,'New Daily Report','newDailyReport'),(3,'New Treatment','newTreatments'),(4,'New Severity','newSeverity'),(5,'New Death','newDeath'),(6,'New Charlson','newCharlsons'),(7,'New Cat','newCats'),(8,'New Reading','newReadings'),(9,'New CCQ','newCcqs'),(10,'Data Mining','dataMining'),(11,'Data Mining with dayExacerbation','dataMining.newDailyReport');
/*!40000 ALTER TABLE `analyserEvents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `analyserEvents_view`
--

DROP TABLE IF EXISTS `analyserEvents_view`;
/*!50001 DROP VIEW IF EXISTS `analyserEvents_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `analyserEvents_view` AS SELECT
 1 AS `eventId`,
 1 AS `eventName`,
 1 AS `eventFunction`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `analyserExpression`
--

DROP TABLE IF EXISTS `analyserExpression`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `analyserExpression` (
  `expressionId` int(11) NOT NULL AUTO_INCREMENT,
  `expression` varchar(45) NOT NULL,
  PRIMARY KEY (`expressionId`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analyserExpression`
--

LOCK TABLES `analyserExpression` WRITE;
/*!40000 ALTER TABLE `analyserExpression` DISABLE KEYS */;
INSERT  IGNORE INTO `analyserExpression` (`expressionId`, `expression`) VALUES (1,'=='),(2,'==='),(3,'='),(4,'!='),(5,'!=='),(6,'>'),(7,'<'),(8,'>='),(9,'<='),(10,'countReportsPerDate'),(11,'between');
/*!40000 ALTER TABLE `analyserExpression` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `analyserExpression_view`
--

DROP TABLE IF EXISTS `analyserExpression_view`;
/*!50001 DROP VIEW IF EXISTS `analyserExpression_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `analyserExpression_view` AS SELECT
 1 AS `expressionId`,
 1 AS `expression`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `analyserField`
--

DROP TABLE IF EXISTS `analyserField`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `analyserField` (
  `dataId` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `table` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`dataId`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analyserField`
--

LOCK TABLES `analyserField` WRITE;
/*!40000 ALTER TABLE `analyserField` DISABLE KEYS */;
INSERT  IGNORE INTO `analyserField` (`dataId`, `name`, `table`, `description`) VALUES (1,'q1','daily_reports','Question 1'),(2,'q2','daily_reports','Question 2'),(3,'q3','daily_reports','Question 3'),(4,'COMPLETE_TABLE','daily_reports','Complete data set of daily_reports'),(5,'patientId','daily_reports','Patient ID of daily report'),(6,'daysExacerbation','classification','Data Mining: Days to excerbation'),(7,'q3a','daily_reports','Question 3a'),(8,'q3b','daily_reports','Question 3b'),(9,'q3c','daily_reports','Question 3c'),(10,'q4','daily_reports','Question 4'),(11,'q5','daily_reports','Question 5'),(13,'q1b','daily_reports','Question 1b'),(14,'q1c','daily_reports','Question 1c'),(15,'satO2','daily_reports','Sat O2'),(16,'walkingDist','daily_reports','walkingDist'),(17,'temperature','daily_reports','temperature'),(18,'pefr','daily_reports','pefr'),(19,'heartRate','daily_reports','heartRate'),(20,'x','daily_reports','x'),(21,'y','daily_reports','y');
/*!40000 ALTER TABLE `analyserField` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `analyserField_view`
--

DROP TABLE IF EXISTS `analyserField_view`;
/*!50001 DROP VIEW IF EXISTS `analyserField_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `analyserField_view` AS SELECT
 1 AS `dataId`,
 1 AS `table`,
 1 AS `name`,
 1 AS `description`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `analyserFilter`
--

DROP TABLE IF EXISTS `analyserFilter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `analyserFilter` (
  `filterId` int(11) NOT NULL AUTO_INCREMENT,
  `analyserId` int(11) NOT NULL,
  `dataId` int(11) NOT NULL,
  `value` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`filterId`),
  KEY `aaId` (`analyserId`),
  KEY `ddId` (`dataId`),
  CONSTRAINT `aaId` FOREIGN KEY (`analyserId`) REFERENCES `analyser` (`analyserId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ddId` FOREIGN KEY (`dataId`) REFERENCES `analyserField` (`dataId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analyserFilter`
--

LOCK TABLES `analyserFilter` WRITE;
/*!40000 ALTER TABLE `analyserFilter` DISABLE KEYS */;
INSERT  IGNORE INTO `analyserFilter` (`filterId`, `analyserId`, `dataId`, `value`) VALUES (10,186,5,'4'),(17,222,5,'4');
/*!40000 ALTER TABLE `analyserFilter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `analyserFilter_view`
--

DROP TABLE IF EXISTS `analyserFilter_view`;
/*!50001 DROP VIEW IF EXISTS `analyserFilter_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `analyserFilter_view` AS SELECT
 1 AS `filterId`,
 1 AS `analyserId`,
 1 AS `dataId`,
 1 AS `value`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `analyserHost`
--

DROP TABLE IF EXISTS `analyserHost`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `analyserHost` (
  `hostId` int(11) NOT NULL AUTO_INCREMENT,
  `hostname` varchar(255) NOT NULL,
  `hostport` smallint(2) NOT NULL DEFAULT '0',
  `hostpath` varchar(255) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `primary` tinyint(1) NOT NULL DEFAULT '0',
  `messageHost` varchar(255) NOT NULL,
  `messagePort` int(11) NOT NULL,
  PRIMARY KEY (`hostId`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analyserHost`
--

LOCK TABLES `analyserHost` WRITE;
/*!40000 ALTER TABLE `analyserHost` DISABLE KEYS */;
INSERT  IGNORE INTO `analyserHost` (`hostId`, `hostname`, `hostport`, `hostpath`, `enabled`, `primary`, `messageHost`, `messagePort`) VALUES (1,'localhost',1880,'/analyzer',1,1,'localhost',1883),(2,'test.de',1880,'/analyzer',0,0,'localhost',1883);
/*!40000 ALTER TABLE `analyserHost` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `analyserHost_view`
--

DROP TABLE IF EXISTS `analyserHost_view`;
/*!50001 DROP VIEW IF EXISTS `analyserHost_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `analyserHost_view` AS SELECT
 1 AS `hostId`,
 1 AS `hostname`,
 1 AS `hostport`,
 1 AS `hostpath`,
 1 AS `primary`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `analyserNotification`
--

DROP TABLE IF EXISTS `analyserNotification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `analyserNotification` (
  `notifyId` int(11) NOT NULL AUTO_INCREMENT,
  `actionName` varchar(255) NOT NULL,
  `actionFunction` varchar(255) NOT NULL,
  PRIMARY KEY (`notifyId`),
  UNIQUE KEY `actionFunction_UNIQUE` (`actionFunction`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analyserNotification`
--

LOCK TABLES `analyserNotification` WRITE;
/*!40000 ALTER TABLE `analyserNotification` DISABLE KEYS */;
INSERT  IGNORE INTO `analyserNotification` (`notifyId`, `actionName`, `actionFunction`) VALUES (1,'Message','sendMessage'),(2,'Log to DB','store');
/*!40000 ALTER TABLE `analyserNotification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `analyserNotification_view`
--

DROP TABLE IF EXISTS `analyserNotification_view`;
/*!50001 DROP VIEW IF EXISTS `analyserNotification_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `analyserNotification_view` AS SELECT
 1 AS `notifyId`,
 1 AS `actionName`,
 1 AS `actionFunction`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `analyserOperator`
--

DROP TABLE IF EXISTS `analyserOperator`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `analyserOperator` (
  `operatorId` int(11) NOT NULL AUTO_INCREMENT,
  `operator` varchar(255) NOT NULL,
  PRIMARY KEY (`operatorId`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analyserOperator`
--

LOCK TABLES `analyserOperator` WRITE;
/*!40000 ALTER TABLE `analyserOperator` DISABLE KEYS */;
INSERT  IGNORE INTO `analyserOperator` (`operatorId`, `operator`) VALUES (8,'AND'),(9,'&&'),(10,'OR'),(11,'||'),(12,'null'),(13,'NULL'),(14,'between'),(15,'BETWEEN');
/*!40000 ALTER TABLE `analyserOperator` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `analyserOperator_view`
--

DROP TABLE IF EXISTS `analyserOperator_view`;
/*!50001 DROP VIEW IF EXISTS `analyserOperator_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `analyserOperator_view` AS SELECT
 1 AS `operatorId`,
 1 AS `operator`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `analyserRules`
--

DROP TABLE IF EXISTS `analyserRules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `analyserRules` (
  `ruleId` int(11) NOT NULL AUTO_INCREMENT,
  `analyserId` int(11) NOT NULL,
  `operatorId` int(11) NOT NULL,
  `expressionId` int(11) NOT NULL,
  `dataId` int(11) NOT NULL,
  `searchValue` varchar(45) NOT NULL,
  `rangeValue` varchar(255) NOT NULL,
  PRIMARY KEY (`ruleId`),
  KEY `analyserId_idx` (`analyserId`),
  KEY `operatorId_idx` (`operatorId`),
  KEY `expressionId_idx` (`expressionId`),
  KEY `dataId_idx` (`dataId`),
  CONSTRAINT `analyserId` FOREIGN KEY (`analyserId`) REFERENCES `analyser` (`analyserId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `dataId` FOREIGN KEY (`dataId`) REFERENCES `analyserField` (`dataId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `expressionId` FOREIGN KEY (`expressionId`) REFERENCES `analyserExpression` (`expressionId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `operatorId` FOREIGN KEY (`operatorId`) REFERENCES `analyserOperator` (`operatorId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=347 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analyserRules`
--

LOCK TABLES `analyserRules` WRITE;
/*!40000 ALTER TABLE `analyserRules` DISABLE KEYS */;
INSERT  IGNORE INTO `analyserRules` (`ruleId`, `analyserId`, `operatorId`, `expressionId`, `dataId`, `searchValue`, `rangeValue`) VALUES (239,186,8,10,4,'true','patient'),(240,186,12,10,4,'3','doctor'),(241,187,12,3,1,'true','2'),(272,198,8,11,6,'LOW','50 to 100'),(273,198,10,11,6,'MIDDLE','10 to 49'),(274,198,12,11,6,'HIGH','0 to 9'),(275,199,8,11,6,'LOW','50 to 100'),(276,199,10,11,6,'MIDDLE','10 to 49'),(277,199,12,11,6,'HIGH','0 to 9'),(278,200,8,11,6,'LOW','50 to 100'),(279,200,10,11,6,'MIDDLE','10 to 49'),(280,200,12,11,6,'HIGH','0 to 9'),(281,201,8,11,6,'LOW','50 to 100'),(282,201,10,11,6,'MIDDLE','10 to 49'),(283,201,12,11,6,'HIGH','0 to 9'),(284,202,8,11,6,'LOW','50 to 100'),(285,202,10,11,6,'MIDDLE','10 to 49'),(286,202,12,11,6,'HIGH','0 to 9'),(287,203,8,11,6,'LOW','50 to 100'),(288,203,10,11,6,'MIDDLE','10 to 49'),(289,203,12,11,6,'HIGH','0 to 9'),(290,204,8,11,6,'LOW','50 to 100'),(291,204,10,11,6,'MIDDLE','10 to 49'),(292,204,12,11,6,'HIGH','0 to 9'),(293,205,8,11,6,'LOW','50 to 100'),(294,205,10,11,6,'MIDDLE','10 to 49'),(295,205,12,11,6,'HIGH','0 to 9'),(296,206,8,11,6,'LOW','50 to 100'),(297,206,10,11,6,'MIDDLE','10 to 49'),(298,206,12,11,6,'HIGH','0 to 9'),(299,207,8,11,6,'LOW','50 to 100'),(300,207,10,11,6,'MIDDLE','10 to 49'),(301,207,12,11,6,'HIGH','0 to 9'),(302,208,8,11,6,'LOW','50 to 100'),(303,208,10,11,6,'MIDDLE','10 to 49'),(304,208,12,11,6,'HIGH','0 to 9'),(305,209,8,11,6,'LOW','50 to 100'),(306,209,10,11,6,'MIDDLE','10 to 49'),(307,209,12,11,6,'HIGH','0 to 9'),(308,210,8,11,6,'LOW','50 to 100'),(309,210,10,11,6,'MIDDLE','10 to 49'),(310,210,12,11,6,'HIGH','0 to 9'),(311,211,8,11,6,'LOW','50 to 100'),(312,211,10,11,6,'MIDDLE','10 to 49'),(313,211,12,11,6,'HIGH','0 to 9'),(314,212,8,11,6,'LOW','50 to 100'),(315,212,10,11,6,'MIDDLE','10 to 49'),(316,212,12,11,6,'HIGH','0 to 9'),(317,213,8,11,6,'LOW','50 to 100'),(318,213,10,11,6,'MIDDLE','10 to 49'),(319,213,12,11,6,'HIGH','0 to 9'),(320,214,8,11,6,'LOW','50 to 100'),(321,214,10,11,6,'MIDDLE','10 to 49'),(322,214,12,11,6,'HIGH','0 to 9'),(323,215,8,11,6,'LOW','50 to 100'),(324,215,10,11,6,'MIDDLE','10 to 49'),(325,215,12,11,6,'HIGH','0 to 9'),(344,222,8,3,1,'true','NULL'),(345,222,10,4,2,'false','NULL'),(346,222,12,9,3,'true','NULL');
/*!40000 ALTER TABLE `analyserRules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `analyserRules_view`
--

DROP TABLE IF EXISTS `analyserRules_view`;
/*!50001 DROP VIEW IF EXISTS `analyserRules_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `analyserRules_view` AS SELECT
 1 AS `ruleId`,
 1 AS `analyserId`,
 1 AS `accountId`,
 1 AS `operatorId`,
 1 AS `expressionId`,
 1 AS `dataId`,
 1 AS `searchValue`,
 1 AS `rangeValue`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `analyser_view`
--

DROP TABLE IF EXISTS `analyser_view`;
/*!50001 DROP VIEW IF EXISTS `analyser_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `analyser_view` AS SELECT
 1 AS `analyserId`,
 1 AS `accountId`,
 1 AS `eventId`,
 1 AS `notifyId`,
 1 AS `flowId`,
 1 AS `flowUrl`,
 1 AS `hostId`,
 1 AS `message`,
 1 AS `date`,
 1 AS `modified`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `data_extraction`
--

DROP TABLE IF EXISTS `data_extraction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `data_extraction` (
  `dId` int(11) NOT NULL AUTO_INCREMENT,
  `pId` int(11) NOT NULL,
  `sex` tinyint(1) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `firstDiagnoseDays` int(11) DEFAULT NULL,
  `diagnoseDate` date DEFAULT NULL,
  `status` enum('baseline','exacerbation') DEFAULT NULL,
  `shortActingB2` tinyint(1) DEFAULT NULL,
  `longActingB2` tinyint(1) DEFAULT NULL,
  `ultraLongB2` tinyint(1) DEFAULT NULL,
  `steroidsInhaled` tinyint(1) DEFAULT NULL,
  `steroidsOral` tinyint(1) DEFAULT NULL,
  `sama` tinyint(1) DEFAULT NULL,
  `lama` tinyint(1) DEFAULT NULL,
  `pdef4Inhalator` tinyint(1) DEFAULT NULL,
  `theophyline` tinyint(1) DEFAULT NULL,
  `mycolytocis` tinyint(1) DEFAULT NULL,
  `antibiotics` tinyint(1) DEFAULT NULL,
  `antiflu` tinyint(1) DEFAULT NULL,
  `antipneum` tinyint(1) DEFAULT NULL,
  `ltot` tinyint(1) DEFAULT NULL,
  `ltotStartDate` date DEFAULT NULL,
  `ltotDevice` enum('none','Cylinder','Liquid','Concetrator') DEFAULT NULL,
  `niv` tinyint(1) DEFAULT NULL,
  `ventilationStart` date DEFAULT NULL,
  `weight` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `pxy` int(11) DEFAULT NULL,
  `mmrc` int(11) DEFAULT NULL,
  `smoker` int(11) DEFAULT NULL,
  `fev1` float DEFAULT NULL,
  `fev1_pro` float DEFAULT NULL,
  `fvc` float DEFAULT NULL,
  `fvc_pro` float DEFAULT NULL,
  `fev1_fvc` float DEFAULT NULL,
  `rv` float DEFAULT NULL,
  `rv_pro` float DEFAULT NULL,
  `tlc` float DEFAULT NULL,
  `tlc_pro` float DEFAULT NULL,
  `rv_tlc` float DEFAULT NULL,
  `satO2_pro` float DEFAULT NULL,
  `dlco_pro` float DEFAULT NULL,
  `pao2` float DEFAULT NULL,
  `paco2` float DEFAULT NULL,
  `hco3` float DEFAULT NULL,
  `pH` float DEFAULT NULL,
  `fvc_pre` float DEFAULT NULL,
  `fvc_pre_pro` float DEFAULT NULL,
  `fev1_pre` float DEFAULT NULL,
  `fev1_pre_pro` float DEFAULT NULL,
  `fev1_fvc_pre` float DEFAULT NULL,
  `fef25_75_pre_pro` float DEFAULT NULL,
  `pef_pre_pro` float DEFAULT NULL,
  `tlc_pre` float DEFAULT NULL,
  `tlc_pre_pro` float DEFAULT NULL,
  `frc_pre` float DEFAULT NULL,
  `frc_pre_pro` float DEFAULT NULL,
  `rv_pre` float DEFAULT NULL,
  `rv_pre_pro` float DEFAULT NULL,
  `kco_pro` float DEFAULT NULL,
  `hematocrit` float DEFAULT NULL,
  `fvc_post` float DEFAULT NULL,
  `del_fvc_pro` float DEFAULT NULL,
  `fev1_post` float DEFAULT NULL,
  `del_fev1_post` float DEFAULT NULL,
  `del_fef25_75_pro` float DEFAULT NULL,
  `del_pef_pro` float DEFAULT NULL,
  `ventilationDevice` enum('none','BiPAP','CPAP') DEFAULT NULL,
  `q1` tinyint(1) NOT NULL,
  `q2` tinyint(1) NOT NULL,
  `q3` tinyint(1) NOT NULL,
  `q4` tinyint(1) NOT NULL,
  `q5` tinyint(1) NOT NULL,
  `q1a` tinyint(1) DEFAULT '0',
  `q1b` tinyint(1) DEFAULT '0',
  `q1c` tinyint(1) DEFAULT '0',
  `q3a` tinyint(1) DEFAULT '0',
  `q3b` tinyint(1) DEFAULT '0',
  `q3c` tinyint(1) DEFAULT '0',
  `satO2` float DEFAULT '0',
  `walkingDist` float DEFAULT '0',
  `temperature` float DEFAULT '0',
  `pefr` float DEFAULT '0',
  `heartRate` float DEFAULT '0',
  `exacerbation_timeframe` int(11) DEFAULT NULL,
  `myocardialInfarction` tinyint(1) DEFAULT '0',
  `congestiveHeartFailure` tinyint(1) DEFAULT '0',
  `peripheralVascularDisease` tinyint(1) DEFAULT '0',
  `cerebrovascularDisease` tinyint(1) DEFAULT '0',
  `dementia` tinyint(1) DEFAULT '0',
  `chronicPulmonaryDiasease` tinyint(1) DEFAULT '0',
  `connectiveTissueDisease` tinyint(1) DEFAULT '0',
  `ulcerDisease` tinyint(1) DEFAULT '0',
  `liverDiseaseMild` tinyint(1) DEFAULT '0',
  `diabetes` tinyint(1) DEFAULT '0',
  `hemiplegia` tinyint(1) DEFAULT '0',
  `renalDiseaseModerateOrSevere` tinyint(1) DEFAULT '0',
  `diabetesWithEndOrganDamage` tinyint(1) DEFAULT '0',
  `anyTumor` tinyint(1) DEFAULT '0',
  `leukemia` tinyint(1) DEFAULT '0',
  `malignantLymphoma` tinyint(1) DEFAULT '0',
  `liverDiseaseModerateOrSevere` tinyint(1) DEFAULT '0',
  `metastaticSolidMalignancy` tinyint(1) DEFAULT '0',
  `aids` tinyint(1) DEFAULT '0',
  `noConditionAvailable` tinyint(1) DEFAULT '0',
  `totalCharlson` int(11) DEFAULT '0',
  PRIMARY KEY (`dId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `data_extraction`
--

LOCK TABLES `data_extraction` WRITE;
/*!40000 ALTER TABLE `data_extraction` DISABLE KEYS */;
/*!40000 ALTER TABLE `data_extraction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `daysExacerbationTraining_view`
--

DROP TABLE IF EXISTS `daysExacerbationTraining_view`;
/*!50001 DROP VIEW IF EXISTS `daysExacerbationTraining_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `daysExacerbationTraining_view` AS SELECT
 1 AS `dailyReportId`,
 1 AS `status`,
 1 AS `daysExacerbation`,
 1 AS `dailyReportDate`,
 1 AS `visitDate`,
 1 AS `diagnoseDate`,
 1 AS `visitId`,
 1 AS `readingId`,
 1 AS `treatmentId`,
 1 AS `charlsonId`,
 1 AS `doctorId`,
 1 AS `sex`,
 1 AS `age`,
 1 AS `daysFromFirstDiagnose`,
 1 AS `antibiotics`,
 1 AS `antiflu`,
 1 AS `antipneum`,
 1 AS `lama`,
 1 AS `longActingB2`,
 1 AS `ltot`,
 1 AS `ltotDevice`,
 1 AS `daysltotStartDate`,
 1 AS `mycolytocis`,
 1 AS `niv`,
 1 AS `pdef4Inhalator`,
 1 AS `sama`,
 1 AS `shortActingB2`,
 1 AS `steroidsInhaled`,
 1 AS `steroidsOral`,
 1 AS `theophyline`,
 1 AS `ultraLongB2`,
 1 AS `ventilationDevice`,
 1 AS `daysventilationStart`,
 1 AS `height`,
 1 AS `weight`,
 1 AS `del_fef25_75_pro`,
 1 AS `del_fev1_post`,
 1 AS `del_fvc_pro`,
 1 AS `del_pef_pro`,
 1 AS `dlco_pro`,
 1 AS `fef25_75_pre_pro`,
 1 AS `fev1`,
 1 AS `fev1_fvc`,
 1 AS `fev1_fvc_pre`,
 1 AS `fev1_post`,
 1 AS `fev1_pre`,
 1 AS `fev1_pre_pro`,
 1 AS `fev1_pro`,
 1 AS `frc_pre`,
 1 AS `frc_pre_pro`,
 1 AS `fvc`,
 1 AS `fvc_post`,
 1 AS `fvc_pre`,
 1 AS `fvc_pre_pro`,
 1 AS `fvc_pro`,
 1 AS `hco3`,
 1 AS `hematocrit`,
 1 AS `kco_pro`,
 1 AS `mmrc`,
 1 AS `paco2`,
 1 AS `pao2`,
 1 AS `pef_pre_pro`,
 1 AS `pH`,
 1 AS `pxy`,
 1 AS `rv`,
 1 AS `rv_pre`,
 1 AS `rv_pre_pro`,
 1 AS `rv_pro`,
 1 AS `rv_tlc`,
 1 AS `satO2_pro`,
 1 AS `smoker`,
 1 AS `tlc`,
 1 AS `tlc_pre`,
 1 AS `tlc_pre_pro`,
 1 AS `tlc_pro`,
 1 AS `q1`,
 1 AS `q2`,
 1 AS `q3`,
 1 AS `q4`,
 1 AS `q5`,
 1 AS `q1a`,
 1 AS `q1b`,
 1 AS `q1c`,
 1 AS `q3a`,
 1 AS `q3b`,
 1 AS `q3c`,
 1 AS `satO2`,
 1 AS `walkingDist`,
 1 AS `temperature`,
 1 AS `pefr`,
 1 AS `heartRate`,
 1 AS `aids`,
 1 AS `anyTumor`,
 1 AS `cerebrovascularDisease`,
 1 AS `chronicPulmonaryDiasease`,
 1 AS `congestiveHeartFailure`,
 1 AS `connectiveTissueDisease`,
 1 AS `dementia`,
 1 AS `diabetes`,
 1 AS `diabetesWithEndOrganDamage`,
 1 AS `hemiplegia`,
 1 AS `leukemia`,
 1 AS `liverDiseaseMild`,
 1 AS `liverDiseaseModerateOrSevere`,
 1 AS `malignantLymphoma`,
 1 AS `metastaticSolidMalignancy`,
 1 AS `myocardialInfarction`,
 1 AS `peripheralVascularDisease`,
 1 AS `renalDiseaseModerateOrSevere`,
 1 AS `ulcerDisease`,
 1 AS `noConditionAvailable`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `daysExacerbation_view`
--

DROP TABLE IF EXISTS `daysExacerbation_view`;
/*!50001 DROP VIEW IF EXISTS `daysExacerbation_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `daysExacerbation_view` AS SELECT
 1 AS `dailyReportId`,
 1 AS `status`,
 1 AS `daysExacerbation`,
 1 AS `dailyReportDate`,
 1 AS `visitDate`,
 1 AS `diagnoseDate`,
 1 AS `visitId`,
 1 AS `readingId`,
 1 AS `treatmentId`,
 1 AS `charlsonId`,
 1 AS `doctorId`,
 1 AS `sex`,
 1 AS `age`,
 1 AS `daysFromFirstDiagnose`,
 1 AS `antibiotics`,
 1 AS `antiflu`,
 1 AS `antipneum`,
 1 AS `lama`,
 1 AS `longActingB2`,
 1 AS `ltot`,
 1 AS `ltotDevice`,
 1 AS `daysltotStartDate`,
 1 AS `mycolytocis`,
 1 AS `niv`,
 1 AS `pdef4Inhalator`,
 1 AS `sama`,
 1 AS `shortActingB2`,
 1 AS `steroidsInhaled`,
 1 AS `steroidsOral`,
 1 AS `theophyline`,
 1 AS `ultraLongB2`,
 1 AS `ventilationDevice`,
 1 AS `daysventilationStart`,
 1 AS `height`,
 1 AS `weight`,
 1 AS `del_fef25_75_pro`,
 1 AS `del_fev1_post`,
 1 AS `del_fvc_pro`,
 1 AS `del_pef_pro`,
 1 AS `dlco_pro`,
 1 AS `fef25_75_pre_pro`,
 1 AS `fev1`,
 1 AS `fev1_fvc`,
 1 AS `fev1_fvc_pre`,
 1 AS `fev1_post`,
 1 AS `fev1_pre`,
 1 AS `fev1_pre_pro`,
 1 AS `fev1_pro`,
 1 AS `frc_pre`,
 1 AS `frc_pre_pro`,
 1 AS `fvc`,
 1 AS `fvc_post`,
 1 AS `fvc_pre`,
 1 AS `fvc_pre_pro`,
 1 AS `fvc_pro`,
 1 AS `hco3`,
 1 AS `hematocrit`,
 1 AS `kco_pro`,
 1 AS `mmrc`,
 1 AS `paco2`,
 1 AS `pao2`,
 1 AS `pef_pre_pro`,
 1 AS `pH`,
 1 AS `pxy`,
 1 AS `rv`,
 1 AS `rv_pre`,
 1 AS `rv_pre_pro`,
 1 AS `rv_pro`,
 1 AS `rv_tlc`,
 1 AS `satO2_pro`,
 1 AS `smoker`,
 1 AS `tlc`,
 1 AS `tlc_pre`,
 1 AS `tlc_pre_pro`,
 1 AS `tlc_pro`,
 1 AS `q1`,
 1 AS `q2`,
 1 AS `q3`,
 1 AS `q4`,
 1 AS `q5`,
 1 AS `q1a`,
 1 AS `q1b`,
 1 AS `q1c`,
 1 AS `q3a`,
 1 AS `q3b`,
 1 AS `q3c`,
 1 AS `satO2`,
 1 AS `walkingDist`,
 1 AS `temperature`,
 1 AS `pefr`,
 1 AS `heartRate`,
 1 AS `aids`,
 1 AS `anyTumor`,
 1 AS `cerebrovascularDisease`,
 1 AS `chronicPulmonaryDiasease`,
 1 AS `congestiveHeartFailure`,
 1 AS `connectiveTissueDisease`,
 1 AS `dementia`,
 1 AS `diabetes`,
 1 AS `diabetesWithEndOrganDamage`,
 1 AS `hemiplegia`,
 1 AS `leukemia`,
 1 AS `liverDiseaseMild`,
 1 AS `liverDiseaseModerateOrSevere`,
 1 AS `malignantLymphoma`,
 1 AS `metastaticSolidMalignancy`,
 1 AS `myocardialInfarction`,
 1 AS `peripheralVascularDisease`,
 1 AS `renalDiseaseModerateOrSevere`,
 1 AS `ulcerDisease`,
 1 AS `noConditionAvailable`*/;
SET character_set_client = @saved_cs_client;


--
-- Dumping routines for database 'echo'
--


DELIMITER ;;
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `analyserCreate`(
in eventId VARCHAR(255),
in notifyId VARCHAR(255),
in flowId VARCHAR(20),
in flowUrl VARCHAR(255),
in hostId Int,
in message Text
)
proc: BEGIN
	SET @stmt = "INSERT INTO analyser (accountId, eventId, notifyId, flowId, flowUrl, hostId, message, date)
	VALUES (?,(SELECT eventId FROM analyserEvents WHERE eventFunction = ? LIMIT 1),(SELECT notifyId FROM analyserNotification WHERE actionFunction = ? LIMIT 1),?,?,?,?,?)";
set @accountId = substring_index(user(), '@', 1) ;
set @eventId = eventId ;
set @notifyId = notifyId ;
set @flowId = flowId ;
set @flowUrl = flowUrl ;
set @hostId = hostId ;
set @message = message ;
set @date = NOW() ;

	PREPARE s FROM @stmt;
	EXECUTE s using @accountId,@eventId,@notifyId,@flowId,@flowUrl,@hostId,@message,@date;
	SELECt last_insert_id() as insertId;
	DEALLOCATE PREPARE s;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `analyserDelete`(
IN analyserId INT
)
BEGIN
		set @aId = analyserId;
		SET @stmt = CONCAT("DELETE FROM analyser_view WHERE analyserId = ?");
		PREPARE s FROM @stmt;
		EXECUTE s using @aId;
		SELECT ROW_COUNT() as affected_rows;
		DEALLOCATE PREPARE s;
END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `analyserFilterCreate`(
in analyserId Int,
in dataTable VARCHAR(255),
in dataField VARCHAR(255),
in value VARCHAR(255)
)
proc: BEGIN
	SET @stmt = "INSERT INTO analyserFilter (analyserId, dataId, value)
	VALUES (?,(SELECT dataId FROM analyserField_view WHERE `table` = ? AND `name` = ? LIMIT 1),?)";

	set @analyserId = analyserId ;
	set @dataTable = dataTable ;
	set @dataField = dataField ;
	set @value = value ;

	PREPARE s FROM @stmt;
	EXECUTE s using @analyserId,@dataTable,@dataField,@value;
	SELECt last_insert_id() as insertId;
	DEALLOCATE PREPARE s;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `analyserFilterListOne`(IN analyserId INT)
BEGIN
		set @basic_stmt = CONCAT('SELECT af.filterId, af.analyserId, afe.table, afe.name, af.value FROM analyserFilter_view as af, analyserField_view as afe WHERE afe.dataId = af.dataId AND af.analyserId = ? ORDER BY af.filterId DESC');
		set @id = analyserId;

		PREPARE s FROM @basic_stmt;
		EXECUTE s using @id;
		DEALLOCATE PREPARE s;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `analyserList`(IN pageNo INT, IN pageSize INT)
BEGIN
		set @basic_stmt = CONCAT ('SELECT av.analyserId, av.accountId, ae.eventFunction, an.actionFunction, av.flowId, av.flowUrl, av.hostId, av.message, av.date, av.modified FROM analyser_view as av, analyserEvents as ae, analyserNotification as an WHERE ae.eventId = av.eventId AND an.notifyId = av.notifyId ORDER BY av.analyserId DESC');
		set @page_stmt = ' ';

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
		EXECUTE s;
		DEALLOCATE PREPARE s;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `analyserListAll`()
BEGIN
		set @basic_stmt = CONCAT ('SELECT av.analyserId, av.accountId, ae.eventFunction, an.actionFunction, av.flowId, av.flowUrl, av.hostId, av.message, av.date, av.modified FROM analyser_view as av, analyserEvents as ae, analyserNotification as an WHERE ae.eventId = av.eventId AND an.notifyId = av.notifyId ORDER BY av.analyserId DESC');

		PREPARE s FROM @basic_stmt;
		EXECUTE s;
		DEALLOCATE PREPARE s;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `analyserListOne`(IN aId INT)
BEGIN
		set @basic_stmt = CONCAT ('SELECT av.analyserId, av.accountId, ae.eventFunction, an.actionFunction, av.flowId, av.flowUrl, av.hostId, av.message, av.date, av.modified FROM analyser_view as av, analyserEvents as ae, analyserNotification as an WHERE ae.eventId = av.eventId AND an.notifyId = av.notifyId AND av.analyserId = ?');
		set @id = aId;
		PREPARE s FROM @basic_stmt;
		EXECUTE s using @id;
		DEALLOCATE PREPARE s;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `analyserOperatorList`(IN pageNo INT, IN pageSize INT)
BEGIN

		set @basic_stmt = CONCAT ('SELECT operatorId, operator FROM analyserOperator_view ORDER BY operatorId DESC ');
		set @page_stmt = ' ';

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
		EXECUTE s;
		DEALLOCATE PREPARE s;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `analyserRulesCreate`(
in analyserId Int,
in operatorId VARCHAR(255),
in expressionId VARCHAR(255),
in dataTable VARCHAR(255),
in dataField VARCHAR(255),
in searchValue VARCHAR(45),
in rangeValue VARCHAR(255)
)
proc: BEGIN
	SET @stmt = "INSERT INTO analyserRules (analyserId, operatorId, expressionId, dataId, searchValue, rangeValue)
	VALUES (?,(SELECT operatorId FROM analyserOperator WHERE operator = ? LIMIT 1),(SELECT expressionId FROM analyserExpression WHERE expression = ? LIMIT 1),(SELECT dataId FROM analyserField WHERE `table` = ? AND name = ? LIMIT 1),?,?)";
set @analyserId = analyserId ;
set @operatorId = operatorId ;
set @expressionId = expressionId ;
set @dataTable = dataTable ;
set @dataField = dataField ;
set @searchValue = searchValue ;
set @rangeValue = rangeValue ;

	PREPARE s FROM @stmt;
	EXECUTE s using @analyserId,@operatorId,@expressionId,@dataTable,@dataField,@searchValue,@rangeValue;
	SELECt last_insert_id() as insertId;
	DEALLOCATE PREPARE s;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `analyserRulesListOne`(IN aId INT, IN pageNo INT, IN pageSize INT)
BEGIN
		set @basic_stmt = CONCAT ('SELECT av.ruleId, av.analyserId, av.accountId, ao.operator, ae.expression, af.table as dataTable, af.name as dataField, av.searchValue, av.rangeValue FROM analyserRules_view as av, analyserExpression as ae, analyserField as af, analyserOperator as ao WHERE ae.expressionId = av.expressionId AND af.dataId = av.dataId AND ao.operatorId = av.operatorId AND av.analyserId = ?');
		set @page_stmt = ' ';

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

        set @id = aId;
		PREPARE s FROM @basic_stmt;
		EXECUTE s using @id;
		DEALLOCATE PREPARE s;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `analyserRulesListOneAll`(IN aId INT)
BEGIN
		set @basic_stmt = CONCAT('SELECT av.ruleId, av.analyserId, av.accountId, ao.operator, ae.expression, af.table as dataTable, af.name as dataField, av.searchValue, av.rangeValue FROM analyserRules_view as av, analyserExpression as ae, analyserField as af, analyserOperator as ao WHERE ae.expressionId = av.expressionId AND af.dataId = av.dataId AND ao.operatorId = av.operatorId AND av.analyserId = ?');

        set @id = aId;
		PREPARE s FROM @basic_stmt;
		EXECUTE s using @id;
		DEALLOCATE PREPARE s;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `analyserUpdate`(
in analyserId int,
in flowId varchar(20),
in flowUrl varchar(255),
in hostId varchar(255)
)
BEGIN

	SET @stmt = "UPDATE analyser_view SET flowId=?, flowUrl=?, hostId=(SELECT hostId FROM analyserHost_view WHERE hostname=?) WHERE analyserId =?";

	set @aId = analyserId ;
	set @flowId = flowId ;
	set @flowUrl = flowUrl ;
	set @hostId = hostId ;

	PREPARE s FROM @stmt;
	EXECUTE s using @flowId,@flowUrl,@hostId,@aId;
	SELECT ROW_COUNT() as affected_rows;
	DEALLOCATE PREPARE s;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `dataMiningExport`()
BEGIN

	set @basic_stmt = CONCAT ('
    SELECT
		`echo`.`patients`.`patientId` AS patientId,
        `echo`.`dailyReports`.`recordId` AS dailyReport_recordId,
        `echo`.`visits`.`status` as status,
		`echo`.`dailyReports`.`date` as date,
        `echo`.`dailyReports`.`date` as diagnoseDate,
        case `echo`.`visits`.`status`
			when \'exacerbation\' then DATEDIFF(CURDATE(), (SELECT `date` FROM `echo`.`visits` WHERE `date` < `echo`.`dailyReports`.`date` LIMIT 1))
            when \'baseline\' then -1
		end as daysExacerbation,
        `echo`.`patients`.`sex` AS sex,
        YEAR(CURRENT_TIMESTAMP) - YEAR(`echo`.`patients`.`dateOfBirth`) - (RIGHT(CURRENT_TIMESTAMP, 5) < RIGHT(`echo`.`patients`.`dateOfBirth`, 5)) AS age,
		DATEDIFF(CURDATE(), `echo`.`patients`.`firstDiagnoseDate`) AS daysFromFirstDiagnose,
		`echo`.`treatments`.`antibiotics`,
        `echo`.`treatments`.`antiflu`,
        `echo`.`treatments`.`antipneum`,
        `echo`.`treatments`.`lama`,
        `echo`.`treatments`.`longActingB2`,
        `echo`.`treatments`.`ltot`,
        `echo`.`treatments`.`ltotDevice`,
        DATEDIFF(CURDATE(), `echo`.`treatments`.`ltotStartDate`) AS daysltotStartDate,
        `echo`.`treatments`.`mycolytocis`,
        `echo`.`treatments`.`niv`,
        `echo`.`treatments`.`pdef4Inhalator`,
        `echo`.`treatments`.`sama`,
        `echo`.`treatments`.`shortActingB2`,
        `echo`.`treatments`.`steroidsInhaled`,
        `echo`.`treatments`.`steroidsOral`,
        `echo`.`treatments`.`theophyline`,
        `echo`.`treatments`.`ultraLongB2`,
        `echo`.`treatments`.`ventilationDevice`,
        DATEDIFF(CURDATE(), `echo`.`treatments`.`ventilationStart`) AS daysventilationStart,
		`echo`.`readings`.`height`,
		`echo`.`readings`.`weight`,
        `echo`.`readings`.`del_fef25_75_pro`,
        `echo`.`readings`.`del_fev1_post`,
        `echo`.`readings`.`del_fvc_pro`,
        `echo`.`readings`.`del_pef_pro`,
        `echo`.`readings`.`dlco_pro`,
        `echo`.`readings`.`fef25_75_pre_pro`,
        `echo`.`readings`.`fev1`,
        `echo`.`readings`.`fev1_fvc`,
        `echo`.`readings`.`fev1_fvc_pre`,
        `echo`.`readings`.`fev1_post`,
        `echo`.`readings`.`fev1_pre`,
        `echo`.`readings`.`fev1_pre_pro`,
        `echo`.`readings`.`fev1_pro`,
        `echo`.`readings`.`frc_pre`,
        `echo`.`readings`.`frc_pre_pro`,
        `echo`.`readings`.`fvc`,
        `echo`.`readings`.`fvc_post`,
        `echo`.`readings`.`fvc_pre`,
        `echo`.`readings`.`fvc_pre_pro`,
        `echo`.`readings`.`fvc_pro`,
        `echo`.`readings`.`hco3`,
        `echo`.`readings`.`hematocrit`,
        `echo`.`readings`.`kco_pro`,
        `echo`.`readings`.`mmrc`,
        `echo`.`readings`.`notes`,
        `echo`.`readings`.`paco2`,
        `echo`.`readings`.`pao2`,
        `echo`.`readings`.`pef_pre_pro`,
        `echo`.`readings`.`pH`,
        `echo`.`readings`.`pxy`,
        `echo`.`readings`.`rv`,
        `echo`.`readings`.`rv_pre`,
        `echo`.`readings`.`rv_pre_pro`,
        `echo`.`readings`.`rv_pro`,
        `echo`.`readings`.`rv_tlc`,
        `echo`.`readings`.`satO2_pro`,
        `echo`.`readings`.`smoker`,
        `echo`.`readings`.`tlc`,
        `echo`.`readings`.`tlc_pre`,
        `echo`.`readings`.`tlc_pre_pro`,
        `echo`.`readings`.`tlc_pro`,
        `echo`.`dailyReports`.`q1`,
        `echo`.`dailyReports`.`q2`,
        `echo`.`dailyReports`.`q3`,
        `echo`.`dailyReports`.`q4`,
        `echo`.`dailyReports`.`q5`,
        `echo`.`dailyReports`.`q1a`,
        `echo`.`dailyReports`.`q1b`,
        `echo`.`dailyReports`.`q1c`,
        `echo`.`dailyReports`.`q3a`,
        `echo`.`dailyReports`.`q3b`,
        `echo`.`dailyReports`.`q3c`,
        `echo`.`dailyReports`.`satO2`,
        `echo`.`dailyReports`.`walkingDist`,
        `echo`.`dailyReports`.`temperature`,
        `echo`.`dailyReports`.`pefr`,
        `echo`.`dailyReports`.`heartRate`,
        `echo`.`charlsons`.`aids`,
        `echo`.`charlsons`.`anyTumor`,
        `echo`.`charlsons`.`cerebrovascularDisease`,
        `echo`.`charlsons`.`chronicPulmonaryDiasease`,
        `echo`.`charlsons`.`congestiveHeartFailure`,
        `echo`.`charlsons`.`connectiveTissueDisease`,
        `echo`.`charlsons`.`dementia`,
        `echo`.`charlsons`.`diabetes`,
        `echo`.`charlsons`.`diabetesWithEndOrganDamage`,
        `echo`.`charlsons`.`hemiplegia`,
        `echo`.`charlsons`.`leukemia`,
        `echo`.`charlsons`.`liverDiseaseMild`,
        `echo`.`charlsons`.`liverDiseaseModerateOrSevere`,
        `echo`.`charlsons`.`malignantLymphoma`,
        `echo`.`charlsons`.`metastaticSolidMalignancy`,
        `echo`.`charlsons`.`myocardialInfarction`,
        `echo`.`charlsons`.`peripheralVascularDisease`,
        `echo`.`charlsons`.`renalDiseaseModerateOrSevere`,
        `echo`.`charlsons`.`ulcerDisease`,
        `echo`.`charlsons`.`noConditionAvailable`
	FROM `echo`.`dailyReports`
    INNER JOIN `echo`.`patients`
        ON `echo`.`patients`.`patientId` = `echo`.`dailyReports`.`patientId`
	LEFT OUTER JOIN `echo`.`charlsons`
		ON `echo`.`charlsons`.`recordId` = (SELECT `recordId` FROM `echo`.`charlsons` WHERE `echo`.`charlsons`.`patientId` = `echo`.`dailyReports`.`patientId` ORDER BY `date` DESC LIMIT 1)
	INNER JOIN `echo`.`visits`
		ON `echo`.`visits`.`visitid` = (SELECT `visitid` FROM `echo`.`visits` WHERE `echo`.`visits`.`date` <= `echo`.`dailyReports`.`date` AND `echo`.`visits`.`patientId` = `echo`.`dailyReports`.`patientId` ORDER BY `date` DESC LIMIT 1)
	LEFT OUTER JOIN `echo`.`treatments`
		ON `echo`.`treatments`.`recordId` = `echo`.`visits`.`visitid`
	LEFT OUTER JOIN `echo`.`readings`
		ON `echo`.`readings`.`recordId` = `echo`.`visits`.`visitid`
	ORDER BY `echo`.`dailyReports`.`recordId`');

    PREPARE s FROM @basic_stmt;
	EXECUTE s;
	DEALLOCATE PREPARE s;

END ;;
DELIMITER ;

DELIMITER ;;
CREATE DEFINER=`echo_db_usr`@`localhost` PROCEDURE `daysExacerbationListOne`(IN aId INT)
BEGIN
		set @basic_stmt = CONCAT ('SELECT * FROM daysExacerbation_view WHERE dailyReportId = ?');
		set @id = aId;
		PREPARE s FROM @basic_stmt;
		EXECUTE s using @id;
		DEALLOCATE PREPARE s;

END ;;
DELIMITER ;

--
-- Final view structure for view `analyserEvents_view`
--

/*!50001 DROP VIEW IF EXISTS `analyserEvents_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `analyserEvents_view` AS select `analyserEvents`.`eventId` AS `eventId`,`analyserEvents`.`eventName` AS `eventName`,`analyserEvents`.`eventFunction` AS `eventFunction` from `analyserEvents` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `analyserExpression_view`
--

/*!50001 DROP VIEW IF EXISTS `analyserExpression_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `analyserExpression_view` AS select `analyserExpression`.`expressionId` AS `expressionId`,`analyserExpression`.`expression` AS `expression` from `analyserExpression` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `analyserField_view`
--

/*!50001 DROP VIEW IF EXISTS `analyserField_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `analyserField_view` AS select `analyserField`.`dataId` AS `dataId`,`analyserField`.`table` AS `table`,`analyserField`.`name` AS `name`,`analyserField`.`description` AS `description` from `analyserField` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `analyserFilter_view`
--

/*!50001 DROP VIEW IF EXISTS `analyserFilter_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `analyserFilter_view` AS select `analyserFilter`.`filterId` AS `filterId`,`analyserFilter`.`analyserId` AS `analyserId`,`analyserFilter`.`dataId` AS `dataId`,`analyserFilter`.`value` AS `value` from (`analyserFilter` join `analyser` on((`analyserFilter`.`analyserId` = `analyser`.`analyserId`))) where (case when (`GETROLE`() = 'admin') then (1 = 1) else (`analyser`.`accountId` = substring_index(user(),'@',1)) end) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `analyserHost_view`
--

/*!50001 DROP VIEW IF EXISTS `analyserHost_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `analyserHost_view` AS select `analyserHost`.`hostId` AS `hostId`,`analyserHost`.`hostname` AS `hostname`,`analyserHost`.`hostport` AS `hostport`,`analyserHost`.`hostpath` AS `hostpath`,`analyserHost`.`primary` AS `primary` from `analyserHost` where (`analyserHost`.`enabled` = 1) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `analyserNotification_view`
--

/*!50001 DROP VIEW IF EXISTS `analyserNotification_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `analyserNotification_view` AS select `analyserNotification`.`notifyId` AS `notifyId`,`analyserNotification`.`actionName` AS `actionName`,`analyserNotification`.`actionFunction` AS `actionFunction` from `analyserNotification` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `analyserOperator_view`
--

/*!50001 DROP VIEW IF EXISTS `analyserOperator_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `analyserOperator_view` AS select `analyserOperator`.`operatorId` AS `operatorId`,`analyserOperator`.`operator` AS `operator` from `analyserOperator` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `analyserRules_view`
--

/*!50001 DROP VIEW IF EXISTS `analyserRules_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `analyserRules_view` AS select `analyserRules`.`ruleId` AS `ruleId`,`analyserRules`.`analyserId` AS `analyserId`,`analyser`.`accountId` AS `accountId`,`analyserRules`.`operatorId` AS `operatorId`,`analyserRules`.`expressionId` AS `expressionId`,`analyserRules`.`dataId` AS `dataId`,`analyserRules`.`searchValue` AS `searchValue`,`analyserRules`.`rangeValue` AS `rangeValue` from (`analyserRules` join `analyser` on((`analyserRules`.`analyserId` = `analyser`.`analyserId`))) where (case when (`GETROLE`() = 'admin') then (1 = 1) else (`analyser`.`accountId` = substring_index(user(),'@',1)) end) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `analyser_view`
--

/*!50001 DROP VIEW IF EXISTS `analyser_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`echo_db_usr`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `analyser_view` AS select `analyser`.`analyserId` AS `analyserId`,`analyser`.`accountId` AS `accountId`,`analyser`.`eventId` AS `eventId`,`analyser`.`notifyId` AS `notifyId`,`analyser`.`flowId` AS `flowId`,`analyser`.`flowUrl` AS `flowUrl`,`analyser`.`hostId` AS `hostId`,`analyser`.`message` AS `message`,`analyser`.`date` AS `date`,`analyser`.`modified` AS `modified` from `analyser` where (case when (`GETROLE`() = 'admin') then (1 = 1) else (`analyser`.`accountId` = substring_index(user(),'@',1)) end) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

GRANT EXECUTE ON procedure `echo`.`analyserCreate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`analyserDelete` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`analyserFilterCreate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`analyserFilterListOne` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`analyserList` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`analyserListAll` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`analyserListOne` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`analyserOperatorList` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`analyserRulesCreate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`analyserRulesListOne` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`analyserRulesListOneAll` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`analyserUpdate` TO 'echo_db_usr'@'localhost';
GRANT EXECUTE ON procedure `echo`.`daysExacerbationListOne` TO 'echo_db_usr'@'localhost';