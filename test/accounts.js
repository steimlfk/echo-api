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
var data = require('./testdata/accounts.js');

describe('Accounts Tests:', function() {
    // Config Vars
    var url = config.url;
    var admin_username = config.admin_username;
    var admin_pwd = config.admin_pwd;

    // Internal vars for testing
    var access_token = null;
    var admin_url = null;
    var doc_url = null;
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

        request(url)
            .post('/login')
            .send(creds)
            .expect(200)
            // end handles the response
            .end(function(err, res) {
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
    // use describe to give a title to your test suite, in this case the tile is "Account"
    // and then specify a function in which we are going to declare all the tests
    // we want to run. Each test starts with the function it() and as a first argument
    // we have to provide a meaningful title for it, whereas as the second argument we
    // specify a function that takes a single parameter, "done", that we will use
    // to specify when our test is completed, and that's what makes easy
    // to perform async test!
    describe('Testing Functions as Admin:', function() {
        var length = 0;
        it('Return all Accounts', function(done) {
            request(url)
                .get('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('accounts').and.be.instanceof(Array);
                    length = res.body.accounts.length;
                    done();
                });
        });

        it('Create an Admin-Account with sms Notification', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.admin.newAcc)
                .expect(201)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    admin_url = res.headers.location;
                    done();
                });
        });

        it('Post empty Account', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.admin.emptyAcc)
                .expect(400)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    done();
                });
        });

        it('Put empty Account', function(done) {
            request(url)
                .put('/accounts/3')
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.admin.emptyAcc)
                .expect(400)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    done();
                });
        });

        it('Create a Doctor-Account with EMail Notification', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.admin.newDAcc)
                .expect(201)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    doc_url = res.headers.location;
                    done();
                });
        });


        it('Create a Patient-Account with Push Notification', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.admin.newPAcc)
                .expect(201)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    pat_url = res.headers.location;

                    done();
                });
        });

        it('Length of Accountslist should be N+3', function(done) {
            request(url)
                .get('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('accounts').and.be.instanceof(Array).and.have.lengthOf(length+3);
                    done();
                });
        });




        it('Create fails if invalid Role is used', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.admin.newAccInvalidRole)
                .expect(400)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    done();
                });
        });



        it('Create fails if E-Mail-Address is already in use', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.admin.newAccUsedMail)
                .expect(400)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    done();
                });
        });



        it('Create fails if Username is already in use', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.admin.newAccUsedUsername)
                .expect(400)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    done();
                });
        });



        it('Create fails if invalid Notification Mode is used', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.admin.newAccInvMode)
                .expect(400)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    done();
                });
        });



        it('Updating of created Doctors Account (trying to update username, password, email and role)', function(done) {
            request(url)
                .put(doc_url)
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.admin.updateTestDoc)
                .expect(204)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    done();
                });
        });

        it('Getting updated Account...(Role shouldnt have changed)', function(done) {
            request(url)
                .get(doc_url)
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('username');
                    res.body.username.should.equal(data.admin.updateTestDoc.username);
                    res.body.should.have.property('email');
                    res.body.email.should.equal(data.admin.updateTestDoc.email);
                    res.body.should.have.property('role');
                    res.body.role.should.equal(data.admin.newDAcc.role);
                    done();
                });
        });

        it('Deleting an Account', function(done) {
            request(url)
                .del(pat_url)
                .set('Authorization', 'Bearer ' + access_token)
                .expect(204)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    done();
                });
        });

        it('Length of Accountslist should be N+2', function(done) {
            request(url)
                .get('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('accounts').and.be.instanceof(Array).and.have.lengthOf(length+2);
                    done();
                });
        });

    });

    describe('Testing Functions as Doctor:', function() {
        var access_token = null;
        before('Logging in with newly created Doctor-Account', function(done) {
            var creds =  {
                username: data.admin.updateTestDoc.username,
                password: data.admin.updateTestDoc.password,
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


        it('Get Accountlist (Length should be 1)', function(done) {
            request(url)
                .get('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('accounts').and.be.instanceof(Array);
                    res.body.accounts.length.should.equal(1);
                    done();
                });
        });

        it('Get Own Accountdata', function(done) {
            request(url)
                .get(doc_url)
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('username');
                    res.body.should.have.property('email');
                    res.body.should.have.property('role');
                    res.body.should.have.property('enabled');
                    res.body.should.have.property('reminderTime');
                    res.body.should.have.property('notificationEnabled');
                    res.body.should.have.property('notificationMode');
                    res.body.should.have.property('mobile');
                    done();
                });
        });

        it('Doctor shouldnt be able to get any other Accountdata', function(done) {
            var res = doc_url.split("/");
            var id = parseInt(res[res.length-1]);
            var account_uri = '/accounts/'+(id-1);
            request(url)
                .get(account_uri)
                .set('Authorization', 'Bearer ' + access_token)
                .expect(404)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    done();
                });
        });

        it('Doctor can update his Account', function(done) {
            request(url)
                .put(doc_url)
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.doctor.updateOwnAccount)
                .expect(204)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    done();
                });
        });

        it('Doctor cant delete his Account', function(done) {
            request(url)
                .del(doc_url)
                .set('Authorization', 'Bearer ' + access_token)
                .expect(403)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    done();
                });
        });

        it('Create a Patient-Account', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.doctor.newPAcc)
                .expect(201)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    pat_url = res.headers.location;

                    done();
                });
        });

        it('Create fails if Role equals admin', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.doctor.newAAcc)
                .expect(400)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    done();
                });
        });

        it('Create fails if Role equals doctor', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.doctor.newDAcc)
                .expect(400)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    done();
                });
        });


    });

    describe('Testing Functions as Patient:', function() {
        var access_token = null;
        before('Logging in with newly created Patient-Account', function (done) {
            var creds = {
                username: data.doctor.newPAcc.username,
                password: data.doctor.newPAcc.password,
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

        it('Get Accountlist (Length should be 1)', function(done) {
            request(url)
                .get('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.body.should.have.property('accounts').and.be.instanceof(Array);
                    res.body.accounts.length.should.equal(1);
                    done();
                });
        });

        it('Get Own Accountdata', function(done) {
            request(url)
                .get(pat_url)
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('username');
                    res.body.should.have.property('email');
                    res.body.should.have.property('role');
                    res.body.should.have.property('enabled');
                    res.body.should.have.property('reminderTime');
                    res.body.should.have.property('notificationEnabled');
                    res.body.should.have.property('notificationMode');
                    res.body.should.have.property('mobile');
                    done();
                });
        });

        it('Patient shouldnt be able to get any other Accountdata', function(done) {
            var res = pat_url.split("/");
            var id = parseInt(res[res.length-1]);
            var account_uri = '/accounts/'+(id-1);
            request(url)
                .get(account_uri)
                .set('Authorization', 'Bearer ' + access_token)
                .expect(404)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    done();
                });
        });

        it('Patient can update his Account', function(done) {
            request(url)
                .put(pat_url)
                .set('Authorization', 'Bearer ' + access_token)
                .send(data.patient.updateOwnAccount)
                .expect(204)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    done();
                });
        });

        it('Patient cant delete his Account', function(done) {
            request(url)
                .del(pat_url)
                .set('Authorization', 'Bearer ' + access_token)
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
        async.parallel([
            function (cb) {
                request(url)
                    .del(admin_url)
                    .set('Authorization', 'Bearer ' + access_token)
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
                    .set('Authorization', 'Bearer ' + access_token)
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
                    .del(pat_url)
                    .set('Authorization', 'Bearer ' + access_token)
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