/**
 * Created by steimlfk on 05.03.15.
 */
var db = require('../utils.js').db;
var service = require('../config.js').notificationService;
var http = require('http');
var async = require('async');
var querystring = require('querystring');

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var postOptions = {
    host: service.host,
    port: '80',
    method: 'POST',
    headers: {
        Authorization: service.apiKey
    }
};
postOptions.headers['Content-Type'] = 'application/json';

var DailyAnalyzer = function() {

    this.on('newDailyReport', function(id) {
        db.getConnection(function(err, con){
            // This query fetches all information about a certain dailyReport
            // plus it fetches all notification information (mode, enabled, mobile no, email address) from the patient and the doctor
            // the name of the patient is also fetched
            // deviceIds are fetched via left outer join.
            // Careful: if there is more than one deviceId/account, only the ones from the first fetched tuple is used!
            // twoDayAnalyzes checks if (yesterday.q1 == today.q1 OR yesterday.q5 == today.q5) (yesterday and today are dailyRecords)
            var qry = 'SELECT a.notificationMode, a.notificationEnabled, a.accountId, a.email, a.mobile, ' +
                'd.recordId, d.q1, d.q2, d.q3, d.q4, d.q5, d.q1a, d.q1b, d.q1c, d.q3a, d.q3b, d.q3c, ' +
                'p.firstName, p.lastName,' +
                'doc.notificationMode AS doc_mode, doc.notificationEnabled as doc_enabled, doc.accountId as doc_id, doc.email as doc_email, doc.mobile AS doc_mobile, ' +
                'pdev.deviceId as patient_device, ddev.deviceId as doc_device, ' +
                'twoDayAnalyzes(a.accountId) AS twoDays ' +
                'FROM accounts a left join devices pdev on (a.accountId = pdev.accountId), accounts doc left join devices ddev on (doc.accountId = ddev.accountId), dailyReports d, patients p '+
                'WHERE d.recordId = ? '+
                'AND a.accountId = d.patientId AND a.accountId = p.patientId AND p.doctorId = doc.accountId;';
            con.query(qry, id, function(err, result) {
                var type = 0;
                /*
                 Notification Types:
                 1 = Call your doc!
                 2 = Go to hospital!
                 3 = Your patient %name% should call you!
                 4 = Your patient %name% should go to hospital
                 */
                var rule = 0;
                /*
                 Rules:
                 1) Two days in a row Q1 „yes“ 				    -> Notification: Call your doctor!
                 2) Q1, Q2 and Q3 answered with „yes“ 			-> Notification: Call your doctor!
                 3) Q3a or Q3b answered with „yes“ 			    -> Notification: Call your doctor!
                 4) Q3c answered with yes 					    -> Notification: Go to the hospital!
                 5) Two days in a row Q5 „yes“ 				    -> Notification: Call your doctor!
                 */
                if (result[0].q1 == 1 && result[0].q2 == 1 && result[0].q3 == 1){
                    type = 1;
                    rule = 2;
                }
                if (result[0].q3a == 1 || result[0].q3b == 1) {
                    type = '1';
                    rule = 3;
                }
                if (result[0].twoDays > 0){
                    type = '1';
                    /*
                     if twoDays == 1 -> rule 1
                     if twoDays == 5 -> rule 5
                     if twoDays == 6 -> both apply
                     */
                    rule = 1;
                    if (result[0].twoDays > 1) rule = 5;
                }
                if (result[0].q3c == 1) {
                    rule = 4;
                    type = '2';
                }

                if (type > 0){
                    var i = result[0];
                    //console.log(i.recordId + ':  q1:'+ i.q1+',q2:'+ i.q2+',q3:'+ i.q3+',q4:'+ i.q4+',q5:'+ i.q5 +' --> type: '+type );
                    var notificationqry = 'INSERT INTO notifications (accountId, date, type, subjectsAccount, message) VALUES (?, now(), ? ,?, ?)';
                    var patient_name = i.firstName + ' ' + i.lastName;
                    var pattext = (type == 1)? 'Please call your doctor! (' + i.doc_mobile + ')' : 'Go to the Hospital!';
                    var doctext = (type == 1)? "Your patient " + patient_name + " should call you! \n" : "Your patient " + patient_name + " should go to the hospital.\n";
                    switch (rule){
                        case 2: {
                            doctext +=  "In his report your patient said that his shortness of breath increased, that his cough increased and that his sputum changed to";
                            var sputum = 'unknown';
                            if (i.q3a) sputum = 'yellow';
                            if (i.q3b) sputum = 'green';
                            doctext += sputum + '';
                        } break;
                        case 3: {
                            doctext +=  "In his report your patient said that his sputum changed to";
                            var sputum = 'unknown';
                            if (i.q3a) sputum = 'yellow';
                            if (i.q3b) sputum = 'green';
                            doctext += sputum + '';
                        } break;
                        case 4: {
                            doctext +=  "In his report your patient said that his sputum is bloody!";
                        } break;
                        case 1: {
                            doctext +=  "In his reports your patient said that his shortness of breath increased in two days in a row!";
                        } break;
                        case 5: {
                            doctext +=  "In his reports your patient said that he increased his medication two days in a row!";
                        } break;
                    };
                    async.parallel([
                            function(cb) {
                                // patients notification
                                con.query(notificationqry, [i.accountId, type, null, pattext], cb);
                            },
                            function(cb) {
                                // doctors notification
                                con.query(notificationqry, [i.doc_id, type+2, i.accountId, doctext], cb);
                            },
                            function(cb){
                                // patients notification
                                if (i.notificationEnabled){
                                    switch (i.notificationMode) {
                                        case 'email': sendMessage(i.notificationMode, i.email, pattext); break;
                                        case 'sms': sendMessage(i.notificationMode, i.mobile, pattext); break;
                                        case 'push': sendMessage(i.notificationMode, i.patient_device, pattext); break;
                                    }
                                    cb(null, 'patients notification was sent');
                                }
                                else cb (null, 'omitting sending patients notification!')
                            },
                            function(cb){
                                // doctors notification
                                if (i.doc_enabled){
                                    switch (i.doc_mode) {
                                        case 'email': sendMessage(i.notificationMode, i.doc_email, doctext); break;
                                        case 'sms': sendMessage(i.notificationMode, i.doc_mobile, doctext); break;
                                        case 'push': sendMessage(i.notificationMode, i.doc_device, doctext); break;
                                    }
                                    cb(null, 'doctors notification was sent');
                                }
                                else cb (null, 'omitting sending doctor notification!')
                            }
                        ],
                        function (err, res){
                            con.release();
                            if (err) {
                                console.log('ERROR while sending or storing notification!')
                                console.log(err);
                            }
                            //else console.log(res)
                        });
                }
                else con.release();
            });
        });
    });

    this.on('oneDayInactiveAnalyzes', function() {
        db.getConnection(function(err, connection) {
            var date = new Date();
            var startDate = new Date();
            startDate.setMinutes(date.getMinutes() - 15);
            var endDate = new Date();
            endDate.setMinutes(date.getMinutes() + 15);
            var startTime = startDate.getHours() + ':' + (startDate.getMinutes()) + ':' + '00';
            var endTime = endDate.getHours() + ':' + (endDate.getMinutes()) + ':' + '00';
            connection.query("SELECT a.notificationMode, a.notificationEnabled, a.accountId, a.email, a.reminderTime, a.mobile, p.firstName, p.lastName, pdev.deviceId as patient_device, pdev.modified as modified " +
                "FROM accounts a left join devices pdev on (a.accountId = pdev.accountId), patients p " +
                "WHERE a.accountId = p.patientId  and a.notificationEnabled = 1 and a.reminderTime>=? and a.reminderTime <=? AND " +
                "a.accountId in (SELECT distinct d.patientId from dailyReports d where d.patientId not in (SELECT distinct b.patientId from dailyReports b where DATE(b.date) = DATE(now())) and d.patientId  in (SELECT distinct a.patientId from dailyReports a where DATE(a.date) >= DATE(now() - interval 1 day))) ORDER BY modified DESC;",
                [startTime, endTime], function (err, result) {
                    for (var i = 0; i < result.length; i++) {
                        var r = result[i];
                        var patient_name = r.firstName + ' ' + r.lastName;
                        var message = 'Dear ' + patient_name + ', Please insert a daily Report.';
                        connection.query('INSERT INTO notifications (accountId, date, type, subjectsAccount, message) values (?, ?, 0, ?, ?)', [r.accountId, date, null, message]);
                        if (r.notificationEnabled) {
                            switch (r.notificationMode) {
                                case 'email': sendMessage(r.notificationMode, r.email, message); break;
                                case 'sms': sendMessage(r.notificationMode, r.mobile, message); break;
                                case 'push': sendMessage(r.notificationMode, r.patient_device, message); break;
                            }
                        }
                    }
                    connection.release();
                });
        });
    });

    this.on('nDayInactiveAnalyzes', function(n) {
        var date = new Date();
        var startDate = new Date();
        startDate.setMinutes(date.getMinutes() - 15);
        var endDate = new Date();
        endDate.setMinutes(date.getMinutes() + 15);
        var startTime = startDate.getHours() + ':' + (startDate.getMinutes()) + ':' + '00';
        var endTime = endDate.getHours() + ':' + (endDate.getMinutes()) + ':' + '00';
        db.getConnection(function(err, connection) {
            connection.query("SELECT a.accountId, a.notificationMode, a.notificationEnabled, a.email, a.reminderTime, a.mobile, dev.deviceId, p.firstName, p.lastName, p.patientId " +
                "FROM accounts a left join devices dev on (a.accountId = dev.accountId), patients p "+
                "WHERE a.accountId = p.doctorId  and a.role = 'doctor' and  a.reminderTime>=? and a.reminderTime <=? AND " +
                "p.patientId in (SELECT distinct d.patientId from dailyReports d where d.patientId in (SELECT distinct b.patientId from dailyReports b) and d.patientId not in (SELECT distinct a.patientId from dailyReports a where DATE(a.date) >= DATE(now() - interval ? day))) ORDER BY a.accountId DESC;",
                [startTime, endTime, n], function (err, result) {
                    var docs = {};
                    for (var i = 0; i < result.length; i++) {
                        var r = result[i];
                        var patient_name = r.firstName + ' ' + r.lastName;
                        var m = 'Your patient ' + patient_name + ' has not filled in a report for more than ' + n + ' Days.';
                        connection.query('INSERT INTO notifications (accountId, date, type, subjectsAccount, message) values (?, ?, 0, ?, ?)', [r.accountId, date, r.patientId, m]);
                        if (docs[r.accountId]) {
                            docs[r.accountId].ctr += 1;
                        }
                        else {
                            docs[r.accountId] = {};
                            docs[r.accountId].ctr = 1;
                            docs[r.accountId].notificationEnabled = r.notificationEnabled;
                            docs[r.accountId].notificationMode = r.notificationMode;
                            docs[r.accountId].destination = {};
                            switch (r.notificationMode) {
                                case 'email':
                                    docs[r.accountId].destination = r.email;
                                    break;
                                case 'sms':
                                    docs[r.accountId].destination = r.mobile;
                                    break;
                                case 'push':
                                    docs[r.accountId].destination = r.deviceId;
                                    break;
                            }
                        }
                    }
                    for (var doc in docs) {
                        var d = docs[doc];
                        if (d.notificationEnabled) {
                            var message = d.ctr + ' of your patients havent filled in a report for more than ' + n + ' days!';
                            sendMessage(d.notificationMode, d.destination, message);
                        }
                    }
                    connection.release();
                });
        });
        db.getConnection(function(err, connection) {
            connection.query("SELECT a.notificationMode, a.notificationEnabled, a.accountId, a.email, a.reminderTime, a.mobile, p.firstName, p.lastName, pdev.deviceId as patient_device, pdev.modified as modified " +
                "FROM accounts a left join devices pdev on (a.accountId = pdev.accountId), patients p " +
                "WHERE a.accountId = p.patientId  and a.notificationEnabled = 1  and a.reminderTime>=? and a.reminderTime <=? AND " +
                "a.accountId in (SELECT distinct d.patientId from dailyReports d where d.patientId in (SELECT distinct b.patientId from dailyReports b) and d.patientId not in (SELECT distinct a.patientId from dailyReports a where DATE(a.date) >= DATE(now() - interval ? day))) ORDER BY modified DESC;",
                [startTime, endTime, n], function (err, result) {
                    for (var i = 0; i < result.length; i++) {
                        var r = result[i];
                        var patient_name = r.firstName + ' ' + r.lastName;
                        var message = 'Dear ' + patient_name + ', You have not filled in a report for more than ' + n + ' Days. Please do so now.';
                        connection.query('INSERT INTO notifications (accountId, date, type, subjectsAccount, message) values (?, ?, 0, ?, ?)', [r.accountId, date, null, message]);
                        if (r.notificationEnabled) {
                            switch (r.notificationMode) {
                                case 'email':
                                    sendMessage(r.notificationMode, r.email, message);
                                    break;
                                case 'sms':
                                    sendMessage(r.notificationMode, r.mobile, message);
                                    break;
                                case 'push':
                                    sendMessage(r.notificationMode, r.patient_device, message);
                                    break;
                            }
                        }
                    }
                    connection.release();
                });
        });
    });

    this.on('goldAnalyzes', function(id) {
        return;
        var postOptions = {
            host: service.host,
            port: '80',
            method: 'POST',
            headers: {
                Authorization: service.apiKey
            }
        };
        db.getConnection(function(err, con) {
            con.query('SELECT goldAnalyzes(?) as new, notificationMode, email, mobile, deviceId from accounts left join devices on accounts.accountId=devices.accountId where accounts.accountId=?;',
                [id, id], function (err, result) {
                    con.release();
                    var r = result[0];
                    if (r == null) {
                        return;
                    } else {
                        var message = 'The severity of your illness changed to ' + r['new'];
                        switch (r.notificationMode) {
                            case 'email':
                                sendMessage(r.notificationMode, r.email, message);
                                break;
                            case 'sms':
                                sendMessage(r.notificationMode, r.mobile, message);
                                break;
                            case 'push':
                                sendMessage(r.notificationMode, r.patient_device, message);
                                break;
                        }
                    }
                });
        });
    });
};

// extend the EventEmitter class using our Radio class
util.inherits(DailyAnalyzer, EventEmitter);

// we specify that this module is a refrence to the Radio class
module.exports = DailyAnalyzer;

function sendMessage(mode, destination, message){
    var debug = require('../config.js').debug;
    if (service.apiKey.length > 1) {
        var opts = {
            host: postOptions.host,
            port: postOptions.port,
            method: postOptions.method,
            headers: postOptions.headers
        };
        var msg = {
            'message': message
        };
        switch (mode) {
            case 'email':
                msg.to = [];
                msg.to[0] = destination;
                msg.subject = service.email.subject;
                opts.path = service.email.url;
                break;
            case 'sms':
                msg.receivers = [];
                msg.receivers[0] = destination;
                msg.label = service.sms.label;
                opts.path = service.sms.url;
                break;
            case 'push':
                msg.arns = [];
                msg.arns[0] = destination;
                opts.path = service.push.url;
                break;
        }
        var payload = JSON.stringify(msg);
        opts.headers['Content-Length'] = payload.length;


        var request = http.request(opts, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (data) {
                if (debug) console.log(mode + ': '+ data);
            });
            res.on('error', function (err, data){
                if (debug) console.log(mode + ': '+ data);
            });
        });
        request.write(payload);
        request.end();
    }
    if (debug) console.log ("Sent Message to " + destination + " ("+ mode+"): " + message);
};