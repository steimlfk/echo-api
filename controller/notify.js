/**
 * Created by steimlfk on 05.03.15.
 */
var db = require('../utils.js').db;
var http = require('http');
var async = require('async');
var querystring = require('querystring');


var util = require('util');
var EventEmitter = require('events').EventEmitter;

// @station - an object with `freq` and `name` properties
var DailyAnalyzer = function() {

    // we need to store the reference of `this` to `self`, so that we can use the current context in the setTimeout (or any callback) functions
    // using `this` in the setTimeout functions will refer to those functions, not the Radio class
    var self = this;

    // EventEmitters inherit a single event listener, see it in action
    this.on('newDailyReport', function(id) {
        var postOptions = {
            host: require('../config.js').notificationHost,
            port: '80',
            method: 'POST',
            headers: {
                Authorization: require('../config.js').api
            }
        };
        console.log('catch');
            db.query('SELECT * FROM accounts a inner join dailyReports d on a.accountId = d.patientId left join devices on a.accountId=devices.accountId where d.recordId = ?', id, function(err, result) {
                var event = '';
                if (result[0].q3a == 1 || result[0].q3b == 1 || (result[0].q1 == 1 && result[0].q2 == 1 && result[0].q3 == 1)) {
                    event = '1';
                }
                if (result[0].q3c == 1) {
                    event = '2';
                }
                if (result[0].notificationEnabled == 1 && event != '') {
                    var addresses = [];
                    switch (result[0].notificationMode) {
                        case 'email':
                            addresses[0] = result[0].email;
                            postOptions.path = '/echo/email';
                            break;
                        case 'sms':
                            addresses[0] = result[0].mobile;
                            postOptions.path = '/echo/sms';
                            break;
                        case 'push':
                            addresses[0] = result[0].deviceId;
                            postOptions.path = '/echo/sns';
                            break;
                    }
                    var data = JSON.stringify({
                        'subject': 'This is an ECHO Notification',
                        'message': 'You are dead.',
                        'to': addresses,
                        'label': 'ECHO',
                        'arns': addresses,
                        'receivers': addresses
                    });

                    switch (event) {
                        case '1':
                            var data = JSON.stringify({
                                'subject': 'This is an ECHO Notification',
                                'message': 'Call your doctor.',
                                'to': addresses,
                                'label': 'ECHO',
                                'arns': addresses,
                                'receivers': addresses
                            });
                            break;

                        case '2':
                            var data = JSON.stringify({
                                'subject': 'This is an ECHO Notification',
                                'message': 'Go to the hospital.',
                                'to': addresses,
                                'label': 'ECHO',
                                'arns': addresses,
                                'receivers': addresses
                            });
                            break;
                    }

                    postOptions.headers['Content-Length'] = data.length;
                    postOptions.headers['Content-Type'] = 'application/json';


                    var request = http.request(postOptions, function (res) {
                        res.setEncoding('utf8');
                        res.on('data', function (data) {
                            console.log(data);
                        })
                    });

                    request.write(data);
                    request.end();
                    console.log('E Mail was sent');
                }
            });


    });

    // For sending notifications to persons who have answered the question q1 with yes two days in a row.
    this.on('twoDayAnalyzes', function(id) {
        var postOptions = {
            host: '',
            port: '80',
            method: 'POST',
            headers: {
                Authorization: require('../config.js').api
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
        var postOptions = {
            host: '',
            port: '80',
            method: 'POST',
            headers: {
                Authorization: require('../config.js').api
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
        var postOptions = {
            host: '',
            port: '80',
            method: 'POST',
            headers: {
                Authorization: require('../config.js').api
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