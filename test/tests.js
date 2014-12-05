/**
 * Mocha Tests...
 * Created by steimlfk on 05.12.14.
 */


var should = require('should');
var assert = require('assert');
var request = require('supertest');



describe('Admin Tests', function() {
    var url = 'http://localhost:3000';
    var access_token = null;
    // within before() you can run all the operations that are needed to setup your tests.
    // We need to login with an admin Account to run these Tests. When I'm done, I call done().
    before(function(done) {
        var creds =  {
            username: 'nimda',
            password: 'nimda',
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
                // this is should.js syntax, very clear
                res.body.should.have.property('access_token');
                res.body.should.have.property('expires_in');
                res.body.should.have.property('role');
                res.body.should.have.property('accountId');
                res.body.should.have.property('refreshToken');
                res.body.should.have.property('token_type');
                res.body.role.should.equal('admin');
                access_token = res.body.access_token;
                console.log('   Successfully authenticated as admin!')
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
    describe('Accounts', function() {
        var length = 0;
        it('Return all Accounts', function(done) {
            request(url)
                .get('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                // end handles the response
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    // this is should.js syntax, very clear
                    res.body.should.have.property('accounts').and.be.instanceof(Array);
                    length = res.body.accounts.length;
                    done();
                });
        });

        var newAcc = {
            "username": "mocha-admin1",
            "password": "admin1",
            "role": "admin",
            "email": "admin@mocha-test.de",
            "enabled": true,
            "reminderTime": "15:55",
            "notificationEnabled": true,
            "notificationMode": "sms",
            "mobile": "123"
        };

        it('Create an Admin-Account with sms Notification', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(newAcc)
                .expect(201)
                // end handles the response
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    // this is should.js syntax, very clear
                    done();
                });
        });

        var newDAcc = {
            "username": "mocha-doc1",
            "password": "doc1",
            "role": "doctor",
            "email": "doc1@mocha-test.de",
            "enabled": true,
            "reminderTime": "15:55",
            "notificationEnabled": true,
            "notificationMode": "email",
            "mobile": "234"
        };

        it('Create a Doctor-Account with EMail Notification', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(newDAcc)
                .expect(201)
                // end handles the response
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    // this is should.js syntax, very clear
                    done();
                });
        });

        var newPAcc = {
            "username": "mocha-pat1",
            "password": "pat1",
            "role": "patient",
            "email": "pat1@mocha-test.de",
            "enabled": true,
            "reminderTime": "15:55",
            "notificationEnabled": true,
            "notificationMode": "push",
            "mobile": "345"
        };

        it('Create a Patient-Account with Push Notification', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(newPAcc)
                .expect(201)
                // end handles the response
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    // this is should.js syntax, very clear
                    done();
                });
        });

        it('Length of Accountslist should be N+3', function(done) {
            request(url)
                .get('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .expect(200)
                // end handles the response
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    // this is should.js syntax, very clear
                    res.body.should.have.property('accounts').and.be.instanceof(Array).and.have.lengthOf(length+3);
                    done();
                });
        });


        var newAccInvalidRole = {
            "username": "mocha-fail",
            "password": "fail1",
            "role": "fail",
            "email": "fail1@mocha-test.de",
            "enabled": true,
            "reminderTime": "15:55",
            "notificationEnabled": true,
            "notificationMode": "email",
            "mobile": "345"
        };

        it('Create fails if invalid Role is used', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(newAccInvalidRole)
                .expect(400)
                // end handles the response
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    // this is should.js syntax, very clear
                    done();
                });
        });

        var newAccUsedMail = {
            "username": "mocha-fail",
            "password": "fail1",
            "role": "admin",
            "email": newAcc.email,
            "enabled": true,
            "reminderTime": "15:55",
            "notificationEnabled": true,
            "notificationMode": "email",
            "mobile": "345"
        };

        it('Create fails if E-Mail-Address is already in use', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(newAccUsedMail)
                .expect(400)
                // end handles the response
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    // this is should.js syntax, very clear
                    done();
                });
        });

        var newAccUsedUsername = {
            "username": newAcc.username,
            "password": "fail1",
            "role": "admin",
            "email": "fail@fail0r.de",
            "enabled": true,
            "reminderTime": "15:55",
            "notificationEnabled": true,
            "notificationMode": "email",
            "mobile": "345"
        };

        it('Create fails if Username is already in use', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(newAccUsedUsername)
                .expect(400)
                // end handles the response
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    // this is should.js syntax, very clear
                    done();
                });
        });

        var newAccInvMode = {
            "username": "fail01",
            "password": "fail1",
            "role": "admin",
            "email": "fail@fail0r.de",
            "enabled": true,
            "reminderTime": "15:55",
            "notificationEnabled": true,
            "notificationMode": "fail",
            "mobile": "345"
        };

        it('Create fails if invalid Notification Mode is used', function(done) {
            request(url)
                .post('/accounts')
                .set('Authorization', 'Bearer ' + access_token)
                .send(newAccInvMode)
                .expect(400)
                // end handles the response
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }
                    // this is should.js syntax, very clear
                    done();
                });
        });

    });
});