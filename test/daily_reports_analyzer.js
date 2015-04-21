/**
 * Mocha Tests for Daily Reports...
 * Created by steimlfk on 7.1.15.
 */

var should = require('should');
var assert = require('assert');
var request = require('supertest');
var async = require('async');

var config = require('./config.js');
var data = require('./testdata/daily_reports.js');

var doc_mail = '';
var pat_mail = '';

for (var index in process.argv) {
    var str = process.argv[index];
    if (str.indexOf("--pmail") == 0) {
        pat_mail = str.substr(8);
    }
    if (str.indexOf("--dmail") == 0) {
        doc_mail = str.substr(8);
    }
}

function getEmptyRecord(){
    var tmp = data.doctor.newDaily;
    tmp.q1 = false;
    tmp.q2 = false;
    tmp.q3 = false;
    tmp.q4 = false;
    tmp.q5 = false;
    tmp.q1a = false;
    tmp.q1b = false;
    tmp.q1c = false;
    tmp.q3a = false;
    tmp.q3b = false;
    tmp.q3c = false;
    return tmp;
}

var doc_en = (doc_mail.length > 0)? true:false;
var pat_en = (pat_mail.length > 0)? true:false;

describe('Daily Reports Analyzer Tests:', function() {
    // Config Vars
    var url = config.url;
    var admin_username = config.admin_username;
    var admin_pwd = config.admin_pwd;

    // Internal vars for testing
    var access_token_admin = null;
    var access_token_doc = null;
    var doc_url = null;
    var pat_url = null;
    var patData_url = null;
    var pat_id = 0;
    // within before() you can run all the operations that are needed to setup your tests.
    // We need to login with an admin Account to run these Tests. When I'm done, I call done().
    before('Logging in as Admin and creating Accounts', function (done) {
        var creds = {
            username: admin_username,
            password: admin_pwd,
            grant_type: 'password'
        };

        async.series([
            function(cb){
                request(url)
                    .post('/login')
                    .send(creds)
                    .expect(200)
                    // end handles the response
                    .end(function (err, res) {
                        if (err) {
                            cb (err);
                        }
                        res.body.should.have.property('role');
                        res.body.role.should.equal('admin');
                        access_token_admin = res.body.access_token;
                        cb (null, res);
                    });
            },
            function(cb){
                var tmp = data.init.newDAcc;
                tmp.notificationEnabled = doc_en;
                tmp.notificationMode = 'email';
                tmp.email = (doc_en)? doc_mail : 'doc@some.url';
                request(url)
                    .post('/accounts')
                    .set('Authorization', 'Bearer ' + access_token_admin)
                    .send(data.init.newDAcc)
                    .expect(201)
                    .end(function(err, res) {
                        if (err) {
                            cb (err);
                        }
                        doc_url = res.headers.location;
                        cb (null, res);
                    });
            },
            function(cb){
                var tmp = data.init.newPAcc;
                tmp.notificationEnabled = pat_en;
                tmp.notificationMode = 'email';
                tmp.email = (pat_en)? pat_mail : 'pat@some.url';
                request(url)
                    .post('/accounts')
                    .set('Authorization', 'Bearer ' + access_token_admin)
                    .send(tmp)
                    .expect(201)
                    .end(function(err, res) {
                        if (err) {
                            cb (err);
                        }
                        pat_url = res.headers.location;
                        pat_id = parseInt(pat_url.split("/").pop());
                        cb (null, res);
                    });

            },
            function(cb){
                var doc_creds = creds;
                doc_creds.username = data.init.newDAcc.username;
                doc_creds.password = data.init.newDAcc.password;
                request(url)
                    .post('/login')
                    .send(doc_creds)
                    .expect(200)
                    // end handles the response
                    .end(function (err, res) {
                        if (err) {
                            cb (err);
                        }
                        res.body.should.have.property('role');
                        res.body.role.should.equal('doctor');
                        access_token_doc = res.body.access_token;
                        cb (null, res);
                    });
            },
            function(cb){
                var tmp = data.init.newPatData;
                tmp.accountId = pat_id;
                request(url)
                    .post('/patients')
                    .set('Authorization', 'Bearer ' + access_token_doc)
                    .send(tmp)
                    .expect(201)
                    // end handles the response
                    .end(function (err, res) {
                        if (err) {
                            cb (err);
                        }
                        patData_url = res.headers.location;
                        cb (null, res);
                    });
            }

        ], function(err, res){
            if (err) throw err;
            done();
        });



    });

    describe('Creating Daily Reports as Patient:', function() {
        var access_token = null;
        var creds = {
            username: data.init.newPAcc.username,
            password: data.init.newPAcc.password,
            grant_type: 'password'
        };
        var ctr = 0;
        before(function(done){
            request(url)
                .post('/login')
                .set('Authorization', 'Bearer ' + access_token)
                .send(creds)
                .expect(200)
                // end handles the response
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('access_token');
                    res.body.should.have.property('role');
                    res.body.role.should.equal('patient');
                    access_token = res.body.access_token;
                    done();
                });
        });

        it('Creating Daily Report for Rule 1 (Two Days in a row Q1=1)', function (done){
            var today = new Date();
            var yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            async.series([
                    function(cb){
                        var tmp = getEmptyRecord();
                        tmp.q1 = true;
                        tmp.date = yesterday.getFullYear() + '-' + parseInt(yesterday.getMonth()+1) + '-' + yesterday.getDate();
                        request(url)
                            .post(patData_url + '/daily_reports')
                            .set('Authorization', 'Bearer ' + access_token)
                            .send (tmp)
                            .expect(201)
                            .end(function (err, res){
                                if (err) cb(err)
                                else cb(null, res.headers.location);
                            });
                    },
                    function (cb) {
                        var tmp = getEmptyRecord();
                        tmp.q1 = true;
                        tmp.date = today.getFullYear() + '-' + parseInt(today.getMonth()+1) + '-' + today.getDate();
                        request(url)
                            .post(patData_url + '/daily_reports')
                            .set('Authorization', 'Bearer ' + access_token)
                            .send (tmp)
                            .expect(201)
                            .end(function (err, res){
                                if (err) cb(err)
                                else cb(null, res.headers.location);
                            });
                    }
                ],
                function(err, res){
                    if (err) throw err
                    else {
                        ctr ++;
                        done();
                    }
            });

        });

        it('Creating Daily Report for Rule 2 (Q1=1,Q2=1,Q3=1)', function (done){
            var tmp = getEmptyRecord();
            tmp.q1 = true;
            tmp.q2 = true;
            tmp.q3 = true;
            request(url)
                .post(patData_url + '/daily_reports')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(201)
                .end(function (err, res){
                    if (err) throw err;
                    ctr++;
                    done();
                });
        });

        it('Creating Daily Report for Rule 3 (Q3a=1)', function (done){
            var tmp = getEmptyRecord();
            tmp.q3a = true;
            request(url)
                .post(patData_url + '/daily_reports')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(201)
                .end(function (err, res){
                    if (err) throw err;
                    ctr++;
                    done();
                });
        });

        it('Creating Daily Report for Rule 3 (Q3b=1)', function (done){
            var tmp = getEmptyRecord();
            tmp.q3b = true;
            request(url)
                .post(patData_url + '/daily_reports')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(201)
                .end(function (err, res){
                    if (err) throw err;
                    ctr++;
                    done();
                });
        });


        it('Creating Daily Report for Rule 4 (Q3c=1)', function (done){
            var tmp = getEmptyRecord();
            tmp.q3c = true;
            request(url)
                .post(patData_url + '/daily_reports')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(201)
                .end(function (err, res){
                    if (err) throw err;
                    ctr++;
                    done();
                });
        });

        it('Creating Daily Report for Rule 5 (Two Days in a row Q1=5)', function (done){
            var today = new Date();
            var yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            async.series([
                    function(cb){
                        var tmp = getEmptyRecord();
                        tmp.q5 = true;
                        tmp.date = yesterday.getFullYear() + '-' + (yesterday.getMonth()+1) + '-' + yesterday.getDate();
                        request(url)
                            .post(patData_url + '/daily_reports')
                            .set('Authorization', 'Bearer ' + access_token)
                            .send (tmp)
                            .expect(201)
                            .end(function (err, res){
                                if (err) cb(err)
                                else cb(null, res.headers.location);
                            });
                    },
                    function (cb) {
                        var tmp = getEmptyRecord();
                        tmp.q5 = true;
                        tmp.date = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();
                        request(url)
                            .post(patData_url + '/daily_reports')
                            .set('Authorization', 'Bearer ' + access_token)
                            .send (tmp)
                            .expect(201)
                            .end(function (err, res){
                                if (err) cb(err)
                                else cb(null, res.headers.location);
                            });
                    }
                ],
                function(err, res){
                    if (err) throw err
                    else {
                        ctr ++;
                        done();
                    }
                });

        });

        it('Verifying Patients Notification Count', function (done){
            request(url)
                .get('/notifications')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function (err, res){
                    if (err) throw err;
                    res.body.should.have.property('notifications');
                    res.body.notifications.length.should.equal(ctr);
                    done();
                });
        });

        it('Verifying Doctors Notification Count', function (done){
            request(url)
                .get('/notifications')
                .set('Authorization', 'Bearer ' + access_token_doc)
                .expect(200)
                .end(function (err, res){
                    if (err) throw err;
                    res.body.should.have.property('notifications');
                    res.body.notifications.length.should.equal(ctr);
                    done();
                });
        });

    });

    after('Cleaning Up...', function(done) {
        async.series
        ([
            function (cb) {
                request(url)
                    .del(patData_url)
                    .set('Authorization', 'Bearer ' + access_token_admin)
                    .expect(204)
                    .end(function (err, res) {
                        if (err) {
                            cb(err);
                        }
                        cb(null, res);
                    });
            },
            function (cb) {
                request(url)
                    .del(pat_url)
                    .set('Authorization', 'Bearer ' + access_token_admin)
                    .expect(204)
                    .end(function (err, res) {
                        if (err) {
                            cb(err);
                        }
                        cb(null, res);
                    });
            },
            function (cb) {
                request(url)
                    .del(doc_url)
                    .set('Authorization', 'Bearer ' + access_token_admin)
                    .expect(204)
                    .end(function (err, res) {
                        if (err) {
                            cb(err);
                        }
                        cb(null, res);
                    });
            }

        ], function (err) {
            if (err) throw err;
            done();
        });
    });

});