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
                    var doctext = (type == 1)? "Your patient ' + patient_name + ' should call you! \n" : "Your patient " + patient_name + " should go to the hospital.\n";
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
                                db.query(notificationqry, [i.accountId, type, null, pattext], cb);
                            },
                            function(cb) {
                                // doctors notification
                                db.query(notificationqry, [i.doc_id, type+2, i.accountId, doctext], cb);
                            },
                            function(cb){
                                // patients notification
                                if (service.apiKey.length > 1 && i.notificationEnabled){
                                    var opts = {
                                        host : postOptions.host,
                                        port : postOptions.port,
                                        method : postOptions.method,
                                        headers : postOptions.headers
                                    };
                                    var msg = {
                                        'message': pattext
                                    };
                                    switch (i.notificationMode) {
                                        case 'email':
                                            msg.to = [];
                                            msg.to[0] = i.email;
                                            msg.subject = service.email.subject;
                                            opts.path = service.email.url;
                                            break;
                                        case 'sms':
                                            msg.receivers = [];
                                            msg.reveivers[0] = i.mobile;
                                            msg.label = service.sms.label;
                                            opts.path = service.sms.url;
                                            break;
                                        case 'push':
                                            msg.arns = [];
                                            msg.arns[0] = i.patient_device;
                                            opts.path = service.push.url;
                                            break;
                                    }
                                    var payload = JSON.stringify(msg);
                                    opts.headers['Content-Length'] = payload.length;


                                    var request = http.request(opts, function (res) {
                                        res.setEncoding('utf8');
                                        res.on('data', function (data) {
                                            //console.log(i.notificationMode + ': '+ data);
                                        })
                                    });
                                    request.write(payload);
                                    request.end();
                                    cb(null, 'patients notification was sent');
                                }
                                else cb (null, 'omitting sending patients notification!')
                            },
                            function(cb){
                                // doctors notification
                                if (service.apiKey.length > 1 && i.doc_enabled){

                                    var opts = {
                                        host : postOptions.host,
                                        port : postOptions.port,
                                        method : postOptions.method,
                                        headers : postOptions.headers
                                    };
                                    var msg = {
                                        'message': doctext
                                    };

                                    switch (i.doc_mode) {
                                        case 'email':
                                            msg.to = [];
                                            msg.to[0] = i.doc_email;
                                            msg.subject = service.email.subject;
                                            opts.path = service.email.url;
                                            break;
                                        case 'sms':
                                            msg.receivers = [];
                                            msg.reveivers[0] = i.doc_mobile;
                                            msg.label = service.sms.label;
                                            opts.path = service.sms.url;
                                            break;
                                        case 'push':
                                            msg.arns = [];
                                            msg.arns[0] = i.doc_device;
                                            opts.path = service.push.url;
                                            break;
                                    }
                                    var payload = JSON.stringify(msg);
                                    opts.headers['Content-Length'] = payload.length;


                                    var request = http.request(opts, function (res) {
                                        res.setEncoding('utf8');
                                        res.on('data', function (data) {
                                            //console.log(i.doc_mode + ': ' + data);
                                        })
                                    });
                                    request.write(payload);
                                    request.end();
                                    cb(null, 'doctors notification was sent');
                                }
                                else cb (null, 'omitting sending doctor notification!')
                            }
                        ],
                        function (err, res){
                            if (err) {
                                console.log('ERROR while sending or storing notification!')
                                console.log(err);
                            }
                            //else console.log(res)
                        });
                }
            });
            con.release();
        });
    });

    this.on('inactiveAnalyzes', function() {
        return;
        var postOptions = {
            host: service.host,
            port: '80',
            method: 'POST',
            headers: {
                Authorization: service.apiKey
            }
        };
        db.getConnection(function(err, connection) {
            var date = new Date();
            var startTime = date.getHours() + ':' + (date.getMinutes() - 15) + ':' + '00';
            var endTime = date.getHours() + ':' + (date.getMinutes()) + ':' + '00';
            connection.query('SELECT a.accountId, notificationEnabled, email, mobile, deviceId from accounts a ' +
                'inner join devices on a.accountId=devices.accountId ' +
                'inner join dailyReports d on a.accountId=patientId where d.date < (now() - interval 2 day) and reminderTime>=? and reminderTime <=? and notificationEnabled=1 group by a.accountId;',
                [startTime, endTime], function (err, result) {
                    connection.release();
                    var email = [],
                        mobile = [],
                        push = [];
                    for (var r in result) {
                        switch (r.notificationMode) {
                            case 'email':
                                email[email.length] = r.email;
                                postOptions.path = '/echo/email';
                                break;

                            case 'sms':
                                mobile[mobile.length] = r.mobile;
                                postOptions.path = '/echo/sms';
                                break;

                            case 'push':
                                push[push.length] = r.deviceId;
                                postOptions.path = '/echo/sns';
                                break;
                        }
                    }
                    var data = JSON.stringify({
                        'subject': 'This is an ECHO Notification',
                        'message': 'You are dead.',
                        'to': email,
                        'label': 'ECHO',
                        'arns': push,
                        'receivers': mobile
                    });
                    postOptions.path = '/echo/sns';
                    var request = http.request(postOptions, function (res) {
                        res.setEncoding('utf8');
                        res.on('data', function (data) {
                            console.log(data);
                        })
                    });
                    request.write(data);
                    request.end();
                    postOptions.path = '/echo/sms';
                    var request = http.request(postOptions, function (res) {
                        res.setEncoding('utf8');
                        res.on('data', function (data) {
                            console.log(data);
                        })
                    });
                    request.write(data);
                    request.end();
                    postOptions.path = '/echo/email';
                    var request = http.request(postOptions, function (res) {
                        res.setEncoding('utf8');
                        res.on('data', function (data) {
                            console.log(data);
                        })
                    });
                    request.write(data);
                    request.end();
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
        db.query('SELECT goldAnalyzes(?) as new, notificationMode, email, mobile, deviceId from accounts left join devices on accounts.accountId=devices.accountId where accounts.accountId=?;',
            [id, id], function (err, result) {
                var r = result[0];
                if (r == null) {
                    return;
                } else {
                    switch (r.notificationMode) {
                        case 'email':
                            postOptions.path = '/echo/email';
                            var data = JSON.stringify({
                                'subject': '',
                                'message': 'You are dead.',
                                'to': [r.email],
                                'label': 'ECHO'
                            });
                            break;

                        case 'sms':
                            postOptions.path = '/echo/sms';
                            var data = JSON.stringify({
                                'subject': 'This is an ECHO Notification',
                                'message': 'You are dead.',
                                'label': 'ECHO',
                                'receivers': r.mobile
                            });
                            break;

                        case 'push':
                            postOptions.path = '/echo/sns';
                            var data = JSON.stringify({
                                'subject': 'This is an ECHO Notification',
                                'message': 'You are dead.',
                                'label': 'ECHO',
                                'arns': r.deviceId
                            });
                            break;
                    }

                    data.subject = 'The severity changed.';
                    data.message = 'The severity of your illness changed to ' + r['new'];

                    var request = http.request(postOptions, function (res) {
                        res.setEncoding('utf8');
                        res.on('data', function (data) {
                            console.log(data);
                        })
                    });
                    request.write(data);
                    request.end();
                }
            });
    });
};

// extend the EventEmitter class using our Radio class
util.inherits(DailyAnalyzer, EventEmitter);

// we specify that this module is a refrence to the Radio class
module.exports = DailyAnalyzer;