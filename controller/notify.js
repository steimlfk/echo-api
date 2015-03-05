/**
 * Created by steimlfk on 05.03.15.
 */
var mysql = require('../config/mysql');
var config = require('../config/config');
var db = mysql.db;
var http = require('http');
var async = require('async');
var querystring = require('querystring');


var util = require('util');
var EventEmitter = require('events').EventEmitter;

// @station - an object with `freq` and `name` properties
var DailyAnalyzer = function() {

    // we need to store the reference of `this` to `self`, so that we can use the current context in the setTimeout (or any callback) functions
    // using `this` in the setTimeout functions will refer to those funtions, not the Radio class
    var self = this;

    // EventEmitters inherit a single event listener, see it in action
    this.on('newDailyReport', function(id) {
        var postOptions = {
            host: '',
            port: '80',
            method: 'POST',
            headers: {
                Authorization: ''
            }
        };
        console.log('catch');

        db.getConnection(function(err, connection) {
            connection.query('SELECT * FROM accounts a, dailyReports d where a.accountId = d.patientId and d.recordId = ?', id, function(err, result) {
                console.log(result)
                if (result.notificationEnabled){
                    if (result.notificationMode == 'email'){
                        postOptions.path = '/echo/email';

                        var data = querystring.stringify({
                            'subject' : 'This is an ECHO Notification',
                            'message' : 'You are dead.',
                            'to' : result.email

                        });

                        postOptions.headers['Content-Length'] =  Buffer.byteLength(data);
                        postOptions.headers['Content-Type'] =  'application/x-www-form-urlencoded';


                        var request = http.request(postOptions, function(res) {
                            res.setEncoding('utf8');
                            res.on('data', function(data) {
                                console.log(data);
                            })
                        });

                        request.write(data);
                        request.end();
                        console.log('E Mail was sent');
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