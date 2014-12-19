/**
 * Mocha Tests for Patients...
 * Created by steimlfk on 15.12.14.
 */


var should = require('should');
var assert = require('assert');
var request = require('supertest');
var async = require('async');


var config = require('./config.js');
var data = require('./testdata/patients.js');

describe('Patients Tests:', function() {
    // Config Vars
    var url = config.url;
    var admin_username = config.admin_username;
    var admin_pwd = config.admin_pwd;

    // Internal vars for testing
    var access_token = null;
    var doc_url = null;
    var pat_url = null;
    var pat_id = 0;
    var doc_id = 0;
    var admin_id  = 0;
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

                        res.body.should.have.property('access_token');
                        res.body.should.have.property('expires_in');
                        res.body.should.have.property('role');
                        res.body.should.have.property('accountId');
                        res.body.should.have.property('refreshToken');
                        res.body.should.have.property('token_type');
                        res.body.role.should.equal('admin');
                        access_token = res.body.access_token;
                        admin_id = parseInt(res.body.accountId);
                        cb (null, res);
                    });
            },
            function(cb){
                request(url)
                    .post('/accounts')
                    .set('Authorization', 'Bearer ' + access_token)
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
            },
            function(cb){
                request(url)
                    .post('/accounts')
                    .set('Authorization', 'Bearer ' + access_token)
                    .send(data.init.newPAcc)
                    .expect(201)
                    .end(function(err, res) {
                        if (err) {
                            cb (err);
                        }
                        pat_url = res.headers.location;
                        pat_id = parseInt(pat_url.split("/").pop());
                        cb (null, res);
                    });

            }

        ], function(err, res){
            if (err) throw err;
            done();
        });



    });


    describe('Testing Functions as Admin:', function() {
        var access_token = null;
        var pat_url = null;
        var list_length = 0;
        var creds = {
            username: admin_username,
            password: admin_pwd,
            grant_type: 'password'
        };
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
                    res.body.should.have.property('expires_in');
                    res.body.should.have.property('role');
                    res.body.should.have.property('accountId');
                    res.body.should.have.property('refreshToken');
                    res.body.should.have.property('token_type');
                    res.body.role.should.equal('admin');
                    access_token = res.body.access_token;
                    done();
                });
        });

        var validStatusCodeForListOrEmptyList = function(res){
            return !(res.statusCode == 200 || res.statusCode == 204);

        };

        it('Admin can get Data of all patients', function (done){
            request(url)
                .get('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(validStatusCodeForListOrEmptyList)
                .end(function (err, res){
                    if (err) throw err;
                    if (res.statusCode == 200) {
                        res.body.should.have.property('patients');
                        list_length = res.body.patients.length;
                    }
                    else list_length = 0;
                    done();
                });
        });

        it('Admin can create new Patients Data', function (done){
            var tmp = data.admin.newPatData;
            tmp.accountId = pat_id;
            tmp.doctorId = doc_id;
            request(url)
                .post('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(201)
                .end(function (err, res){
                    if (err) throw err;

                    pat_url = res.headers.location;
                    done();
                });
        });

        it('Admin cant create new Patients Data using an AdminId as doctors ID', function (done){
            var tmp = data.admin.newPatDataInvDocID;
            tmp.accountId = pat_id;
            tmp.doctorId = admin_id;
            request(url)
                .post('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(400)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });
        it('Admin cant create new Patients Data using patients Id as doctors ID', function (done){
            var tmp = data.admin.newPatDataInvDocID;
            tmp.accountId = pat_id;
            tmp.doctorId = pat_id;
            request(url)
                .post('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(400)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });

        it('Admin cant create new Patients Data if Social ID is in use', function (done){
            var tmp = data.admin.newPatDataInvSocial;
            tmp.accountId = pat_id;
            tmp.doctorId = doc_id;
            request(url)
                .post('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(400)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });
        it('Admin cant create new Patients Data if File ID is in use', function (done){
            var tmp = data.admin.newPatDataInvFile;
            tmp.accountId = pat_id;
            tmp.doctorId = doc_id;
            request(url)
                .post('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(400)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });




        it('Patientslist should be N+1', function (done){
            request(url)
                .get('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function (err, res){
                    if (err) throw err;
                    res.body.should.have.property('patients');
                    res.body.patients.length.should.equal(list_length+1);

                    done();
                });
        });

        it('Admin can get created Data', function (done){
            request(url)
                .get(pat_url)
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function (err, res){
                    if (err) throw err;

                    res.body.should.have.property('doctorId');
                    res.body.doctorId.should.equal(parseInt(doc_url.split("/").pop()));

                    done();
                });
        });
        it('Admin can delete patients data', function (done){
            request(url)
                .del(pat_url)
                .set('Authorization', 'Bearer ' + access_token)
                .expect(204)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });

        it('Verifying Delete', function (done){
            request(url)
                .get('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(validStatusCodeForListOrEmptyList)
                .end(function (err, res){
                    if (err) throw err;
                    if (res.statusCode == 200) {
                        res.body.should.have.property('patients');
                        res.body.patients.length.should.equal(list_length);
                    }
                    done();
                });
        });

    });

    describe('Testing Functions as Doctor:', function() {
        var access_token = null;
        var pat_url = null;
        var list_length = 0;
        var creds = {
            username: data.init.newDAcc.username,
            password: data.init.newDAcc.password,
            grant_type: 'password'
        };
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
                    res.body.should.have.property('expires_in');
                    res.body.should.have.property('role');
                    res.body.should.have.property('accountId');
                    res.body.should.have.property('refreshToken');
                    res.body.should.have.property('token_type');
                    res.body.role.should.equal('doctor');
                    access_token = res.body.access_token;
                    done();
                });
        });

        var validStatusCodeForListOrEmptyList = function(res){
            return !(res.statusCode == 200 || res.statusCode == 204);

        };

        it('Doctor can get Data of all his patients', function (done){
            request(url)
                .get('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(validStatusCodeForListOrEmptyList)
                .end(function (err, res){
                    if (err) throw err;
                    if (res.statusCode == 200) {
                        res.body.should.have.property('patients');
                        var id = doc_url.split("/").pop();
                        for (var i = 0; i < res.body.patients; i++) {
                            res.body.patients[i].should.have.property('doctorId');
                            res.body.patients[i].doctorId.should.equal(id);
                        }
                        list_length = res.body.patients.length;
                    }
                    else list_length = 0;
                    done();
                });
        });

        it('Doctor can create new Patients Data (doctors id is set arbitrary...should be set to id of logged in doctor)', function (done){
            var tmp = data.doctor.newPatData;
            tmp.accountId = pat_id;
            tmp.doctorId = 42;
            request(url)
                .post('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(201)
                .end(function (err, res){
                    if (err) throw err;

                    pat_url = res.headers.location;
                    done();
                });
        });

        it('Doctor cant create new Patients Data if Social ID is in use', function (done){
            var tmp = data.doctor.newPatDataInvSocial;
            tmp.accountId = pat_id;
            tmp.doctorId = 42;
            request(url)
                .post('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(400)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });
        it('Doctor cant create new Patients Data if File ID is in use', function (done){
            var tmp = data.doctor.newPatDataInvFile;
            tmp.accountId = pat_id;
            tmp.doctorId = 42;
            request(url)
                .post('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(400)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });



        it('Patientslist should be N+1', function (done){
            request(url)
                .get('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function (err, res){
                    if (err) throw err;
                    res.body.should.have.property('patients');
                    res.body.patients.length.should.equal(list_length+1);

                    done();
                });
        });

        it('Doctor can get created Data (doctors id should be id of the current doc)', function (done){
            request(url)
                .get(pat_url)
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function (err, res){
                    if (err) throw err;

                    res.body.should.have.property('doctorId');
                    res.body.doctorId.should.equal(parseInt(doc_url.split("/").pop()));

                    done();
                });
        });
        it('Doctor can delete patients data', function (done){
            request(url)
                .del(pat_url)
                .set('Authorization', 'Bearer ' + access_token)
                .expect(204)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });

        it('Verifying Delete', function (done){
            request(url)
                .get('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(validStatusCodeForListOrEmptyList)
                .end(function (err, res){
                    if (err) throw err;
                    if (res.statusCode == 200) {
                        res.body.should.have.property('patients');
                        res.body.patients.length.should.equal(list_length);
                    }
                    done();
                });
        });


    });


    describe('Testing Functions as Patient:', function() {
        var access_token = null;
        var creds = {
            username: data.init.newPAcc.username,
            password: data.init.newPAcc.password,
            grant_type: 'password'
        };
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
                    res.body.should.have.property('expires_in');
                    res.body.should.have.property('role');
                    res.body.should.have.property('accountId');
                    res.body.should.have.property('refreshToken');
                    res.body.should.have.property('token_type');
                    res.body.role.should.equal('patient');
                    access_token = res.body.access_token;
                    done();
                });
        });

        it('Patients cant create new Patient data', function (done){
            request(url)
                .post('/patients')
                .set('Authorization', 'Bearer ' + access_token)
                .send (data.patient.dummyPat)
                .expect(403)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });
        it('Patient cant get his data', function (done){
            request(url)
                .get(('/patients/'+pat_id))
                .set('Authorization', 'Bearer ' + access_token)
                .expect(403)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });
        it('Patient cant update his data', function (done){
            request(url)
                .put(('/patients/'+pat_id))
                .set('Authorization', 'Bearer ' + access_token)
                .send (data.patient.dummyPat)
                .expect(403)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });
        it('Patient cant delete his data', function (done){
            request(url)
                .del(('/patients/'+pat_id))
                .set('Authorization', 'Bearer ' + access_token)
                .expect(403)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });

    });

    after('Cleaning Up...', function(done) {
        async.parallel([
            function (cb) {
                request(url)
                    .del(doc_url)
                    .set('Authorization', 'Bearer ' + access_token)
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
                    .set('Authorization', 'Bearer ' + access_token)
                    .expect(204)
                    .end(function (err, res) {
                        if (err) {
                            cb(err);
                        }
                        cb(null, res);
                    });
            }

        ], function (err, res) {
            if (err) throw err;
            done();
        });
    });

});