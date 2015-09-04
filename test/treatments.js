/**
 * Mocha Tests for Treatments records...
 * Created by steimlfk on 17.12.14.
 */


var should = require('should');
var assert = require('assert');
var request = require('supertest');
var async = require('async');


var config = require('./config.js');
var data = require('./testdata/treatments.js');

describe('Treatments Record Tests:', function() {
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

                        res.body.should.have.property('access_token');
                        res.body.should.have.property('expires_in');
                        res.body.should.have.property('role');
                        res.body.should.have.property('accountId');
                        res.body.should.have.property('refreshToken');
                        res.body.should.have.property('token_type');
                        res.body.role.should.equal('admin');
                        access_token_admin = res.body.access_token;
                        //admin_id = parseInt(res.body.accountId);
                        cb (null, res);
                    });
            },
            function(cb){
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
                        //doc_id = parseInt(doc_url.split("/").pop());
                        cb (null, res);
                    });
            },
            function(cb){
                request(url)
                    .post('/accounts')
                    .set('Authorization', 'Bearer ' + access_token_admin)
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

                        res.body.should.have.property('access_token');
                        res.body.should.have.property('expires_in');
                        res.body.should.have.property('role');
                        res.body.should.have.property('accountId');
                        res.body.should.have.property('refreshToken');
                        res.body.should.have.property('token_type');
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


    describe('Testing Functions as Admin:', function() {
        var access_token = null;
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

        /*
         var validStatusCodeForListOrEmptyList = function(res){
         return !(res.statusCode == 200 || res.statusCode == 204);

         };
         */

        it('Admin cant get List of Treatments Records of a certain Patient', function (done){
            request(url)
                .get(patData_url + '/treatments')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(403)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });

        it('Admin cant create new Treatments Record', function (done){
            request(url)
                .post(patData_url + '/treatments')
                .set('Authorization', 'Bearer ' + access_token)
                .send (data.admin.newTreatment)
                .expect(403)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });

        it('Admin cant get a certain Treatments Records of a certain Patient', function (done){
            request(url)
                .get(patData_url + '/treatments/42')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(403)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });


        it('Admin cant delete Treatments Record', function (done){
            request(url)
                .del(patData_url + '/treatments/42')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(403)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });

        it('Admin cant update a Treatments Record', function (done){
            request(url)
                .put(patData_url + '/treatments/42')
                .set('Authorization', 'Bearer ' + access_token)
                .send (data.admin.newTreatment)
                .expect(403)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });



    });

    describe('Testing Functions as Doctor:', function() {
        var access_token = null;
        var list_length = 0;
        var exam_url, exam2_url;
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

        it('Doctor can get Treatments Records of his patients', function (done){
            request(url)
                .get(patData_url+'/treatments')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(validStatusCodeForListOrEmptyList)
                .end(function (err, res){
                    if (err) throw err;
                    if (res.statusCode == 200) {
                        res.body.should.have.property('treatments');
                        res.headers.should.have.property('Last-Modified');
                        list_length = res.body.treatments.length;
                    }
                    else list_length = 0;
                    done();
                });
        });

        it('Doctor can create new Treatments Records Data (baseline)', function (done){
            var tmp = data.doctor.newTreatment;
            tmp.status = "baseline";
            request(url)
                .post(patData_url+'/treatments')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(201)
                .end(function (err, res){
                    if (err) throw err;

                    exam_url = res.headers.location;
                    done();
                });
        });

        it('Post empty Treatment', function (done){
            var tmp = data.doctor.emptyTreatment;
            request(url)
                .post(patData_url+'/treatments')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(400)
                .end(function (err, res){
                    if (err) throw err;

                    done();
                });
        });

        it('Doctor can create new Treatments Records Data (exacerbation)', function (done){
            var tmp = data.doctor.newTreatment;
            tmp.status = "exacerbation";
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth()+1; //January is 0!
            var yyyy = today.getFullYear();
            tmp.diagnoseDate = yyyy+'-'+mm+'-'+dd;
            request(url)
                .post(patData_url+'/treatments')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(201)
                .end(function (err, res){
                    if (err) throw err;

                    exam2_url = res.headers.location;
                    done();
                });
        });


        it('Doctor cant create new Treatments Records Data with status any other than baseline or exacerbation', function (done){
            var tmp = data.doctor.newTreatment;
            tmp.status = "fine";
            request(url)
                .post(patData_url+'/treatments')
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(400)
                .end(function (err, res){
                    if (err) throw err;

                    done();
                });
        });

        it('Recordslists Length should be N+2', function (done){
            request(url)
                .get(patData_url+'/treatments')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function (err, res){
                    if (err) throw err;
                    res.body.should.have.property('treatments');
                    res.body.treatments.length.should.equal(list_length+2);
                    res.headers.should.have.property('last-modified');

                    done();
                });
        });

        it('Doctor can get created Data', function (done){
            var c = data.doctor.newTreatment;
            request(url)
                .get(exam_url)
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function (err, res){
                    if (err) throw err;
                    res.headers.should.have.property('last-modified');


                    done();
                });
        });

        it('Doctor can update Treatments Records Data', function (done){
            var tmp = data.doctor.newTreatment;
            tmp.status = "exacerbation";
            tmp.mycolytocis = true;
            request(url)
                .put(exam2_url)
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(204)
                .end(function (err, res){
                    if (err) throw err;

                    done();
                });
        });

        it('Put empty Treatment', function (done){
            var tmp = data.doctor.emptyTreatment;
            request(url)
                .put(exam2_url)
                .set('Authorization', 'Bearer ' + access_token)
                .send (tmp)
                .expect(400)
                .end(function (err, res){
                    if (err) throw err;

                    done();
                });
        });

        it('Doctor can delete certain Treatments Records', function (done){
            async.series
            ([
                function (cb) {
                    request(url)
                        .del(exam_url)
                        .set('Authorization', 'Bearer ' + access_token)
                        .expect(204)
                        .end(function (err, res){
                            if (err) throw cb(err);
                            cb(null, res);
                        });
                },
                function (cb) {
                    request(url)
                        .del(exam2_url)
                        .set('Authorization', 'Bearer ' + access_token)
                        .expect(204)
                        .end(function (err, res){
                            if (err) throw cb(err);
                            cb(null, res);

                        });
                },
                function (cb) {
                    request(url)
                        .get(patData_url+'/treatments')
                        .set('Authorization', 'Bearer ' + access_token)
                        .expect(validStatusCodeForListOrEmptyList)
                        .end(function (err, res){
                            if (err) throw err;
                            if (res.statusCode == 200) {
                                res.body.should.have.property('treatments');
                                res.body.treatments.length.should.equal(list_length);
                            }
                            if (err) throw cb(err);
                            cb(null, res);

                        });
                }

            ], function (err, res) {
                if (err) throw err;
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

        it('Patient cant get his List of Treatments Records', function (done){
            request(url)
                .get(patData_url + '/treatments')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(403)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });

        it('Patient cant create new Treatments Record', function (done){
            request(url)
                .post(patData_url + '/treatments')
                .set('Authorization', 'Bearer ' + access_token)
                .send (data.admin.newTreatment)
                .expect(403)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });

        it('Patient cant get a certain Treatments Record', function (done){
            request(url)
                .get(patData_url + '/treatments/42')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(403)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });


        it('Patient cant delete Treatments Record', function (done){
            request(url)
                .del(patData_url + '/treatments/42')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(403)
                .end(function (err, res){
                    if (err) throw err;
                    done();
                });
        });

        it('Patient cant update a Treatments Record', function (done){
            request(url)
                .put(patData_url + '/treatments/42')
                .set('Authorization', 'Bearer ' + access_token)
                .send (data.admin.newTreatment)
                .expect(403)
                .end(function (err, res){
                    if (err) throw err;
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
                    .del(doc_url)
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
            }

        ], function (err, res) {
            if (err) throw err;
            done();
        });
    });

});