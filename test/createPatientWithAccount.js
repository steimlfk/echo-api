/**
 * Created by steimlfk on 11.03.15.
 */
/**
 * Mocha Tests for Accounts...
 * Created by steimlfk on 05.12.14.
 *
 * TODO activate/deactivate
 */


var should = require('should');
var assert = require('assert');
var request = require('supertest');
var async = require('async');


var config = require('./config.js');
var data = require('./testdata/createPatientWithAccount.js');

describe('CreatePatientWithAccount Tests:', function() {
    // Config Vars
    var url = config.url;
    var admin_username = config.admin_username;
    var admin_pwd = config.admin_pwd;

    // Internal vars for testing
    var access_token_global = null;
    var doc_url = null;
    var doc_id = 0;
    var pat_url = null;
    // within before() you can run all the operations that are needed to setup your tests.
    // We need to login with an admin Account to run these Tests. When I'm done, I call done().
    before('Logging in as Admin', function(done) {
        //before:Logging in as Admin...
        var creds =  {
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

                        res.body.should.have.property('access_token');
                        res.body.should.have.property('role');
                        res.body.role.should.equal('admin');
                        access_token_global = res.body.access_token;
                        cb (null, res);
                    });
            },
            function(cb){
                request(url)
                    .post('/accounts')
                    .set('Authorization', 'Bearer ' + access_token_global)
                    .send(data.init.newDAcc)
                    .expect(201)
                    .end(function(err, res) {
                        if (err) {
                            cb (err);
                        }
                        doc_url = res.headers.location;
                        doc_id = parseInt(doc_url.split("/").pop());
                        cb (null, res);
                    });
            }

        ], function(err, res){
            if (err) throw err;
            done();
        });

    });


    describe('Testing Functions as Admin (doctorId set to created doctor):', function() {
        var pat_url = null;
        it('Creating Patient with Account', function(done) {
            var tmp = data.admin.newData;
            tmp.patient.doctorId = doc_id;
            request(url)
                .post('/createPatientAndAccount')
                .set('Authorization', 'Bearer ' + access_token_global)
                .send(tmp)
                .expect(201)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    pat_url = res.headers.location;
                    done();
                });
        });

        after('Admin Cleaning Up...', function(done){
            var patAccURL = '/accounts/'+pat_url.split("/").pop();
            async.series([
                function (cb) {
                    request(url)
                        .del(pat_url)
                        .set('Authorization', 'Bearer ' + access_token_global)
                        .expect(204)
                        .end(function(err, res) {
                            if (err) {
                                cb(err);
                            }
                            cb(null, res);
                        });
                },
                function (cb) {
                    request(url)
                        .del(patAccURL)
                        .set('Authorization', 'Bearer ' + access_token_global)
                        .expect(204)
                        .end(function(err, res) {
                            if (err) {
                                cb(err);
                            }
                            cb(null, res);
                        });
                }
            ], function(err, res){
                if (err) throw err;
                done();
            });
        });
    });

    describe('Testing Functions as Doctor:', function() {
        var access_token = null;
        before('Logging in with newly created Doctor-Account', function(done) {
            var creds =  {
                username: data.init.newDAcc.username,
                password: data.init.newDAcc.password,
                grant_type: 'password'
            };

            request(url)
                .post('/login')
                .send(creds)
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('access_token');
                    res.body.should.have.property('role');
                    res.body.should.have.property('accountId');
                    res.body.role.should.equal('doctor');
                    access_token = res.body.access_token;
                    done();
                });

        });


        it('Creating Patient with Account (doctorId set to 0)', function(done) {
            var tmp = data.admin.newData;
            tmp.patient.doctorId = 0;
            request(url)
                .post('/createPatientAndAccount')
                .set('Authorization', 'Bearer ' + access_token)
                .send(tmp)
                .expect(201)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    pat_url = res.headers.location;
                    pat_id = parseInt(pat_url.split("/").pop());
                    done();
                });
        });

    });

    describe('Testing Functions as Patient:', function() {
        var access_token = null;
        before('Logging in with newly created Patient-Account', function (done) {
            var creds = {
                username: data.doctor.newData.account.username,
                password: data.doctor.newData.account.password,
                grant_type: 'password'
            };

            request(url)
                .post('/login')
                .send(creds)
                .expect(200)
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

        it('Creating Patient with Account fails', function(done) {
            request(url)
                .post('/createPatientAndAccount')
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.admin.newData)
                .expect(403)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    done();
                });
        });


    });

    after('Cleaning Up...', function(done){
        var patAccURL = '/accounts/'+pat_url.split("/").pop();
        async.series([
            function (cb) {
                request(url)
                    .del(pat_url)
                    .set('Authorization', 'Bearer ' + access_token_global)
                    .expect(204)
                    .end(function(err, res) {
                        if (err) {
                            cb(err);
                        }
                        cb(null, res);
                    });
            },
            function (cb) {
                request(url)
                    .del(patAccURL)
                    .set('Authorization', 'Bearer ' + access_token_global)
                    .expect(204)
                    .end(function(err, res) {
                        if (err) {
                            cb(err);
                        }
                        cb(null, res);
                    });
            },
            function (cb) {
                request(url)
                    .del(doc_url)
                    .set('Authorization', 'Bearer ' + access_token_global)
                    .expect(204)
                    .end(function(err, res) {
                        if (err) {
                            cb(err);
                        }
                        cb(null, res);
                    });
            }

        ], function(err, res){
            if (err) throw err;
            done();
        });

    });
});