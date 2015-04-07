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
        var qry = 'SELECT a.notificationMode, a.notificationEnabled, a.accountId, a.email, a.mobile, ' +
            'd.recordId, d.q1, d.q2, d.q3, d.q4, d.q5, d.q1a, d.q1b, d.q1c, d.q3a, d.q3b, d.q3c, ' +
            'p.firstName, p.lastName,' +
            'doc.notificationMode AS doc_mode, doc.notificationEnabled as doc_enabled, doc.accountId as doc_id, doc.email as doc_mail, doc.mobile AS doc_mobile ' +
            'FROM accounts a, dailyReports d, patients p, accounts doc '+
            'WHERE d.recordId = ? '+
            'AND a.accountId = d.patientId AND a.accountId = p.patientId AND p.doctorId = doc.accountId;';
        db.query(qry, id, function(err, result) {
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
             1) Two days in a row Q1 „yes“ 				-> Notification: Call your doctor!
             2) Q1, Q2 and Q3 answered with „yes“ 			-> Notification: Call your doctor!
             3) Q3a or Q3b answered with „yes“ 			-> Notification: Call your doctor!
             4) Q3c answered with yes 					-> Notification: Go to the hospital!
             5) Two days in a row Q5 „yes“ 				-> Notification: Call your doctor!
             6) Questions not answered for 2 or 10 days 		-> Notification: Fill in your daily Report!
             */
            if (result[0].q1 == 1 && result[0].q2 == 1 && result[0].q3 == 1){
                type = 1;
                rule = 2;
            }
            if (result[0].q3a == 1 || result[0].q3b == 1) {
                type = '1';
                rule = 3;
            }
            if (result[0].q3c == 1) {
                rule = 4;
                type = '2';
            }

            if (type > 0){
                var notificationqry = 'INSERT INTO notifications (accountId, date, type, subjectsAccount) VALUES (?, now(), ? ,?)';
                var i = result[0];
                async.parallel([
                        function(cb) {
                            // patients notification
                            db.query(notificationqry, [i.accountId, type, null], cb);
                        },
                        function(cb) {
                            // doctors notification
                            db.query(notificationqry, [i.doc_id, type+2, i.accountId], cb);
                        },
                        function(cb){
                            // patients notification
                            if (service.apiKey.length > 1){
                                var opts = {
                                    host : postOptions.host,
                                    port : postOptions.port,
                                    method : postOptions.method,
                                    headers : postOptions.headers
                                };
                                var msgtext = (type == 1)? 'Please call your doctor! (' + i.doc_mobile + ')' : 'Go to the Hospital!';
                                var msg = {
                                    'subject': 'ECHO Notification',
                                    'message': msgtext
                                };

                                switch (i.notificationMode) {
                                    case 'email':
                                        msg.to = [];
                                        msg.to[0] = i.email;
                                        opts.path = '/echo/email';
                                        break;
                                    case 'sms':
                                        msg.receivers = [];
                                        msg.reveivers[0] = i.mobile;
                                        msg.label ='ECHO';
                                        opts.path = '/echo/sms';
                                        break;
                                    case 'push':
                                        msg[0].arns = '';
                                        opts.path = '/echo/sns';
                                        break;
                                }
                                var payload = JSON.stringify(msg);
                                opts.headers['Content-Length'] = payload.length;


                                var request = http.request(opts, function (res) {
                                    res.setEncoding('utf8');
                                    res.on('data', function (data) {
                                        console.log(data);
                                    })
                                });
                                request.write(data);
                                request.end();
                                cb('patients notification was sent');
                            }
                            else cb ('omitting sending patients notification!')
                        },
                        function(cb){
                            // doctors notification
                            if (service.apiKey.length > 1){

                                var opts = {
                                    host : postOptions.host,
                                    port : postOptions.port,
                                    method : postOptions.method,
                                    headers : postOptions.headers
                                };
                                var patient_name = i.firstName + ' ' + i.lastName;
                                var msgtext = (type == 1)? 'Your patient ' + patient_name + ' should call you!' : 'Your patient ' + patient_name + ' should go to the hospital';
                                var msg = {
                                    'subject': 'ECHO Notification',
                                    'message': msgtext
                                };

                                switch (i.notificationMode) {
                                    case 'email':
                                        msg.to[0] = i.doc_email;
                                        opts.path = '/echo/email';
                                        break;
                                    case 'sms':
                                        msg.reveivers[0] = i.doc_mobile;
                                        msg.label ='ECHO';
                                        opts.path = '/echo/sms';
                                        break;
                                    case 'push':
                                        msg[0].arns = '';
                                        opts.path = '/echo/sns';
                                        break;
                                }
                                var payload = JSON.stringify(msg);
                                opts.headers['Content-Length'] = payload.length;


                                var request = http.request(opts, function (res) {
                                    res.setEncoding('utf8');
                                    res.on('data', function (data) {
                                        console.log(data);
                                    })
                                });
                                request.write(data);
                                request.end();
                                cb('doctors notification was sent');
                            }
                            else cb ('omitting sending patients notification!')
                        }
                    ],
                    function (err, res){
                        if (err) {
                            console.log('ERROR while sending or storing notification!')
                            console.log(err);
                        }
                    });
            }
        });
    });


    // For sending notifications to persons who have answered the question q1 with yes two days in a row.
    this.on('twoDayAnalyzes', function(id) {
        return;
        if (service.apiKey.length < 2) return;
        var postOptions = {
            host: service.host,
            port: '80',
            method: 'POST',
            headers: {
                Authorization: service.apiKey
            }
        };
        db.query('SELECT a.accountId, notificationEnabled, email, mobile, deviceId from accounts a ' +
            'inner join devices on a.accountId=devices.accountId where twoDayAnalyzes(a.accountId)=1 and notificationEnabled=1 and a.accountId=?;',
            id, function (err, result) {
                var email = [],
                    mobile = [],
                    push = [];
                for (var r in result) {
                    switch (r.notificationMode) {
                        case 'email':
                            email[email.length] = r.email;
                            break;

                        case 'sms':
                            mobile[mobile.length] = r.mobile;
                            break;

                        case 'push':
                            push[push.length] = r.deviceId;
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